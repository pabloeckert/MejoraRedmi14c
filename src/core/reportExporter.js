/**
 * Report Exporter - Exportación de reportes técnicos
 * Genera reportes en JSON (completo) y HTML (visual)
 */

const fs = require('fs-extra');
const path = require('path');
const logManager = require('../logs/logManager');

const REPORTS_DIR = path.join(__dirname, '..', '..', 'reports');

class ReportExporter {
  constructor() {
    this.lastReport = null;
  }

  /**
   * Exporta reporte completo del dispositivo
   * @param {string} deviceId - Serial del dispositivo
   * @param {Object} opts - { format: 'json'|'html'|'both', includeRaw }
   * @returns {Object} Resultado con paths de archivos generados
   */
  async export(deviceId, opts = {}) {
    const format = opts.format || 'both';
    await fs.ensureDir(REPORTS_DIR);

    // ── Recopilar datos ──
    const reportData = await this._gatherReportData(deviceId);

    // ── Generar timestamp para nombres de archivo ──
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const baseName = `report_${deviceId}_${ts}`;
    const result = { timestamp: new Date().toISOString(), files: [] };

    // ── JSON ──
    if (format === 'json' || format === 'both') {
      const jsonPath = path.join(REPORTS_DIR, `${baseName}.json`);
      await fs.writeJson(jsonPath, reportData, { spaces: 2 });
      result.files.push({ format: 'json', path: jsonPath, size: (await fs.stat(jsonPath)).size });
    }

    // ── HTML ──
    if (format === 'html' || format === 'both') {
      const htmlPath = path.join(REPORTS_DIR, `${baseName}.html`);
      const html = this._generateHTML(reportData);
      await fs.writeFile(htmlPath, html, 'utf-8');
      result.files.push({ format: 'html', path: htmlPath, size: (await fs.stat(htmlPath)).size });
    }

    this.lastReport = result;
    return result;
  }

  /**
   * Genera un reporte rápido (solo métricas clave)
   */
  async quickReport(deviceId) {
    const data = await this._gatherReportData(deviceId);
    return {
      timestamp: data.generatedAt,
      device: data.device.model,
      owner: data.device.owner,
      healthScore: data.health.score,
      battery: data.metrics.battery,
      temperature: data.metrics.temperature,
      processCount: data.metrics.processCount,
      anomalyCount: data.anomalies.total,
      predictionCount: data.predictions.total,
      riskLevel: data.predictions.riskLevel,
    };
  }

  /**
   * Lista reportes generados
   */
  async listReports() {
    await fs.ensureDir(REPORTS_DIR);
    const files = await fs.readdir(REPORTS_DIR);
    const reports = [];

    for (const file of files) {
      if (!file.endsWith('.json') && !file.endsWith('.html')) continue;
      const filePath = path.join(REPORTS_DIR, file);
      const stat = await fs.stat(filePath);
      reports.push({
        name: file,
        path: filePath,
        format: file.endsWith('.json') ? 'json' : 'html',
        size: stat.size,
        created: stat.birthtime.toISOString(),
      });
    }

    return reports.sort((a, b) => new Date(b.created) - new Date(a.created));
  }

  // ════════════════════════════════════════════════════
  //  Recopilación de datos
  // ════════════════════════════════════════════════════

