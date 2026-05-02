/**
 * Plugin Registry - Sistema de carga y gestión de plugins avanzados
 * Soporta: core, external, UI, automation
 */

const fs = require('fs-extra');
const path = require('path');
const errorHandler = require('./errorHandler');

const PLUGINS_ROOT = path.join(__dirname, '..', '..', 'plugins');

class PluginRegistry {
  constructor() {
    this.plugins = new Map(); // id → { manifest, module, enabled, type, loadedAt }
    this.hooks = new Map();   // eventName → [{ pluginId, handler }]
  }

  /**
   * Carga todos los plugins desde las carpetas del sistema
   */
  async loadPlugins() {
    const results = { core: 0, external: 0, ui: 0, automation: 0, errors: [] };

    try {
      results.core = await this.loadInternalPlugins();
    } catch (e) { results.errors.push(`core: ${e.message}`); }

    try {
      results.external = await this.loadExternalPlugins();
    } catch (e) { results.errors.push(`external: ${e.message}`); }

    try {
      results.ui = await this.loadUIPlugins();
    } catch (e) { results.errors.push(`ui: ${e.message}`); }

    try {
      results.automation = await this.loadAutomationPlugins();
    } catch (e) { results.errors.push(`automation: ${e.message}`); }

    console.log(`[PLUGIN] Cargados: core=${results.core} external=${results.external} ui=${results.ui} automation=${results.automation}`);
    if (results.errors.length > 0) {
      console.warn('[PLUGIN] Errores:', results.errors);
    }

    return results;
  }

  /**
   * Carga plugins internos (core)
   */
  async loadInternalPlugins() {
    return this._loadFromDir(path.join(PLUGINS_ROOT, 'core'), 'core');
  }

  /**
   * Carga plugins externos
   */
  async loadExternalPlugins() {
    return this._loadFromDir(path.join(PLUGINS_ROOT, 'external'), 'external');
  }

  /**
   * Carga plugins de UI
   */
  async loadUIPlugins() {
    return this._loadFromDir(path.join(PLUGINS_ROOT, 'ui'), 'ui');
  }

  /**
   * Carga plugins de automatización
   */
  async loadAutomationPlugins() {
    return this._loadFromDir(path.join(PLUGINS_ROOT, 'automation'), 'automation');
  }

  /**
   * Registra un plugin en el sistema
   */
  registerPlugin(id, manifest, module, type) {
    if (this.plugins.has(id)) {
      throw new Error(`Plugin '${id}' ya está registrado`);
    }

    const entry = {
      id,
      manifest,
      module,
      type,
      enabled: manifest.enabled !== false, // enabled por defecto
      loadedAt: new Date().toISOString(),
    };

    this.plugins.set(id, entry);

    // Registrar hooks si el plugin los define
    if (module.hooks && typeof module.hooks === 'object') {
      for (const [event, handler] of Object.entries(module.hooks)) {
        if (!this.hooks.has(event)) this.hooks.set(event, []);
        this.hooks.get(event).push({ pluginId: id, handler });
      }
    }

    console.log(`[PLUGIN] Registrado: ${id} (${type}) enabled=${entry.enabled}`);
    return entry;
  }

  /**
   * Desregistra un plugin
   */
  unregisterPlugin(id) {
    const plugin = this.plugins.get(id);
    if (!plugin) return false;

    // Limpiar hooks
    for (const [event, handlers] of this.hooks.entries()) {
      this.hooks.set(event, handlers.filter(h => h.pluginId !== id));
    }

    // Llamar onUnload si existe
    if (plugin.module.onUnload && typeof plugin.module.onUnload === 'function') {
      try { plugin.module.onUnload(); } catch {}
    }

    this.plugins.delete(id);
    console.log(`[PLUGIN] Desregistrado: ${id}`);
    return true;
  }

  /**
   * Obtiene info de un plugin
   */
  getPluginInfo(id) {
    const plugin = this.plugins.get(id);
    if (!plugin) return null;

    return {
      id: plugin.id,
      name: plugin.manifest.name || plugin.id,
      version: plugin.manifest.version || '1.0.0',
      description: plugin.manifest.description || '',
      author: plugin.manifest.author || 'Unknown',
      type: plugin.type,
      enabled: plugin.enabled,
      loadedAt: plugin.loadedAt,
      permissions: plugin.manifest.permissions || [],
      hooks: plugin.module.hooks ? Object.keys(plugin.module.hooks) : [],
    };
  }

  /**
   * Lista todos los plugins registrados
   */
  listPlugins() {
    const list = [];
    for (const [id] of this.plugins) {
      list.push(this.getPluginInfo(id));
    }
    return list;
  }

  /**
   * Activa/desactiva un plugin
   */
  setPluginEnabled(id, enabled) {
    const plugin = this.plugins.get(id);
    if (!plugin) throw new Error(`Plugin '${id}' no encontrado`);
    plugin.enabled = enabled;
    console.log(`[PLUGIN] ${id} ${enabled ? 'activado' : 'desactivado'}`);
    return true;
  }

  /**
   * Ejecuta un hook en todos los plugins que lo escuchan
   */
  async executeHook(event, data) {
    const handlers = this.hooks.get(event) || [];
    const results = [];

    for (const { pluginId, handler } of handlers) {
      const plugin = this.plugins.get(pluginId);
      if (!plugin || !plugin.enabled) continue;

      try {
        const result = await handler(data);
        results.push({ pluginId, result });
      } catch (err) {
        console.warn(`[PLUGIN] Error en hook '${event}' de '${pluginId}':`, err.message);
        results.push({ pluginId, error: err.message });
      }
    }

    return results;
  }

  // ── Internos ──

  async _loadFromDir(dir, type) {
    if (!await fs.pathExists(dir)) return 0;

    const entries = await fs.readdir(dir);
    let loaded = 0;

    for (const entry of entries) {
      const pluginDir = path.join(dir, entry);
      const stat = await fs.stat(pluginDir).catch(() => null);
      if (!stat || !stat.isDirectory()) continue;

      try {
        await this._loadPlugin(pluginDir, type);
        loaded++;
      } catch (err) {
        console.warn(`[PLUGIN] Error cargando ${entry} (${type}):`, err.message);
      }
    }

    return loaded;
  }

  async _loadPlugin(pluginDir, type) {
    const manifestPath = path.join(pluginDir, 'manifest.json');
    if (!await fs.pathExists(manifestPath)) {
      throw new Error(`Sin manifest.json en ${pluginDir}`);
    }

    const manifest = await fs.readJson(manifestPath);
    const id = manifest.id || path.basename(pluginDir);

    // Cargar módulo principal
    const mainFile = manifest.main || 'index.js';
    const mainPath = path.join(pluginDir, mainFile);
    if (!await fs.pathExists(mainPath)) {
      throw new Error(`Archivo principal '${mainFile}' no encontrado`);
    }

    let module;
    try {
      module = require(mainPath);
    } catch (err) {
      throw new Error(`Error al cargar ${mainPath}: ${err.message}`);
    }

    // Ejecutar onLoad si existe
    if (module.onLoad && typeof module.onLoad === 'function') {
      try {
        await module.onLoad();
      } catch (err) {
        console.warn(`[PLUGIN] Error en onLoad de ${id}:`, err.message);
      }
    }

    this.registerPlugin(id, manifest, module, type);
  }
}

module.exports = new PluginRegistry();
