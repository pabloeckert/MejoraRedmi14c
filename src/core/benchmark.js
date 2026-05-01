/**
 * Benchmark Engine - Pruebas de rendimiento del dispositivo
 * Score 0-100 comparando con Xiaomi 17 Ultra como ideal
 */

const adb = require('../adb/adbClient');

// ── Valores ideales (Xiaomi 17 Ultra) ──
const IDEAL = {
  cpuSingleCore: 2200,    // Geekbench-like score estimado
  cpuMultiCore: 7000,
  ramTotalMb: 16384,      // 16GB
  ramFreePercent: 60,
  ioReadSpeed: 2000,      // MB/s
  appLaunchMs: 200,       // ms
  processCount: 40,
  serviceCount: 15,
  tempIdle: 28,           // °C
  animationScale: 0,
};

class Benchmark {
  constructor() {
    this.results = null;
  }

  /**
   * Ejecuta benchmark completo
   */
  async run(deviceId) {
    const startTime = Date.now();
    const results = {
      timestamp: new Date().toISOString(),
      deviceId,
      tests: {},
      score: 0,
      breakdown: {},
      durationMs: 0,
    };

    // ── CPU Test ──
    try {
      results.tests.cpu = await this._testCPU(deviceId);
    } catch (e) {
      results.tests.cpu = { score: 0, error: e.message };
    }

    // ── RAM Test ──
    try {
      results.tests.ram = await this._testRAM(deviceId);
    } catch (e) {
      results.tests.ram = { score: 0, error: e.message };
    }

    // ── IO Test ──
    try {
      results.tests.io = await this._testIO(deviceId);
    } catch (e) {
      results.tests.io = { score: 0, error: e.message };
    }

    // ── Latency Test ──
    try {
      results.tests.latency = await this._testLatency(deviceId);
    } catch (e) {
      results.tests.latency = { score: 0, error: e.message };
    }

    // ── Services Test ──
    try {
      results.tests.services = await this._testServices(deviceId);
    } catch (e) {
      results.tests.services = { score: 0, error: e.message };
    }

    // ── System Cleanliness ──
    try {
      results.tests.cleanliness = await this._testCleanliness(deviceId);
    } catch (e) {
      results.tests.cleanliness = { score: 0, error: e.message };
    }

    // ── Temperature Test ──
    try {
      results.tests.thermal = await this._testThermal(deviceId);
    } catch (e) {
      results.tests.thermal = { score: 0, error: e.message };
    }

    // ── Calculate final score ──
    const weights = {
      cpu: 0.20,
      ram: 0.20,
      io: 0.15,
      latency: 0.10,
      services: 0.10,
      cleanliness: 0.15,
      thermal: 0.10,
    };

    let totalScore = 0;
    let totalWeight = 0;

    for (const [key, weight] of Object.entries(weights)) {
      const test = results.tests[key];
      if (test?.score != null) {
        totalScore += test.score * weight;
        totalWeight += weight;
        results.breakdown[key] = test.score;
      }
    }

    results.score = totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
    results.durationMs = Date.now() - startTime;

    this.results = results;
    return results;
  }

  /**
   * Test de CPU - mide carga y frecuencia
   */
  async _testCPU(deviceId) {
    // Medir uso de CPU durante 1 segundo
    const stat1 = await adb.run('shell cat /proc/stat', deviceId);
    await new Promise(r => setTimeout(r, 1000));
    const stat2 = await adb.run('shell cat /proc/stat', deviceId);

    const parse1 = stat1.split('\n')[0].split(/\s+/).slice(1).map(Number);
    const parse2 = stat2.split('\n')[0].split(/\s+/).slice(1).map(Number);

    const idle1 = parse1[3];
    const idle2 = parse2[3];
    const total1 = parse1.reduce((a, b) => a + b, 0);
    const total2 = parse2.reduce((a, b) => a + b, 0);

    const usage = ((total2 - total1 - (idle2 - idle1)) / (total2 - total1)) * 100;

    // Obtener frecuencia
    let freq = 0;
    try {
      freq = parseInt(await adb.run('shell cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_cur_freq', deviceId)) / 1000;
    } catch {}

    // Score: menor uso = mejor (más capacidad libre)
    const usageScore = Math.max(0, 100 - usage);
    // Bonus por frecuencia alta
    const freqBonus = Math.min(20, freq / 100);

    return {
      score: Math.min(100, Math.round(usageScore * 0.7 + freqBonus)),
      usage: Math.round(usage * 10) / 10,
      freqMhz: freq,
      cores: parseInt(await adb.run('shell nproc', deviceId)) || 1,
    };
  }

