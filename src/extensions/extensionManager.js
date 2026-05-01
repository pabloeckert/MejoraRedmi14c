/**
 * Extension Manager - Sistema de extensiones
 * Permite registrar módulos externos, scripts ADB y paneles UI
 */

const fs = require('fs-extra');
const path = require('path');

const EXTENSIONS_DIR = path.join(__dirname, '..', '..', 'extensions');

class ExtensionManager {
  constructor() {
    this.extensions = new Map();
    this.adbScripts = new Map();
    this.uiPanels = new Map();
  }

  /**
   * Registra una extensión
   */
  register(extension) {
    if (!extension.id || !extension.name) {
      throw new Error('La extensión debe tener id y name');
    }

    const ext = {
      id: extension.id,
      name: extension.name,
      version: extension.version || '1.0.0',
      description: extension.description || '',
      author: extension.author || 'Unknown',
      enabled: extension.enabled !== false,
      loadedAt: new Date().toISOString(),
      ...extension,
    };

    this.extensions.set(ext.id, ext);

    // Registrar scripts ADB si los tiene
    if (extension.adbScripts) {
      for (const [name, script] of Object.entries(extension.adbScripts)) {
        this.adbScripts.set(`${ext.id}.${name}`, {
          extensionId: ext.id,
          name,
          ...script,
        });
      }
    }

    // Registrar panel UI si lo tiene
    if (extension.uiPanel) {
      this.uiPanels.set(ext.id, {
        extensionId: ext.id,
        ...extension.uiPanel,
      });
    }

    console.log(`[EXT] Extensión registrada: ${ext.name} v${ext.version}`);
    return ext;
  }

  /**
   * Carga extensiones desde el directorio
   */
  async loadFromDisk() {
    await fs.ensureDir(EXTENSIONS_DIR);

    try {
      const entries = await fs.readdir(EXTENSIONS_DIR);
      let loaded = 0;

      for (const entry of entries) {
        const extDir = path.join(EXTENSIONS_DIR, entry);
        const manifestPath = path.join(extDir, 'manifest.json');

        if (await fs.pathExists(manifestPath)) {
          try {
            const manifest = await fs.readJson(manifestPath);
            const extModule = {};

            // Cargar script principal si existe
            const mainPath = path.join(extDir, manifest.main || 'index.js');
            if (await fs.pathExists(mainPath)) {
              try {
                Object.assign(extModule, require(mainPath));
              } catch (e) {
                console.warn(`[EXT] Error cargando ${entry}: ${e.message}`);
              }
            }

            this.register({ ...manifest, ...extModule });
            loaded++;
          } catch (err) {
            console.warn(`[EXT] Error procesando ${entry}: ${err.message}`);
          }
        }
      }

      console.log(`[EXT] ${loaded} extensiones cargadas desde disco`);
      return loaded;
    } catch (err) {
      console.warn(`[EXT] Error leyendo directorio: ${err.message}`);
      return 0;
    }
  }

  /**
   * Desregistra una extensión
   */
  unregister(extensionId) {
    const ext = this.extensions.get(extensionId);
    if (!ext) return false;

    // Limpiar scripts ADB
    for (const [key, script] of this.adbScripts) {
      if (script.extensionId === extensionId) {
        this.adbScripts.delete(key);
      }
    }

    // Limpiar panel UI
    this.uiPanels.delete(extensionId);

    this.extensions.delete(extensionId);
    console.log(`[EXT] Extensión desregistrada: ${ext.name}`);
    return true;
  }

  /**
   * Habilita/deshabilita una extensión
   */
  toggle(extensionId, enabled) {
    const ext = this.extensions.get(extensionId);
    if (!ext) return false;
    ext.enabled = enabled;
    return true;
  }

  /**
   * Lista todas las extensiones
   */
  list() {
    return Array.from(this.extensions.values());
  }

  /**
   * Obtiene scripts ADB de extensiones habilitadas
   */
  getAdbScripts() {
    const scripts = [];
    for (const [key, script] of this.adbScripts) {
      const ext = this.extensions.get(script.extensionId);
      if (ext?.enabled) {
        scripts.push({ key, ...script });
      }
    }
    return scripts;
  }

  /**
   * Obtiene paneles UI de extensiones habilitadas
   */
  getUiPanels() {
    const panels = [];
    for (const [id, panel] of this.uiPanels) {
      const ext = this.extensions.get(id);
      if (ext?.enabled) {
        panels.push({ ...panel, extensionName: ext.name });
      }
    }
    return panels;
  }

  /**
   * Ejecuta un script de extensión
   */
  async runScript(extensionId, scriptName, deviceId, ...args) {
    const key = `${extensionId}.${scriptName}`;
    const script = this.adbScripts.get(key);
    if (!script) throw new Error(`Script no encontrado: ${key}`);

    const ext = this.extensions.get(extensionId);
    if (!ext?.enabled) throw new Error(`Extensión deshabilitada: ${extensionId}`);

    if (typeof script.execute === 'function') {
      return await script.execute(deviceId, ...args);
    }

    throw new Error('Script no tiene función execute');
  }
}

module.exports = new ExtensionManager();
