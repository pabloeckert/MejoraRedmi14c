/**
 * Real-time Metrics - Obtención de métricas en tiempo real via ADB
 */

const adb = require('../adb/adbClient');

/**
 * Obtiene métricas completas del dispositivo en tiempo real
 */
async function getRealTimeMetrics(deviceId) {
  const [cpu, memory, battery, temperature, processes, topApps, miuiServices] =
    await Promise.allSettled([
      getCPUUsage(deviceId),
      getMemoryUsage(deviceId),
      adb.getBatteryInfo(deviceId),
      adb.getTemperature(deviceId),
      adb.getRunningProcesses(deviceId),
      getTopRunningApps(deviceId),
      getMIUIServices(deviceId),
    ]);

  return {
    timestamp: new Date().toISOString(),
    cpu: cpu.status === 'fulfilled' ? cpu.value : { usage: 0, cores: 0, error: cpu.reason?.message },
    memory: memory.status === 'fulfilled' ? memory.value : { totalMb: 0, usedMb: 0, freeMb: 0, percent: 0 },
    battery: battery.status === 'fulfilled' ? battery.value : {},
    temperature: temperature.status === 'fulfilled' ? temperature.value : null,
    processCount: processes.status === 'fulfilled' ? processes.value.length : 0,
    topApps: topApps.status === 'fulfilled' ? topApps.value : [],
    miuiServices: miuiServices.status === 'fulfilled' ? miuiServices.value : [],
  };
}

/**
 * Obtiene uso de CPU
 */
async function getCPUUsage(deviceId) {
  try {
    const output = await adb.run('shell cat /proc/stat', deviceId);
    const lines = output.split('\n');
    const cpuLine = lines[0];
    const parts = cpuLine.split(/\s+/).slice(1).map(Number);

    const idle = parts[3];
    const total = parts.reduce((a, b) => a + b, 0);

    // Obtener segundo snapshot para calcular delta
    await new Promise(r => setTimeout(r, 500));
    const output2 = await adb.run('shell cat /proc/stat', deviceId);
    const parts2 = output2.split('\n')[0].split(/\s+/).slice(1).map(Number);

    const idle2 = parts2[3];
    const total2 = parts2.reduce((a, b) => a + b, 0);

    const idleDelta = idle2 - idle;
    const totalDelta = total2 - total;

    const usage = totalDelta > 0 ? ((totalDelta - idleDelta) / totalDelta * 100) : 0;

    // Obtener info de cores
    const coresOutput = await adb.run('shell nproc', deviceId);
    const cores = parseInt(coresOutput) || 1;

    return {
      usage: Math.round(usage * 10) / 10,
      cores,
      freq: await getCPUFreq(deviceId),
    };
  } catch {
    return { usage: 0, cores: 0, freq: null };
  }
}

/**
 * Obtiene frecuencia de CPU
 */
async function getCPUFreq(deviceId) {
  try {
    const output = await adb.run('shell cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_cur_freq', deviceId);
    return parseInt(output) / 1000; // MHz
  } catch {
    return null;
  }
}

/**
 * Obtiene uso de memoria RAM
 */
async function getMemoryUsage(deviceId) {
  try {
    const output = await adb.run('shell cat /proc/meminfo', deviceId);
    const lines = output.split('\n');
    const getVal = (key) => {
      const line = lines.find(l => l.startsWith(key));
      if (!line) return 0;
      return parseInt(line.match(/(\d+)/)?.[1] || '0');
    };

    const totalKb = getVal('MemTotal');
    const freeKb = getVal('MemFree');
    const availableKb = getVal('MemAvailable');
    const buffersKb = getVal('Buffers');
    const cachedKb = getVal('Cached');

    const totalMb = Math.round(totalKb / 1024);
    const freeMb = Math.round(freeKb / 1024);
    const availableMb = Math.round(availableKb / 1024);
    const usedMb = totalMb - availableMb;
    const percent = Math.round((usedMb / totalMb) * 100);

    return {
      totalMb,
      usedMb,
      freeMb,
      availableMb,
      percent,
      buffersMb: Math.round(buffersKb / 1024),
      cachedMb: Math.round(cachedKb / 1024),
    };
  } catch {
    return { totalMb: 0, usedMb: 0, freeMb: 0, availableMb: 0, percent: 0 };
  }
}

/**
 * Obtiene apps en foreground (top running)
 */
async function getTopRunningApps(deviceId) {
  try {
    const output = await adb.run('shell dumpsys activity recents', deviceId);
    const apps = [];
    const lines = output.split('\n');
    for (const line of lines) {
      const match = line.match(/Recent #\d+:.*\{.*u0\s+(\S+)\}/);
      if (match) {
        apps.push(match[1]);
      }
    }
    return apps.slice(0, 10);
  } catch {
    return [];
  }
}

/**
 * Detecta servicios MIUI/HyperOS activos
 */
async function getMIUIServices(deviceId) {
  try {
    const output = await adb.run('shell dumpsys activity services', deviceId);
    const miuiKeywords = ['miui', 'xiaomi', 'hyperos', 'mishare', 'micloud', 'misound', 'securitycenter'];
    const services = [];
    const lines = output.split('\n');

    for (const line of lines) {
      const lower = line.toLowerCase();
      if (miuiKeywords.some(k => lower.includes(k))) {
        const match = line.match(/(\S+\/\S+)/);
        if (match && !services.includes(match[1])) {
          services.push(match[1]);
        }
      }
    }
    return services.slice(0, 20);
  } catch {
    return [];
  }
}

module.exports = { getRealTimeMetrics };
