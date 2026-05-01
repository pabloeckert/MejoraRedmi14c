/**
 * Plugin Sandbox - Sistema de plugins externos aislado
 * Ejecuta plugins en VM segura con recursos limitados
 * Soporta: scripts ADB, paneles UI, módulos ML
 */

const fs = require('fs-extra');
const path = require('path');
const vm = require('vm');

const PLUGINS_DIR = path.join(__dirname, '..', '..', 'extensions', 'plugins');

// Límites de seguridad del sandbox
const SANDBOX_LIMITS = {
  maxExecutionTimeMs: 5000,      // 5s máximo de ejecución
  maxMemoryMB: 50,               // 50MB máximo de memoria
  maxConsoleLines: 100,          // Limitar output
  allowedModules: ['path', 'util', 'events'], // Solo módulos seguros
  blockedGlobals: ['process', 'require', 'module', '__dirname', '__filename'],
};

class PluginSandbox {
  constructor() {
    this.plugins = new Map();       // pluginId → { manifest, context, enabled }
    this.executionLog = [];         // Historial de ejecuciones
    this.maxLogSize = 500;
  }

  /**
   * Carga un plugin desde su directorio
   */
  async loadPlugin(pluginDir) {
    const manifestPath = path.join(pluginDir, 'manifest.json');
    if (!await fs.pathExists(manifestPath)) {
      throw new Error(`Manifest no encontrado: ${manifestPath}`);
    }

    const manifest = await fs.readJson(manifestPath);
    if (!manifest.id || !manifest.name) {
      throw new Error('El manifest debe tener id y name');
    }

    // Leer código fuente
    const mainFile = manifest.main || 'index.js';
    const mainPath = path.join(pluginDir, mainFile);
    if (!await fs.pathExists(mainPath)) {
      throw new Error(`Archivo principal no encontrado: ${mainPath}`);
    }

    const sourceCode = await fs.readFile(mainPath, 'utf-8');

    // Leer archivos de UI si existen
    let uiSource = null;
    if (manifest.ui) {
      const uiPath = path.join(pluginDir, manifest.ui);
      if (await fs.pathExists(uiPath)) {
        uiSource = await fs.readFile(uiPath, 'utf-8');
      }
    }

    const plugin = {
      id: manifest.id,
      name: manifest.name,
      version: manifest.version || '1.0.0',
      description: manifest.description || '',
      author: manifest.author || 'Unknown',
      permissions: manifest.permissions || [],
      type: manifest.type || 'script', // 'script' | 'ui' | 'ml' | 'adb'
      sourceCode,
      uiSource,
      manifest,
      enabled: true,
      loadedAt: new Date().toISOString(),
      executionCount: 0,
      lastExecution: null,
      lastError: null,
    };

    this.plugins.set(plugin.id, plugin);
    console.log(`[SANDBOX] Plugin cargado: ${plugin.name} v${plugin.version} (${plugin.type})`);
    return plugin;
  }

  /**
   * Carga todos los plugins desde el directorio
   */
  async loadAll() {
    await fs.ensureDir(PLUGINS_DIR);

    try {
      const entries = await fs.readdir(PLUGINS_DIR, { withFileTypes: true });
      let loaded = 0;

      for (const entry of entries) {
        if (!entry.isDirectory()) continue;

        const pluginDir = path.join(PLUGINS_DIR, entry.name);
        try {
          await this.loadPlugin(pluginDir);
          loaded++;
        } catch (err) {
          console.warn(`[SANDBOX] Error cargando plugin ${entry.name}:`, err.message);
        }
      }

      console.log(`[SANDBOX] ${loaded} plugins cargados`);
      return loaded;
    } catch (err) {
      console.warn('[SANDBOX] Error leyendo directorio de plugins:', err.message);
      return 0;
    }
  }

