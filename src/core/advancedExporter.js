/**
 * Advanced Exporter - Exportaciones avanzadas (CSV, XML, bundles ZIP)
 * Complementa al reportExporter con formatos adicionales
 */

const fs = require('fs-extra');
const path = require('path');
const logManager = require('../logs/logManager');
const reportExporter = require('./reportExporter');

const EXPORTS_DIR = path.join(__dirname, '..', '..', 'exports');

class AdvancedExporter {
  constructor() {
    this.lastExport = null;
  }

  /**
   * Exporta datos en CSV
   */
  async exportCSV(deviceId, options = {}) {
    await fs.ensureDir(EXPORTS_DIR);

    const data = await this._gatherData(deviceId);
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

    const files = [];

    // CSV de snapshots
    const snapshotsPath = path.join(EXPORTS_DIR, `snapshots_${deviceId}_${ts}.csv`);
    const snapshotsCSV = this._snapshotsToCSV(data.snapshots);
    await fs.writeFile(snapshotsPath, snapshotsCSV, 'utf-8');
    files.push({ format: 'csv', type: 'snapshots', path: snapshotsPath, size: (await fs.stat(snapshotsPath)).size });

    // CSV de optimizaciones
    const optPath = path.join(EXPORTS_DIR, `optimizations_${deviceId}_${ts}.csv`);
    const optCSV = this._optimizationsToCSV(data.optimizations);
    await fs.writeFile(optPath, optCSV, 'utf-8');
    files.push({ format: 'csv', type: 'optimizations', path: optPath, size: (await fs.stat(optPath)).size });

    // CSV de predicciones
    if (data.predictions && data.predictions.length > 0) {
      const predPath = path.join(EXPORTS_DIR, `predictions_${deviceId}_${ts}.csv`);
      const predCSV = this._predictionsToCSV(data.predictions);
      await fs.writeFile(predPath, predCSV, 'utf-8');
      files.push({ format: 'csv', type: 'predictions', path: predPath, size: (await fs.stat(predPath)).size });
    }

    this.lastExport = { timestamp: new Date().toISOString(), files };
    return this.lastExport;
  }

  /**
   * Exporta datos en XML
   */
  async exportXML(deviceId, options = {}) {
    await fs.ensureDir(EXPORTS_DIR);

    const data = await this._gatherData(deviceId);
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

    const xmlPath = path.join(EXPORTS_DIR, `report_${deviceId}_${ts}.xml`);
    const xml = this._toXML(data, deviceId);
    await fs.writeFile(xmlPath, xml, 'utf-8');

    const files = [{ format: 'xml', type: 'report', path: xmlPath, size: (await fs.stat(xmlPath)).size }];
    this.lastExport = { timestamp: new Date().toISOString(), files };
    return this.lastExport;
  }

  /**
   * Exporta bundle ZIP con JSON + CSV + XML
   */
  async exportBundle(deviceId, options = {}) {
    await fs.ensureDir(EXPORTS_DIR);

    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const bundleDir = path.join(EXPORTS_DIR, `bundle_${deviceId}_${ts}`);
    await fs.ensureDir(bundleDir);

    const data = await this._gatherData(deviceId);
    const files = [];

    // 1. JSON completo
    const jsonPath = path.join(bundleDir, 'report.json');
    await fs.writeJson(jsonPath, data, { spaces: 2 });
    files.push({ format: 'json', path: jsonPath });

    // 2. CSV de snapshots
    const csvPath = path.join(bundleDir, 'snapshots.csv');
    await fs.writeFile(csvPath, this._snapshotsToCSV(data.snapshots), 'utf-8');
    files.push({ format: 'csv', path: csvPath });

    // 3. CSV de optimizaciones
    const optCSVPath = path.join(bundleDir, 'optimizations.csv');
    await fs.writeFile(optCSVPath, this._optimizationsToCSV(data.optimizations), 'utf-8');
    files.push({ format: 'csv', path: optCSVPath });

    // 4. XML
    const xmlPath = path.join(bundleDir, 'report.xml');
    await fs.writeFile(xmlPath, this._toXML(data, deviceId), 'utf-8');
    files.push({ format: 'xml', path: xmlPath });

    // 5. Resumen texto
    const summaryPath = path.join(bundleDir, 'summary.txt');
    await fs.writeFile(summaryPath, this._toSummary(data, deviceId), 'utf-8');
    files.push({ format: 'txt', path: summaryPath });

    // Calcular tamaños
    for (const f of files) {
      f.size = (await fs.stat(f.path)).size;
    }

    this.lastExport = { timestamp: new Date().toISOString(), bundleDir, files };
    return this.lastExport;
  }

