/**
 * ADB over WebUSB — Browser-native ADB client
 * No external dependencies. Uses WebUSB + Web Crypto API.
 */

const ADB_VERSION = 0x01000001;
const MAX_PAYLOAD = 256 * 1024;

const CMD = {
  CNXN: 0x4e584e43,
  OPEN: 0x4e45504f,
  OKAY: 0x59414b4f,
  CLSE: 0x45534c43,
  WRTE: 0x45545257,
  AUTH: 0x48545541,
  STLS: 0x534c5453,
};

const AUTH_TYPE = {
  TOKEN: 1,
  SIGNATURE: 2,
  RSA_PUBLIC: 3,
};

const ADB_CLASS = 0xFF;
const ADB_SUBCLASS = 0x42;
const ADB_PROTOCOL = 0x01;

function encodeUtf8(str) {
  return new TextEncoder().encode(str);
}

function decodeUtf8(buf) {
  return new TextDecoder().decode(buf);
}

function cmdStr(cmd) {
  return String.fromCharCode(cmd & 0xFF, (cmd >> 8) & 0xFF, (cmd >> 16) & 0xFF, (cmd >> 24) & 0xFF);
}

class AdbMessage {
  constructor(command, arg0, arg1, data = null) {
    this.command = command;
    this.arg0 = arg0;
    this.arg1 = arg1;
    this.data = data || new Uint8Array(0);
  }

  get dataLength() { return this.data.length; }
  get checksum() {
    let sum = 0;
    for (let i = 0; i < this.data.length; i++) sum += this.data[i];
    return sum >>> 0;
  }
  get magic() { return (this.command ^ 0xFFFFFFFF) >>> 0; }

  toBuffer() {
    const header = new ArrayBuffer(24);
    const v = new DataView(header);
    v.setUint32(0, this.command, true);
    v.setUint32(4, this.arg0, true);
    v.setUint32(8, this.arg1, true);
    v.setUint32(12, this.dataLength, true);
    v.setUint32(16, this.checksum, true);
    v.setUint32(20, this.magic, true);
    if (this.data.length > 0) {
      const buf = new Uint8Array(24 + this.data.length);
      buf.set(new Uint8Array(header), 0);
      buf.set(this.data, 24);
      return buf;
    }
    return new Uint8Array(header);
  }
}

class AdbWebUsbTransport {
  constructor(device) {
    this.device = device;
    this.ifaceNum = -1;
    this.endpointIn = null;
    this.endpointOut = null;
    this._readLoop = false;
    this._pendingReads = [];
    this._buffer = new Uint8Array(0);
  }

  async connect() {
    await this.device.open();

    // Find ADB interface
    for (const cfg of this.device.configurations) {
      for (const iface of cfg.interfaces) {
        for (const alt of iface.alternates) {
          if (alt.interfaceClass === ADB_CLASS &&
              alt.interfaceSubclass === ADB_SUBCLASS &&
              alt.interfaceProtocol === ADB_PROTOCOL) {
            this.ifaceNum = iface.interfaceNumber;
            await this.device.selectConfiguration(cfg.configurationValue);
            await this.device.claimInterface(iface.interfaceNumber);

            for (const ep of alt.endpoints) {
              if (ep.direction === 'in') this.endpointIn = ep;
              if (ep.direction === 'out') this.endpointOut = ep;
            }
            break;
          }
        }
      }
    }

    if (!this.endpointIn || !this.endpointOut) {
      throw new Error('No se encontró interfaz ADB en el dispositivo. ¿Está activada la depuración USB?');
    }

    this._startReadLoop();
  }