  async _gatherReportData(deviceId) {
    const logs = await logManager.getLogs(deviceId);
    const snapshots = logs.filter(l => l.type === 'snapshot');
    const optimizations = logs.filter(l => l.type === 'optimization');
    const lastSnapshot = snapshots[snapshots.length - 1] || {};
    const firstSnapshot = snapshots[0] || {};

    // ── Info del dispositivo ──
    const deviceInfo = {
      id: deviceId,
      model: lastSnapshot.deviceInfo?.model || 'Unknown',
      brand: lastSnapshot.deviceInfo?.brand || 'Unknown',
      android: lastSnapshot.deviceInfo?.android || 'Unknown',
      miui: lastSnapshot.deviceInfo?.miui || 'Unknown',
      owner: lastSnapshot.owner || 'Unknown',
    };

    // ── Métricas actuales ──
    const metrics = {
      battery: {
        current: lastSnapshot.battery?.level ? parseInt(lastSnapshot.battery.level) : null,
        history: snapshots.filter(s => s.battery?.level).map(s => ({
          level: parseInt(s.battery.level),
          timestamp: s.timestamp,
        })),
      },
      temperature: {
        current: lastSnapshot.temperature,
        history: snapshots.filter(s => s.temperature != null).map(s => ({
          value: s.temperature,
          timestamp: s.timestamp,
        })),
        average: this._average(snapshots.filter(s => s.temperature).map(s => s.temperature)),
        max: Math.max(...snapshots.filter(s => s.temperature).map(s => s.temperature), 0),
      },
      processCount: {
        current: lastSnapshot.processes?.length || 0,
        history: snapshots.filter(s => s.processes?.length).map(s => ({
          count: s.processes.length,
          timestamp: s.timestamp,
        })),
        average: this._average(snapshots.filter(s => s.processes?.length).map(s => s.processes.length)),
      },
      storage: lastSnapshot.storage || null,
      memory: lastSnapshot.memory || null,
    };

    // ── Score de salud ──
    const health = this._calculateHealthScore(metrics, snapshots);

    // ── Historial de optimizaciones ──
    const optimizationHistory = optimizations.map(o => ({
      timestamp: o.timestamp,
      mode: o.mode,
      success: o.success,
      actions: o.actions?.length || 0,
      duration: o.durationMs,
    }));

    // ── Top apps ──
    const appUsage = {};
    for (const s of snapshots) {
      if (!s.usageStats) continue;
      for (const app of s.usageStats) {
        if (!appUsage[app.package]) appUsage[app.package] = { totalTimeMs: 0, sessions: 0 };
        appUsage[app.package].totalTimeMs += app.totalTimeMs || 0;
        appUsage[app.package].sessions++;
      }
    }
    const topApps = Object.entries(appUsage)
      .sort((a, b) => b[1].totalTimeMs - a[1].totalTimeMs)
      .slice(0, 10)
      .map(([pkg, data]) => ({
        package: pkg,
        totalTimeMs: data.totalTimeMs,
        sessions: data.sessions,
        avgTimeMs: Math.round(data.totalTimeMs / data.sessions),
      }));

    // ── Anomalías ──
    const anomalyDetector = require('../ml/anomalyDetector');
    const detector = new anomalyDetector.AnomalyDetector(deviceId);
    let anomalyData = { totalAnomalies: 0, critical: 0, warning: 0, anomalies: [] };
    try {
      anomalyData = await detector.detect();
    } catch {}

    // ── Predicciones ──
    const { FailurePredictor } = require('../ml/failurePredictor');
    const predictor = new FailurePredictor(deviceId);
    let predictionData = { predictions: [], confidence: 0 };
    try {
      predictionData = await predictor.predict();
    } catch {}

    return {
      generatedAt: new Date().toISOString(),
      generator: 'Phone Optimizer Report Exporter v1.0',
      device: deviceInfo,
      metrics,
      health,
      optimizationHistory,
      totalOptimizations: optimizationHistory.length,
      topApps,
      anomalies: {
        total: anomalyData.totalAnomalies,
        critical: anomalyData.critical,
        warning: anomalyData.warning,
        items: anomalyData.anomalies.map(a => ({
          type: a.type,
          severity: a.severity,
          message: a.message,
        })),
      },
      predictions: {
        total: predictionData.predictions?.length || 0,
        confidence: predictionData.confidence,
        riskLevel: this._calculateRiskLevel(predictionData.predictions),
        items: (predictionData.predictions || []).map(p => ({
          id: p.id,
          label: p.label,
          urgency: p.urgency,
          projectedDays: p.projection?.estimatedDays,
          recommendation: p.recommendation,
        })),
      },
      sessionSummary: {
        totalSessions: snapshots.length,
        firstSeen: firstSnapshot.timestamp,
        lastSeen: lastSnapshot.timestamp,
        timespanDays: firstSnapshot.timestamp && lastSnapshot.timestamp
          ? Math.round((new Date(lastSnapshot.timestamp) - new Date(firstSnapshot.timestamp)) / (1000 * 60 * 60 * 24))
          : 0,
      },
    };
  }

  // ════════════════════════════════════════════════════
  //  Generación HTML
  // ════════════════════════════════════════════════════