  /**
   * Lista exportaciones existentes
   */
  async listExports() {
    await fs.ensureDir(EXPORTS_DIR);
    try {
      const entries = await fs.readdir(EXPORTS_DIR, { withFileTypes: true });
      return entries.map(e => ({
        name: e.name,
        isDirectory: e.isDirectory(),
        path: path.join(EXPORTS_DIR, e.name),
      })).sort((a, b) => b.name.localeCompare(a.name));
    } catch {
      return [];
    }
  }

  // ════════════════════════════════════════════════════
  //  Data gathering
  // ════════════════════════════════════════════════════

  async _gatherData(deviceId) {
    const logs = await logManager.getLogs(deviceId);
    const snapshots = logs.filter(l => l.type === 'snapshot');
    const optimizations = logs.filter(l => l.type === 'optimization');

    // Predicciones (si están disponibles)
    let predictions = [];
    try {
      const { FailurePredictor } = require('../ml/failurePredictor');
      const predictor = new FailurePredictor(deviceId);
      const pred = await predictor.predict();
      predictions = pred.predictions || [];
    } catch {}

    return {
      deviceId,
      exportedAt: new Date().toISOString(),
      snapshots: snapshots.map(s => ({
        timestamp: s.timestamp,
        batteryLevel: s.battery?.level ? parseInt(s.battery.level) : null,
        temperature: s.temperature,
        processCount: s.processes?.length || 0,
        memoryAvailable: s.memory?.availablePercent || null,
        storageUsed: s.storage?.usedPercent || null,
      })),
      optimizations: optimizations.map(o => ({
        timestamp: o.timestamp,
        type: o.type,
        mode: o.mode,
        success: o.success,
        durationMs: o.durationMs,
        actionsCount: o.actions?.length || 0,
      })),
      predictions: predictions.map(p => ({
        id: p.id,
        label: p.label,
        urgency: p.urgency,
        severity: p.severity,
        currentValue: p.projection?.currentValue,
        projectedValue: p.projection?.projectedValue,
        estimatedDays: p.projection?.estimatedDays,
        recommendation: p.recommendation,
      })),
    };
  }

  // ════════════════════════════════════════════════════
  //  CSV
  // ════════════════════════════════════════════════════

  _snapshotsToCSV(snapshots) {
    const headers = 'timestamp,batteryLevel,temperature,processCount,memoryAvailable,storageUsed';
    const rows = snapshots.map(s =>
      [s.timestamp, s.batteryLevel, s.temperature, s.processCount, s.memoryAvailable, s.storageUsed]
        .map(v => v ?? '').join(',')
    );
    return [headers, ...rows].join('\n');
  }

  _optimizationsToCSV(optimizations) {
    const headers = 'timestamp,type,mode,success,durationMs,actionsCount';
    const rows = optimizations.map(o =>
      [o.timestamp, o.type, o.mode, o.success, o.durationMs, o.actionsCount]
        .map(v => v ?? '').join(',')
    );
    return [headers, ...rows].join('\n');
  }