  async _startReadLoop() {
    this._readLoop = true;
    const read = async () => {
      while (this._readLoop) {
        try {
          const result = await this.device.transferIn(this.endpointIn.endpointNumber, 24);
          if (result.data.byteLength === 24) {
            const v = new DataView(result.data.buffer);
            const cmd = v.getUint32(0, true);
            const arg0 = v.getUint32(4, true);
            const arg1 = v.getUint32(8, true);
            const dataLen = v.getUint32(12, true);

            let data = new Uint8Array(0);
            if (dataLen > 0) {
              let received = 0;
              const chunks = [];
              while (received < dataLen) {
                const toRead = Math.min(dataLen - received, MAX_PAYLOAD);
                const dataResult = await this.device.transferIn(this.endpointIn.endpointNumber, toRead);
                if (dataResult.data.byteLength > 0) {
                  chunks.push(new Uint8Array(dataResult.data.buffer));
                  received += dataResult.data.byteLength;
                }
              }
              data = new Uint8Array(dataLen);
              let offset = 0;
              for (const chunk of chunks) {
                data.set(chunk, offset);
                offset += chunk.length;
              }
            }

            const msg = new AdbMessage(cmd, arg0, arg1, data);
            if (this._pendingReads.length > 0) {
              const { resolve } = this._pendingReads.shift();
              resolve(msg);
            } else {
              this._buffer = msg;
            }
          }
        } catch (err) {
          if (!this._readLoop) break;
          // Device disconnected
          this._readLoop = false;
          if (this.onDisconnect) this.onDisconnect(err);
          break;
        }
      }
    };
    read();
  }

  async send(msg) {
    const buf = msg.toBuffer();
    let offset = 0;
    while (offset < buf.length) {
      const chunk = buf.slice(offset, offset + MAX_PAYLOAD);
      await this.device.transferOut(this.endpointOut.endpointNumber, chunk);
      offset += chunk.length;
    }
  }

  async receive() {
    if (this._buffer) {
      const msg = this._buffer;
      this._buffer = null;
      return msg;
    }
    return new Promise((resolve, reject) => {
      this._pendingReads.push({ resolve, reject });
    });
  }

  async close() {
    this._readLoop = false;
    try {
      if (this.device.opened) {
        await this.device.releaseInterface(this.ifaceNum);
        await this.device.close();
      }
    } catch (e) {}
  }
}

class AdbClient {
  constructor() {
    this.transport = null;
    this.device = null;
    this.connected = false;
    this.deviceInfo = {};
    this._streamId = 0;
    this._streams = new Map();
    this._key = null;
  }

