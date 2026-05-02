/**
 * Sample Plugin - Ejemplo de plugin para Phone Optimizer
 * Demuestra cómo usar la Plugin API para acceder a ADB, ML, logs y más
 */

const pluginAPI = require('../../../src/core/pluginAPI');

const samplePlugin = {
  id: 'sample-plugin',

  /**
   * Se ejecuta al cargar el plugin
   */
  async onLoad() {
    console.log('[SAMPLE-PLUGIN] Cargado correctamente');
  },

  /**
   * Se ejecuta al descargar el plugin
   */
  onUnload() {
    console.log('[SAMPLE-PLUGIN] Descargado');
  },

  /**
   * Hooks del plugin — se registran automáticamente
   */
  hooks: {
    /**
     * Se ejecuta después de una optimización
     */
    async afterOptimization({ deviceId, result }) {
      console.log(`[SAMPLE-PLUGIN] Post-optimización en ${deviceId}:`, result.success ? 'éxito' : 'error');
      return { processed: true, message: 'Sample plugin procesó el evento' };
    },

    /**
     * Se ejecuta al conectar un dispositivo
     */
    async onDeviceConnect({ deviceId, deviceInfo }) {
      console.log(`[SAMPLE-PLUGIN] Dispositivo conectado: ${deviceId}`);
      return { acknowledged: true };
    },

    /**
     * Se ejecuta al desconectar un dispositivo
     */
    async onDeviceDisconnect({ deviceId }) {
      console.log(`[SAMPLE-PLUGIN] Dispositivo desconectado: ${deviceId}`);
      return { acknowledged: true };
    },
  },

  /**
   * Función principal — ejecutable desde la UI o API
   * @param {string} deviceId
   * @returns {Object} Resultado del análisis
   */
  async analyze(deviceId) {
    const result = {
      pluginId: this.id,
      timestamp: new Date().toISOString(),
      deviceId,
      data: {},
    };

    try {
      // Obtener info básica del dispositivo
      const props = await pluginAPI.adbGetProps(deviceId);
      result.data.device = {
        model: props['ro.product.model'] || 'Unknown',
        brand: props['ro.product.brand'] || 'Unknown',
        android: props['ro.build.version.release'] || 'Unknown',
      };

      // Obtener nivel de batería
      try {
        const battery = await pluginAPI.adbShell(deviceId, 'dumpsys battery');
        const levelMatch = battery.match(/level:\s*(\d+)/);
        if (levelMatch) {
          result.data.battery = parseInt(levelMatch[1]);
        }
      } catch {}

      // Obtener espacio en disco
      try {
        const df = await pluginAPI.adbShell(deviceId, 'df /data');
        const lines = df.split('\n');
        if (lines.length > 1) {
          const parts = lines[1].split(/\s+/);
          result.data.storage = {
            total: parts[1],
            used: parts[2],
            available: parts[3],
          };
        }
      } catch {}

      result.success = true;
    } catch (err) {
      result.success = false;
      result.error = err.message;
    }

    return result;
  },

  /**
   * Configuración del plugin
   */
  getConfig() {
    return {
      greeting: 'Hola desde Sample Plugin',
      logLevel: 'info',
    };
  },
};

module.exports = samplePlugin;