  /**
   * Test de RAM - mide disponibilidad
   */
  async _testRAM(deviceId) {
    const output = await adb.run('shell cat /proc/meminfo', deviceId);
    const lines = output.split('\n');
    const getVal = (key) => {
      const line = lines.find(l => l.startsWith(key));
      return parseInt(line?.match(/(\d+)/)?.[1] || '0');
    };

    const totalKb = getVal('MemTotal');
    const availableKb = getVal('MemAvailable');
    const totalMb = Math.round(totalKb / 1024);
    const availableMb = Math.round(availableKb / 1024);
    const freePercent = Math.round((availableKb / totalKb) * 100);

    // Score comparado con ideal
    const capacityScore = Math.min(100, (totalMb / IDEAL.ramTotalMb) * 100);
    const freeScore = Math.min(100, (freePercent / IDEAL.ramFreePercent) * 100);

    return {
      score: Math.round(capacityScore * 0.4 + freeScore * 0.6),
      totalMb,
      availableMb,
      freePercent,
    };
  }

  /**
   * Test de IO - mide velocidad de lectura
   */
  async _testIO(deviceId) {
    // Test de lectura secuencial
    const start = Date.now();
    try {
      await adb.run('shell dd if=/dev/zero of=/data/local/tmp/bench_test bs=1M count=32 2>&1', deviceId);
    } catch {}
    const writeTime = Date.now() - start;

    // Test de lectura
    const readStart = Date.now();
    try {
      await adb.run('shell dd if=/data/local/tmp/bench_test of=/dev/null bs=1M 2>&1', deviceId);
    } catch {}
    const readTime = Date.now() - readStart;

    // Cleanup
    await adb.run('shell rm -f /data/local/tmp/bench_test', deviceId).catch(() => {});

    // Score basado en tiempo (menor = mejor)
    const writeScore = Math.max(0, Math.min(100, 100 - (writeTime / 50)));
    const readScore = Math.max(0, Math.min(100, 100 - (readTime / 30)));

    return {
      score: Math.round((writeScore + readScore) / 2),
      writeMs: writeTime,
      readMs: readTime,
    };
  }

  /**
   * Test de latencia - mide tiempo de respuesta ADB
   */
  async _testLatency(deviceId) {
    const samples = [];
    for (let i = 0; i < 5; i++) {
      const start = Date.now();
      await adb.run('shell echo ok', deviceId);
      samples.push(Date.now() - start);
    }

    const avgMs = samples.reduce((a, b) => a + b, 0) / samples.length;
    // Score: <50ms = 100, >500ms = 0
    const score = Math.max(0, Math.min(100, 100 - ((avgMs - 50) / 4.5)));

    return {
      score: Math.round(score),
      avgMs: Math.round(avgMs),
      minMs: Math.min(...samples),
      maxMs: Math.max(...samples),
      samples,
    };
  }

  /**
   * Test de servicios - cuenta servicios activos
   */
  async _testServices(deviceId) {
    const output = await adb.run('shell dumpsys activity services', deviceId);
    const serviceCount = (output.match(/ServiceRecord\{/g) || []).length;

    // Score: más servicios = peor
    const score = Math.max(0, Math.min(100, 100 - ((serviceCount - IDEAL.serviceCount) * 2)));

    // Detectar MIUI
    const miuiCount = (output.match(/miui|xiaomi|hyperos/gi) || []).length;

    return {
      score: Math.round(score),
      total: serviceCount,
      miuiServices: miuiCount,
    };
  }

  /**
   * Test de limpieza del sistema
   */
  async _testCleanliness(deviceId) {
    let score = 100;

    // Procesos zombis
    try {
      const psOutput = await adb.run('shell ps -A -o STAT', deviceId);
      const zombies = (psOutput.match(/\bZ\b/g) || []).length;
      score -= zombies * 5;
    } catch {}

    // Archivos temporales
    try {
      const tmpOutput = await adb.run('shell ls /data/local/tmp/ 2>/dev/null | wc -l', deviceId);
      const tmpFiles = parseInt(tmpOutput) || 0;
      if (tmpFiles > 10) score -= 10;
    } catch {}

    // Cache de apps
    try {
      const cacheOutput = await adb.run('shell du -s /data/data/*/cache 2>/dev/null', deviceId);
      const cacheLines = cacheOutput.split('\n').filter(Boolean);
      if (cacheLines.length > 20) score -= 15;
    } catch {}

    return {
      score: Math.max(0, Math.min(100, score)),
    };
  }

  /**
   * Test de temperatura
   */
  async _testThermal(deviceId) {
    const temp = await adb.getTemperature(deviceId);

    // Score: 28°C = 100, >45°C = 0
    let score = 100;
    if (temp != null) {
      if (temp > 45) score = 0;
      else if (temp > 28) score = Math.round(100 - ((temp - 28) / 17) * 100);
    }

    return {
      score: Math.max(0, score),
      temperature: temp,
    };
  }

  /**
   * Compara con resultados anteriores
   */
  compare(previous) {
    if (!this.results || !previous) return null;

    const delta = {};
    for (const key of Object.keys(this.results.breakdown)) {
      const curr = this.results.breakdown[key];
      const prev = previous.breakdown?.[key];
      if (curr != null && prev != null) {
        delta[key] = {
          current: curr,
          previous: prev,
          diff: curr - prev,
          improved: curr > prev,
        };
      }
    }

    return {
      scoreDelta: this.results.score - (previous.score || 0),
      breakdown: delta,
      improved: this.results.score > (previous.score || 0),
    };
  }
}

module.exports = new Benchmark();