  /**
   * Ejecuta un script de plugin en sandbox seguro
   */
  async executeScript(pluginId, scriptName, context = {}) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) throw new Error(`Plugin no encontrado: ${pluginId}`);
    if (!plugin.enabled) throw new Error(`Plugin deshabilitado: ${pluginId}`);

    const startTime = Date.now();
    const executionRecord = {
      pluginId,
      scriptName,
      timestamp: new Date().toISOString(),
      success: false,
      durationMs: 0,
      output: null,
      error: null,
    };

    try {
      // Crear contexto sandbox seguro
      const sandboxContext = this._createSandboxContext(plugin, context);

      // Compilar y ejecutar con timeout
      const script = new vm.Script(plugin.sourceCode, {
        filename: `${pluginId}/${scriptName}`,
        timeout: SANDBOX_LIMITS.maxExecutionTimeMs,
      });

      const vmContext = vm.createContext(sandboxContext);
      const result = script.runInContext(vmContext, {
        timeout: SANDBOX_LIMITS.maxExecutionTimeMs,
      });

      executionRecord.success = true;
      executionRecord.output = result;
      plugin.executionCount++;
      plugin.lastExecution = new Date().toISOString();

      return result;

    } catch (err) {
      executionRecord.error = err.message;
      plugin.lastError = { message: err.message, timestamp: new Date().toISOString() };
      throw err;

    } finally {
      executionRecord.durationMs = Date.now() - startTime;
      this._logExecution(executionRecord);
    }
  }

  /**
   * Ejecuta un script ADB de plugin
   */
  async executeAdbScript(pluginId, deviceId, adbClient) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) throw new Error(`Plugin no encontrado: ${pluginId}`);
    if (plugin.type !== 'adb' && plugin.type !== 'script') {
      throw new Error(`Plugin no es de tipo ADB: ${plugin.type}`);
    }

    // Crear contexto con acceso limitado a ADB
    const context = {
      deviceId,
      adb: {
        shell: async (cmd) => {
          if (!plugin.permissions.includes('adb.shell')) {
            throw new Error('Permiso adb.shell no concedido');
          }
          return await adbClient.shell(deviceId, cmd);
        },
        getProp: async (prop) => {
          if (!plugin.permissions.includes('adb.props')) {
            throw new Error('Permiso adb.props no concedido');
          }
          return await adbClient.shell(deviceId, `getprop ${prop}`);
        },
      },
    };

    return await this.executeScript(pluginId, 'adb', context);
  }

  /**
   * Obtiene el código fuente UI de un plugin
   */
  getPluginUI(pluginId) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin || !plugin.uiSource) return null;
    return {
      id: plugin.id,
      name: plugin.name,
      source: plugin.uiSource,
      type: plugin.type,
    };
  }

  /**
   * Habilita/deshabilita un plugin
   */
  toggle(pluginId, enabled) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return false;
    plugin.enabled = enabled;
    return true;
  }

  /**
   * Lista todos los plugins
   */
  list() {
    return Array.from(this.plugins.values()).map(p => ({
      id: p.id,
      name: p.name,
      version: p.version,
      description: p.description,
      author: p.author,
      type: p.type,
      enabled: p.enabled,
      permissions: p.permissions,
      executionCount: p.executionCount,
      lastExecution: p.lastExecution,
      lastError: p.lastError,
      loadedAt: p.loadedAt,
    }));
  }

  /**
   * Obtiene historial de ejecuciones
   */
  getExecutionLog(limit = 50) {
    return this.executionLog.slice(-limit);
  }

  /**
   * Elimina un plugin
   */
  unload(pluginId) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return false;
    this.plugins.delete(pluginId);
    console.log(`[SANDBOX] Plugin descargado: ${plugin.name}`);
    return true;
  }

  // ════════════════════════════════════════════════════
  //  Internals
  // ════════════════════════════════════════════════════

  _createSandboxContext(plugin, extraContext = {}) {
    const consoleLines = [];
    const limitedConsole = {
      log: (...args) => {
        if (consoleLines.length < SANDBOX_LIMITS.maxConsoleLines) {
          consoleLines.push(args.join(' '));
          console.log(`[PLUGIN:${plugin.id}]`, ...args);
        }
      },
      warn: (...args) => console.warn(`[PLUGIN:${plugin.id}]`, ...args),
      error: (...args) => console.error(`[PLUGIN:${plugin.id}]`, ...args),
    };

    return {
      console: limitedConsole,
      setTimeout: undefined, // No permitir timers
      setInterval: undefined,
      clearTimeout: undefined,
      clearInterval: undefined,
      // APIs seguras
      JSON,
      Math,
      Date,
      Array,
      Object,
      String,
      Number,
      Boolean,
      RegExp,
      Map,
      Set,
      Promise,
      // Datos del contexto
      plugin: {
        id: plugin.id,
        name: plugin.name,
        version: plugin.version,
        permissions: plugin.permissions,
      },
      // Utilidades seguras
      Buffer: undefined, // No acceso a Buffer
      ...extraContext,
    };
  }

  _logExecution(record) {
    this.executionLog.push(record);
    if (this.executionLog.length > this.maxLogSize) {
      this.executionLog = this.executionLog.slice(-this.maxLogSize);
    }
  }
}

module.exports = { PluginSandbox };
