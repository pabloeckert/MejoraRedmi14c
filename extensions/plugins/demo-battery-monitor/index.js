/**
 * Demo Plugin: Battery Monitor Pro
 * Monitoreo avanzado de batería con alertas y recomendaciones
 */

const plugin = {
  id: 'demo-battery-monitor',

  /**
   * Ejecuta análisis de batería
   */
  async analyze(deviceId, adb) {
    const result = {
      timestamp: new Date().toISOString(),
      deviceId,
      analysis: {},
      recommendations: [],
    };

    try {
      // Obtener nivel de batería
      const batteryInfo = await adb.shell('dumpsys battery');
      const levelMatch = batteryInfo.match(/level:\s*(\d+)/);
      const statusMatch = batteryInfo.match(/status:\s*(\d+)/);
      const tempMatch = batteryInfo.match(/temperature:\s*(\d+)/);

      const level = levelMatch ? parseInt(levelMatch[1]) : null;
      const status = statusMatch ? parseInt(statusMatch[1]) : null; // 2=charging, 5=full
      const temp = tempMatch ? parseInt(tempMatch[1]) / 10 : null;

      result.analysis = {
        level,
        status: status === 2 ? 'charging' : status === 5 ? 'full' : 'discharging',
        temperature: temp,
        health: level > 50 ? 'good' : level > 20 ? 'moderate' : 'low',
      };

      // Recomendaciones inteligentes
      if (level !== null) {
        if (level < 15) {
          result.recommendations.push({
            priority: 'critical',
            message: 'Batería crítica — Conectar cargador inmediatamente',
            action: 'enable_battery_saver',
          });
        } else if (level < 30) {
          result.recommendations.push({
            priority: 'high',
            message: 'Batería baja — Reducir brillo y cerrar apps en background',
            action: 'reduce_consumption',
          });
        }

        if (level > 90 && status === 2) {
          result.recommendations.push({
            priority: 'info',
            message: 'Batería casi llena — Desconectar cargador para preservar salud',
            action: 'disconnect_charger',
          });
        }
      }

      if (temp !== null && temp > 38) {
        result.recommendations.push({
          priority: 'high',
          message: `Temperatura de batería elevada (${temp}°C) — Evitar carga rápida`,
          action: 'reduce_thermal',
        });
      }

    } catch (err) {
      result.error = err.message;
    }

    return result;
  },
};

module.exports = plugin;
