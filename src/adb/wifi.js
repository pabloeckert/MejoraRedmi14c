/**
 * WiFi ADB - Conexión inalámbrica al dispositivo
 * Permite ADB over TCP/IP sin cable USB
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const adb = require('./adbClient');

const ADB_TCP_PORT = 5555;

class WiFiADB {
  constructor() {
    this.wifiConnections = new Map(); // deviceId → { ip, port, connected }
  }

  /**
   * Habilita TCP/IP en el dispositivo (requiere USB conectado)
   */
  async enableTcpIp(deviceId, port = ADB_TCP_PORT) {
    try {
      await adb.run(`tcpip ${port}`, deviceId);
      // Esperar a que el daemon reinicie en modo TCP
      await new Promise(r => setTimeout(r, 2000));
      return { success: true, port };
    } catch (err) {
      throw new Error(`Error habilitando TCP/IP: ${err.message}`);
    }
  }

  /**
   * Obtiene la IP del dispositivo en la red WiFi
   */
  async getDeviceIP(deviceId) {
    try {
      // Método 1: ip addr show wlan0
      const output = await adb.run('shell ip addr show wlan0', deviceId);
      const match = output.match(/inet\s+(\d+\.\d+\.\d+\.\d+)/);
      if (match) return match[1];

      // Método 2: ifconfig wlan0
      const output2 = await adb.run('shell ifconfig wlan0', deviceId);
      const match2 = output2.match(/inet addr:(\d+\.\d+\.\d+\.\d+)/);
      if (match2) return match2[1];

      // Método 3: dumpsys wifi
      const output3 = await adb.run('shell dumpsys wifi', deviceId);
      const match3 = output3.match(/mWifiInfo.*ipAddress=(\d+\.\d+\.\d+\.\d+)/);
      if (match3) return match3[1];

      throw new Error('No se pudo obtener la IP del dispositivo');
    } catch (err) {
      throw new Error(`Error obteniendo IP: ${err.message}`);
    }
  }

  /**
   * Conecta al dispositivo por WiFi
   */
  async connectOverWifi(deviceId, ip, port = ADB_TCP_PORT) {
    try {
      // Primero habilitar TCP/IP via USB
      await this.enableTcpIp(deviceId, port);

      // Obtener IP si no se proporcionó
      if (!ip) {
        ip = await this.getDeviceIP(deviceId);
      }

      // Conectar via WiFi
      const { stdout } = await execAsync(
        `adb connect ${ip}:${port}`,
        { timeout: 15000 }
      );

      if (stdout.includes('connected') || stdout.includes('already')) {
        this.wifiConnections.set(deviceId, {
          ip,
          port,
          connected: true,
          connectedAt: new Date().toISOString(),
        });

        return {
          success: true,
          ip,
          port,
          message: `Conectado a ${ip}:${port}`,
        };
      }

      throw new Error(`Respuesta inesperada: ${stdout}`);
    } catch (err) {
      throw new Error(`Error conectando por WiFi: ${err.message}`);
    }
  }

  /**
   * Verifica si la conexión WiFi sigue activa
   */
  async verifyWifiConnection(deviceId) {
    const conn = this.wifiConnections.get(deviceId);
    if (!conn) return { connected: false, reason: 'No hay conexión WiFi registrada' };

    try {
      await adb.run('shell echo ok', `${conn.ip}:${conn.port}`);
      return { connected: true, ip: conn.ip, port: conn.port };
    } catch {
      this.wifiConnections.set(deviceId, { ...conn, connected: false });
      return { connected: false, reason: 'Conexión perdida' };
    }
  }

  /**
   * Desconecta WiFi
   */
  async disconnect(deviceId) {
    const conn = this.wifiConnections.get(deviceId);
    if (!conn) return;

    try {
      await execAsync(`adb disconnect ${conn.ip}:${conn.port}`, { timeout: 5000 });
    } catch {}

    this.wifiConnections.delete(deviceId);
  }

  /**
   * Reconecta automáticamente
   */
  async autoReconnect(deviceId) {
    const conn = this.wifiConnections.get(deviceId);
    if (!conn) return false;

    try {
      const { stdout } = await execAsync(
        `adb connect ${conn.ip}:${conn.port}`,
        { timeout: 10000 }
      );
      const success = stdout.includes('connected') || stdout.includes('already');
      if (success) {
        this.wifiConnections.set(deviceId, { ...conn, connected: true });
      }
      return success;
    } catch {
      return false;
    }
  }

  /**
   * Lista conexiones WiFi activas
   */
  getActiveConnections() {
    const active = [];
    for (const [deviceId, conn] of this.wifiConnections) {
      if (conn.connected) {
        active.push({ deviceId, ...conn });
      }
    }
    return active;
  }

  /**
   * Verifica si un deviceId es conexión WiFi
   */
  isWifiConnection(deviceId) {
    return deviceId.includes(':') || this.wifiConnections.has(deviceId);
  }
}

module.exports = new WiFiADB();