  _generateHTML(data) {
    const riskColors = { low: '#10b981', medium: '#f59e0b', high: '#f97316', critical: '#ef4444' };
    const riskColor = riskColors[data.predictions.riskLevel] || '#6b7280';
    const healthColor = data.health.score >= 80 ? '#10b981' : data.health.score >= 60 ? '#f59e0b' : '#ef4444';

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reporte Técnico - ${data.device.model}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f172a; color: #e2e8f0; padding: 24px; line-height: 1.6; }
    .container { max-width: 900px; margin: 0 auto; }
    .header { text-align: center; margin-bottom: 32px; padding: 24px; background: linear-gradient(135deg, #1e293b, #334155); border-radius: 16px; border: 1px solid #475569; }
    .header h1 { font-size: 24px; color: #f1f5f9; margin-bottom: 8px; }
    .header p { color: #94a3b8; font-size: 14px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 16px; }
    .card h3 { font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
    .card .value { font-size: 28px; font-weight: 700; color: #f1f5f9; }
    .card .sub { font-size: 12px; color: #64748b; margin-top: 4px; }
    .section { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; margin-bottom: 20px; }
    .section h2 { font-size: 16px; color: #f1f5f9; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #334155; font-size: 13px; }
    th { color: #94a3b8; font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; }
    td { color: #e2e8f0; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; }
    .badge-critical { background: #991b1b; color: #fca5a5; }
    .badge-warning { background: #92400e; color: #fcd34d; }
    .badge-info { background: #1e3a5f; color: #93c5fd; }
    .badge-success { background: #065f46; color: #6ee7b7; }
    .progress-bar { width: 100%; height: 8px; background: #334155; border-radius: 4px; overflow: hidden; margin-top: 8px; }
    .progress-fill { height: 100%; border-radius: 4px; transition: width 0.3s; }
    .footer { text-align: center; padding: 16px; color: #475569; font-size: 12px; }
  </style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>📋 Reporte Técnico</h1>
    <p>${data.device.model} · ${data.device.brand} · Android ${data.device.android}</p>
    <p>Propietario: ${data.device.owner} · Generado: ${new Date(data.generatedAt).toLocaleString('es')}</p>
  </div>

  <div class="grid">
    <div class="card">
      <h3>🏥 Salud</h3>
      <div class="value" style="color:${healthColor}">${data.health.score}/100</div>
      <div class="sub">${data.health.label}</div>
      <div class="progress-bar"><div class="progress-fill" style="width:${data.health.score}%;background:${healthColor}"></div></div>
    </div>
    <div class="card">
      <h3>🔋 Batería</h3>
      <div class="value">${data.metrics.battery.current ?? 'N/A'}%</div>
      <div class="sub">${data.metrics.battery.history.length} lecturas</div>
    </div>
    <div class="card">
      <h3>🌡️ Temperatura</h3>
      <div class="value">${data.metrics.temperature.current?.toFixed(1) ?? 'N/A'}°C</div>
      <div class="sub">Máx: ${data.metrics.temperature.max?.toFixed(1) ?? 'N/A'}°C · Prom: ${data.metrics.temperature.average?.toFixed(1) ?? 'N/A'}°C</div>
    </div>
    <div class="card">
      <h3>⚠️ Riesgo</h3>
      <div class="value" style="color:${riskColor}">${data.predictions.riskLevel.toUpperCase()}</div>
      <div class="sub">${data.predictions.total} predicciones</div>
    </div>
  </div>

  <div class="section">
    <h2>📊 Métricas del Sistema</h2>
    <table>
      <tr><th>Métrica</th><th>Actual</th><th>Promedio</th><th>Sesiones</th></tr>
      <tr><td>Procesos</td><td>${data.metrics.processCount.current}</td><td>${data.metrics.processCount.average?.toFixed(0) ?? 'N/A'}</td><td>${data.metrics.processCount.history.length}</td></tr>
      <tr><td>Temperatura</td><td>${data.metrics.temperature.current?.toFixed(1) ?? 'N/A'}°C</td><td>${data.metrics.temperature.average?.toFixed(1) ?? 'N/A'}°C</td><td>${data.metrics.temperature.history.length}</td></tr>
      <tr><td>Batería</td><td>${data.metrics.battery.current ?? 'N/A'}%</td><td>—</td><td>${data.metrics.battery.history.length}</td></tr>
    </table>
  </div>

  ${data.anomalies.total > 0 ? `
  <div class="section">
    <h2>🔴 Anomalías Detectadas (${data.anomalies.total})</h2>
    <table>
      <tr><th>Tipo</th><th>Severidad</th><th>Mensaje</th></tr>
      ${data.anomalies.items.map(a => `
      <tr>
        <td>${a.type}</td>
        <td><span class="badge badge-${a.severity === 'critical' ? 'critical' : 'warning'}">${a.severity}</span></td>
        <td>${a.message}</td>
      </tr>`).join('')}
    </table>
  </div>` : ''}

  ${data.predictions.items.length > 0 ? `
  <div class="section">
    <h2>🔮 Predicciones de Fallo (${data.predictions.total})</h2>
    <table>
      <tr><th>Fallo</th><th>Urgencia</th><th>Días Estimados</th><th>Recomendación</th></tr>
      ${data.predictions.items.map(p => `
      <tr>
        <td>${p.label}</td>
        <td><span class="badge badge-${p.urgency === 'critical' ? 'critical' : p.urgency === 'high' ? 'warning' : 'info'}">${p.urgency}</span></td>
        <td>${p.projectedDays ?? 'N/A'}</td>
        <td>${p.recommendation}</td>
      </tr>`).join('')}
    </table>
  </div>` : ''}

  ${data.topApps.length > 0 ? `
  <div class="section">
    <h2>📱 Top Apps por Uso</h2>
    <table>
      <tr><th>#</th><th>App</th><th>Tiempo Total</th><th>Sesiones</th><th>Prom/Sesión</th></tr>
      ${data.topApps.map((app, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${app.package.split('.').pop()}</td>
        <td>${(app.totalTimeMs / 3600000).toFixed(1)}h</td>
        <td>${app.sessions}</td>
        <td>${(app.avgTimeMs / 60000).toFixed(0)}min</td>
      </tr>`).join('')}
    </table>
  </div>` : ''}

  <div class="section">
    <h2>⚡ Historial de Optimizaciones (${data.totalOptimizations})</h2>
    ${data.optimizationHistory.length > 0 ? `
    <table>
      <tr><th>Fecha</th><th>Modo</th><th>Acciones</th><th>Duración</th><th>Resultado</th></tr>
      ${data.optimizationHistory.slice(-10).reverse().map(o => `
      <tr>
        <td>${new Date(o.timestamp).toLocaleString('es')}</td>
        <td>${o.mode || 'N/A'}</td>
        <td>${o.actions}</td>
        <td>${o.duration ? (o.duration / 1000).toFixed(1) + 's' : 'N/A'}</td>
        <td><span class="badge ${o.success ? 'badge-success' : 'badge-critical'}">${o.success ? '✅' : '❌'}</span></td>
      </tr>`).join('')}
    </table>` : '<p style="color:#64748b">Sin optimizaciones registradas</p>'}
  </div>

  <div class="section">
    <h2>📅 Resumen de Sesiones</h2>
    <table>
      <tr><td>Total de sesiones</td><td>${data.sessionSummary.totalSessions}</td></tr>
      <tr><td>Primera conexión</td><td>${data.sessionSummary.firstSeen ? new Date(data.sessionSummary.firstSeen).toLocaleString('es') : 'N/A'}</td></tr>
      <tr><td>Última conexión</td><td>${data.sessionSummary.lastSeen ? new Date(data.sessionSummary.lastSeen).toLocaleString('es') : 'N/A'}</td></tr>
      <tr><td>Período</td><td>${data.sessionSummary.timespanDays} días</td></tr>
    </table>
  </div>

  <div class="footer">
    Phone Optimizer · Reporte generado automáticamente · ${new Date(data.generatedAt).toLocaleString('es')}
  </div>
</div>
</body>
</html>`;
  }

  // ════════════════════════════════════════════════════
  //  Utilidades
  // ════════════════════════════════════════════════════

  _average(values) {
    if (values.length === 0) return null;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  _calculateHealthScore(metrics, snapshots) {
    let score = 100;
    let label = 'Excelente';

    // Batería
    if (metrics.battery.current != null) {
      if (metrics.battery.current < 20) score -= 25;
      else if (metrics.battery.current < 40) score -= 10;
    }

    // Temperatura
    if (metrics.temperature.current != null) {
      if (metrics.temperature.current > 42) score -= 25;
      else if (metrics.temperature.current > 37) score -= 10;
    }

    // Procesos
    if (metrics.processCount.current > 120) score -= 15;
    else if (metrics.processCount.current > 80) score -= 5;

    // Anomalías recientes
    const recentAnomalies = snapshots.slice(-5);
    // (simplified — real scoring would use anomaly detector)

    score = Math.max(0, Math.min(100, score));
    if (score >= 80) label = 'Excelente';
    else if (score >= 60) label = 'Bueno';
    else if (score >= 40) label = 'Regular';
    else label = 'Necesita atención';

    return { score, label };
  }

  _calculateRiskLevel(predictions) {
    if (!predictions || predictions.length === 0) return 'low';
    if (predictions.some(p => p.urgency === 'critical')) return 'critical';
    if (predictions.filter(p => p.urgency === 'high').length >= 2) return 'high';
    if (predictions.some(p => p.urgency === 'high')) return 'medium';
    return 'low';
  }
}

module.exports = new ReportExporter();