  async _generateKey() {
    if (this._key) return this._key;
    const keyPair = await crypto.subtle.generateKey(
      { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-1' },
      true, ['sign', 'verify']
    );
    const pubKeyDer = await crypto.subtle.exportKey('spki', keyPair.publicKey);
    const privKeyPkcs8 = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
    this._key = { publicKey: keyPair.publicKey, privateKey: keyPair.privateKey, pubKeyDer, privKeyPkcs8 };
    return this._key;
  }

  async _sign(data) {
    const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', this._key.privateKey, data);
    return new Uint8Array(sig);
  }

  async _authSequence() {
    const key = await this._generateKey();
    let authenticated = false;

    while (!authenticated) {
      const msg = await this.transport.receive();

      if (msg.command === CMD.AUTH && msg.arg0 === AUTH_TYPE.TOKEN) {
        // Sign the token
        const signature = await this._sign(msg.data);
        const authMsg = new AdbMessage(CMD.AUTH, AUTH_TYPE.SIGNATURE, 0, signature);
        await this.transport.send(authMsg);

        // Wait for response
        const resp = await this.transport.receive();
        if (resp.command === CMD.CNXN) {
          authenticated = true;
          return resp;
        } else if (resp.command === CMD.AUTH && resp.arg0 === AUTH_TYPE.TOKEN) {
          // Device rejected signature, send public key
          const pkMsg = new AdbMessage(CMD.AUTH, AUTH_TYPE.RSA_PUBLIC, 0, key.pubKeyDer);
          await this.transport.send(pkMsg);

          // Device will show auth dialog, wait for CNXN
          const finalResp = await this.transport.receive();
          if (finalResp.command === CMD.CNXN) {
            authenticated = true;
            return finalResp;
          }
        }
      } else if (msg.command === CMD.CNXN) {
        authenticated = true;
        return msg;
      }
    }
  }

  async connect(device) {
    // If device already provided (from requestDevice), use it directly
    // Otherwise try to find already-authorized devices
    if (device) {
      this.device = device;
    } else {
      const devices = await navigator.usb.getDevices();
      const adbDevices = devices.filter(d => {
        return d.configurations.some(c =>
          c.interfaces.some(i =>
            i.alternates.some(a =>
              a.interfaceClass === ADB_CLASS &&
              a.interfaceSubclass === ADB_SUBCLASS &&
              a.interfaceProtocol === ADB_PROTOCOL
            )
          )
        );
      });

      if (adbDevices.length === 0) {
        // No authorized devices — caller should have used requestDevice first
        throw new Error('No hay dispositivos autorizados. Hacé clic en Conectar y seleccioná tu teléfono.');
      }
      this.device = adbDevices[0];
    }

    this.transport = new AdbWebUsbTransport(this.device);
    await this.transport.connect();

    // Send CNXN
    const cnxnMsg = new AdbMessage(CMD.CNXN, ADB_VERSION, MAX_PAYLOAD, encodeUtf8('host::features=shell_v2,cmd,stat_v2,ls_v2,fixed_push_mkdir,apex,abb,fixed_push_symlink_timestamp,abb_exec,remount_shell,track_app,sendrecv_v2,sendrecv_v2_brotli,sendrecv_v2_lz4,sendrecv_v2_zstd,sendrecv_v2_dry_run_send,openscreen_metrics'));
    await this.transport.send(cnxnMsg);

    // Handle auth
    const resp = await this._authSequence();

    if (resp.command !== CMD.CNXN) {
      throw new Error('Falló la autenticación ADB');
    }

    this.connected = true;
    this.deviceInfo = {
      banner: decodeUtf8(resp.data).replace(/\0/g, ''),
      maxPayload: resp.arg1,
      deviceId: this.device.serialNumber || 'unknown',
      vendorId: this.device.vendorId,
      productId: this.device.productId,
    };

    return this.deviceInfo;
  }

  async requestDevice() {
    this.device = await navigator.usb.requestDevice({
      filters: [
        { classCode: ADB_CLASS, subclassCode: ADB_SUBCLASS, protocolCode: ADB_PROTOCOL }
      ]
    });
    return this.device;
  }

  async shell(command) {
    if (!this.connected) throw new Error('No conectado');

    const localId = ++this._streamId;
    const remoteId = 0;

    // OPEN a shell stream
    const openMsg = new AdbMessage(CMD.OPEN, localId, 0, encodeUtf8(`shell:${command}\0`));
    await this.transport.send(openMsg);

    // Wait for OKAY
    const okay = await this.transport.receive();
    if (okay.command !== CMD.OKAY) {
      throw new Error(`Error abriendo shell: ${cmdStr(okay.command)}`);
    }
    const actualRemoteId = okay.arg0;

    // Read output
    let output = '';
    while (true) {
      const msg = await this.transport.receive();
      if (msg.command === CMD.WRTE) {
        output += decodeUtf8(msg.data);
        // Send OKAY to acknowledge
        const ack = new AdbMessage(CMD.OKAY, localId, actualRemoteId);
        await this.transport.send(ack);
      } else if (msg.command === CMD.CLSE) {
        // Close our side
        const close = new AdbMessage(CMD.CLSE, localId, actualRemoteId);
        await this.transport.send(close);
        break;
      } else if (msg.command === CMD.OKAY) {
        // Stream ready
      }
    }

    return output;
  }

  async disconnect() {
    this.connected = false;
    if (this.transport) {
      await this.transport.close();
    }
  }

  isSupported() {
    return !!navigator.usb;
  }
}

// Export
window.AdbClient = AdbClient;