  _predictionsToCSV(predictions) {
    const headers = 'id,label,urgency,severity,currentValue,projectedValue,estimatedDays,recommendation';
    const rows = predictions.map(p =>
      [p.id, `"${p.label}"`, p.urgency, p.severity, p.currentValue, p.projectedValue, p.estimatedDays, `"${p.recommendation || ''}"`]
        .map(v => v ?? '').join(',')
    );
    return [headers, ...rows].join('\n');
  }

  // ════════════════════════════════════════════════════
  //  XML
  // ════════════════════════════════════════════════════

  _toXML(data, deviceId) {
    const escapeXml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<PhoneOptimizerReport deviceId="${escapeXml(deviceId)}" exportedAt="${escapeXml(data.exportedAt)}">\n`;

    // Snapshots
    xml += `  <Snapshots count="${data.snapshots.length}">\n`;
    for (const s of data.snapshots) {
      xml += `    <Snapshot timestamp="${escapeXml(s.timestamp)}" batteryLevel="${s.batteryLevel ?? ''}" temperature="${s.temperature ?? ''}" processCount="${s.processCount}" memoryAvailable="${s.memoryAvailable ?? ''}" storageUsed="${s.storageUsed ?? ''}" />\n`;
    }
    xml += `  </Snapshots>\n`;

    // Optimizations
    xml += `  <Optimizations count="${data.optimizations.length}">\n`;
    for (const o of data.optimizations) {
      xml += `    <Optimization timestamp="${escapeXml(o.timestamp)}" type="${escapeXml(o.type || '')}" mode="${escapeXml(o.mode || '')}" success="${o.success}" durationMs="${o.durationMs}" actionsCount="${o.actionsCount}" />\n`;
    }
    xml += `  </Optimizations>\n`;

    // Predictions
    xml += `  <Predictions count="${data.predictions.length}">\n`;
    for (const p of data.predictions) {
      xml += `    <Prediction id="${escapeXml(p.id)}" label="${escapeXml(p.label)}" urgency="${p.urgency}" severity="${p.severity}" currentValue="${p.currentValue ?? ''}" projectedValue="${p.projectedValue ?? ''}" estimatedDays="${p.estimatedDays ?? ''}" recommendation="${escapeXml(p.recommendation || '')}" />\n`;
    }
    xml += `  </Predictions>\n`;

    xml += `</PhoneOptimizerReport>`;
    return xml;
  }

  // ════════════════════════════════════════════════════
  //  Summary (texto plano)
  // ════════════════════════════════════════════════════

  _toSummary(data, deviceId) {
    let txt = `=== PHONE OPTIMIZER — REPORTE RESUMEN ===\n`;
    txt += `Dispositivo: ${deviceId}\n`;
    txt += `Generado: ${data.exportedAt}\n\n`;

    txt += `--- SNAPSHOTS ---\n`;
    txt += `Total: ${data.snapshots.length}\n`;
    if (data.snapshots.length > 0) {
      const last = data.snapshots[data.snapshots.length - 1];
      txt += `Último: ${last.timestamp}\n`;
      txt += `Batería: ${last.batteryLevel ?? 'N/A'}%\n`;
      txt += `Temperatura: ${last.temperature ?? 'N/A'}°C\n`;
      txt += `Procesos: ${last.processCount}\n`;
    }

    txt += `\n--- OPTIMIZACIONES ---\n`;
    txt += `Total: ${data.optimizations.length}\n`;
    const successful = data.optimizations.filter(o => o.success).length;
    txt += `Exitosas: ${successful} (${data.optimizations.length > 0 ? Math.round(successful / data.optimizations.length * 100) : 0}%)\n`;

    txt += `\n--- PREDICCIONES ---\n`;
    txt += `Total: ${data.predictions.length}\n`;
    for (const p of data.predictions) {
      txt += `  [${p.urgency.toUpperCase()}] ${p.label}: ${p.currentValue ?? '?'} → ${p.projectedValue ?? '?'} (~${p.estimatedDays ?? '?'} días)\n`;
    }

    return txt;
  }
}

module.exports = new AdvancedExporter();
