/**
 * Battery Doctor - Extensión de ejemplo
 * Análisis profundo de batería y recomendaciones
 */

const adb = require('../../../adb/adbClient');

module.exports = {
  adbScripts: {
    deepBatteryAnalysis: {
      name: 'Análisis profundo de batería',
      description: 'Analiza wake locks, alarmas y apps que drenan batería en background',
      async execute(deviceId) {
        const results = { wakeLocks: [], alarms: [], hungryApps: [] };

        // Wake locks
        try {
          const output = await adb.run('shell dumpsys power', deviceId);
          const lockLines = output.split('\n').filter(l => l.includes('Wake Lock'));
          results.wakeLocks = lockLines.slice(0, 10).map(l => l.trim());
        } catch {}

        // Alarmas frecuentes
        try {
          const output = await adb.run('shell dumpsys alarm', deviceId);
          const alarmPackages = {};
          const lines = output.split('\n');
          for (const line of lines) {
            const match = line.match(/package=(\S+)/);
            if (match) {
              const pkg = match[1];
              alarmPackages[pkg] = (alarmPackages[pkg] || 0) + 1;
            }
          }
          results.alarms = Object.entries(alarmPackages)
            .filter(([_, count]) => count > 10)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([pkg, count]) => ({ package: pkg, alarmCount: count }));
        } catch {}

        // Apps con mayor uso de batería
        try {
          const output = await adb.run('shell dumpsys batterystats --charged', deviceId);
          const uidLines = output.split('\n').filter(l => l.includes('Uid'));
          results.hungryApps = uidLines.slice(0, 5).map(l => l.trim());
        } catch {}

        return results;
      },
    },

    batterySaver: {
      name: 'Ahorrador de batería',
      description: 'Aplica ajustes agresivos de ahorro de batería',
      async execute(deviceId) {
        const applied = [];

        // Desactivar sync automático
        try {
          await adb.run('shell settings put global auto_time 0', deviceId);
          applied.push('auto_time desactivado');
        } catch {}

        // Reducir brillo mínimo
        try {
          await adb.run('shell settings put system screen_brightness 20', deviceId);
          applied.push('brillo reducido a 20');
        } catch {}

        // Desactivar WiFi scan always
        try {
          await adb.run('shell settings put global wifi_scan_always_enabled 0', deviceId);
          applied.push('WiFi scan desactivado');
        } catch {}

        // Desactivar Bluetooth scan
        try {
          await adb.run('shell settings put global bluetooth_scan_always_enabled 0', deviceId);
          applied.push('Bluetooth scan desactivado');
        } catch {}

        // Activar battery saver
        try {
          await adb.run('shell settings put global low_power 1', deviceId);
          applied.push('Low power mode activado');
        } catch {}

        return { applied, success: true };
      },
    },
  },
};
