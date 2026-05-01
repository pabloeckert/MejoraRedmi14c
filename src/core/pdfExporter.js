/**
 * PDF Exporter - Exportación de reportes PDF profesionales
 * Genera PDF con tema dark, portada, tabla de contenido, métricas, anomalías, predicciones
 * Usa HTML → PDF rendering (sin dependencia de puppeteer)
 */

const fs = require('fs-extra');
const path = require('path');
const logManager = require('../logs/logManager');
const { FailurePredictor, FAILURE_TYPES } = require('../ml/failurePredictor');
const { NonLinearPredictor } = require('../ml/nonLinearPredictor');
const { AnomalyDetector } = require('../ml/anomalyDetector');

const REPORTS_DIR = path.join(__dirname, '..', '..', 'reports');

class PDFExporter {
  constructor() {
    this.lastExport = null;
  }

  /**
   * Exporta reporte PDF profesional
   * @param {string} deviceId
   * @returns {Object} Resultado con path y tamaño
   */
  async export(deviceId) {
    await fs.ensureDir(REPORTS_DIR);

    // ── Recopilar todos los datos ──
    const data = await this._gatherFullData(deviceId);

    // ── Generar HTML del PDF ──
    const html = this._generatePDFHTML(data);

    // ── Guardar como HTML (printable como PDF) ──
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `report_pdf_${deviceId}_${ts}.html`;
    const filePath = path.join(REPORTS_DIR, fileName);
    await fs.writeFile(filePath, html, 'utf-8');

    const stat = await fs.stat(filePath);

    this.lastExport = {
      timestamp: new Date().toISOString(),
      file: { name: fileName, path: filePath, format: 'pdf-html', size: stat.size },
    };

    return this.lastExport;
  }

  /**
   * Recopila datos completos incluyendo predicciones no lineales
   */
  async _gatherFullData(deviceId) {
    const logs = await logManager.getLogs(deviceId);
    const snapshots = logs.filter(l => l.type === 'snapshot');
    const optimizations = logs.filter(l => l.type === 'optimization');
    const lastSnapshot = snapshots[snapshots.length - 1] || {};
    const firstSnapshot = snapshots[0] || {};

    // Dispositivo
    const deviceInfo = {
      id: deviceId,
      model: lastSnapshot.deviceInfo?.model || 'Unknown',
      brand: lastSnapshot.deviceInfo?.brand || 'Unknown',
      android: lastSnapshot.deviceInfo?.android || 'Unknown',
      miui: lastSnapshot.deviceInfo?.miui || 'Unknown',
      owner: lastSnapshot.owner || 'Unknown',
    };

    // Métricas
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
        average: this._avg(snapshots.filter(s => s.temperature).map(s => s.temperature)),
        max: Math.max(...snapshots.filter(s => s.temperature).map(s => s.temperature), 0),
        history: snapshots.filter(s => s.temperature != null).map(s => ({ value: s.temperature, timestamp: s.timestamp })),
      },
      processCount: {
        current: lastSnapshot.processes?.length || 0,
        average: this._avg(snapshots.filter(s => s.processes?.length).map(s => s.processes.length)),
      },
      storage: lastSnapshot.storage || null,
      memory: lastSnapshot.memory || null,
    };

    // Score de salud
    const health = this._calculateHealth(metrics);

    // Benchmark (último si existe)
    let benchmark = null;
    try {
      const benchmarkLog = logs.filter(l => l.type === 'benchmark').pop();
      if (benchmarkLog) benchmark = benchmarkLog;
    } catch {}

    // Anomalías
    const detector = new AnomalyDetector(deviceId);
    let anomalyData = { totalAnomalies: 0, critical: 0, warning: 0, anomalies: [] };
    try { anomalyData = await detector.detect(); } catch {}

    // Predicciones lineales
    const predictor = new FailurePredictor(deviceId);
    let linearPredictions = { predictions: [], confidence: 0 };
    try { linearPredictions = await predictor.predict(); } catch {}

    // Predicciones no lineales
    const nlPredictor = new NonLinearPredictor();
    let nlPredictions = { predictions: [] };
    try { nlPredictions = await nlPredictor.predict(snapshots); } catch {}

    // Top apps
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
      .map(([pkg, data]) => ({ package: pkg, ...data, avgTimeMs: Math.round(data.totalTimeMs / data.sessions) }));

    // Historial de optimizaciones
    const optHistory = optimizations.map(o => ({
      timestamp: o.timestamp,
      mode: o.mode,
      success: o.success,
      actions: o.actions?.length || 0,
      duration: o.durationMs,
    }));

    return {
      generatedAt: new Date().toISOString(),
      device: deviceInfo,
      metrics,
      health,
      benchmark,
      anomalies: {
        total: anomalyData.totalAnomalies,
        critical: anomalyData.critical,
        warning: anomalyData.warning,
        items: anomalyData.anomalies.map(a => ({ type: a.type, severity: a.severity, message: a.message })),
      },
      linearPredictions: {
        total: linearPredictions.predictions?.length || 0,
        confidence: linearPredictions.confidence,
        items: (linearPredictions.predictions || []).map(p => ({
          id: p.id, label: p.label, urgency: p.urgency,
          projectedDays: p.projection?.estimatedDays,
          recommendation: p.recommendation,
        })),
      },
      nonLinearPredictions: {
        available: nlPredictions.available || false,
        total: (nlPredictions.predictions || []).length,
        items: (nlPredictions.predictions || []).map(p => ({
          metric: p.metric, label: p.label, urgency: p.urgency,
          model: p.model,
          current: p.current,
          projection: p.projection,
          comparison: p.comparison,
        })),
        modelInfo: nlPredictions.modelInfo,
      },
      topApps,
      optimizationHistory: optHistory,
      totalOptimizations: optHistory.length,
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

  /**
   * Genera HTML profesional optimizado para impresión/PDF
   */
  _generatePDFHTML(data) {
    const riskColors = { low: '#10b981', medium: '#f59e0b', high: '#f97316', critical: '#ef4444' };
    const riskColor = riskColors[this._calculateRiskLevel(data.linearPredictions.items)] || '#6b7280';
    const healthColor = data.health.score >= 80 ? '#10b981' : data.health.score >= 60 ? '#f59e0b' : '#ef4444';
    const now = new Date(data.generatedAt).toLocaleString('es', { dateStyle: 'full', timeStyle: 'short' });

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Reporte PDF - ${data.device.model}</title>
  <style>
    @page { size: A4; margin: 20mm; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page-break { page-break-before: always; }
      .no-break { page-break-inside: avoid; }
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', -apple-system, sans-serif; background: #0f172a; color: #e2e8f0; font-size: 11px; line-height: 1.5; }
    .container { max-width: 800px; margin: 0 auto; padding: 20px; }

    /* PORTADA */
    .cover { text-align: center; padding: 80px 20px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%); border-radius: 16px; margin-bottom: 32px; border: 1px solid #475569; }
    .cover .logo { font-size: 48px; margin-bottom: 16px; }
    .cover h1 { font-size: 28px; color: #f1f5f9; margin-bottom: 8px; font-weight: 700; }
    .cover .subtitle { font-size: 16px; color: #94a3b8; margin-bottom: 24px; }
    .cover .device-name { font-size: 20px; color: #60a5fa; font-weight: 600; margin-bottom: 8px; }
    .cover .meta { color: #64748b; font-size: 12px; }
    .cover .divider { width: 60px; height: 3px; background: linear-gradient(90deg, #3b82f6, #8b5cf6); margin: 24px auto; border-radius: 2px; }

    /* TOC */
    .toc { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
    .toc h2 { font-size: 14px; color: #94a3b8; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 12px; }
    .toc ol { padding-left: 20px; }
    .toc li { padding: 4px 0; color: #cbd5e1; font-size: 12px; }

    /* SECCIONES */
    .section { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 16px; margin-bottom: 16px; }
    .section h2 { font-size: 15px; color: #f1f5f9; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; border-bottom: 1px solid #334155; padding-bottom: 8px; }
    .section h3 { font-size: 12px; color: #94a3b8; margin: 12px 0 8px; }

    /* CARDS */
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; }
    .kpi { background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 10px; text-align: center; }
    .kpi .label { font-size: 9px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }
    .kpi .value { font-size: 22px; font-weight: 700; color: #f1f5f9; margin: 4px 0; }
    .kpi .sub { font-size: 9px; color: #475569; }

    /* TABLAS */
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th, td { padding: 6px 8px; text-align: left; border-bottom: 1px solid #1e293b; font-size: 10px; }
    th { color: #94a3b8; font-weight: 600; text-transform: uppercase; font-size: 9px; letter-spacing: 0.5px; background: #0f172a; }
    td { color: #cbd5e1; }
    tr:hover { background: #1e293b; }

    /* BADGES */
    .badge { display: inline-block; padding: 1px 6px; border-radius: 4px; font-size: 9px; font-weight: 600; }
    .badge-critical { background: #991b1b; color: #fca5a5; }
    .badge-warning { background: #92400e; color: #fcd34d; }
    .badge-info { background: #1e3a5f; color: #93c5fd; }
    .badge-success { background: #065f46; color: #6ee7b7; }
    .badge-high { background: #7c2d12; color: #fdba74; }

    /* COMPARISON */
    .comparison { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 8px; }
    .comp-card { background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 10px; }
    .comp-card h4 { font-size: 10px; color: #94a3b8; margin-bottom: 4px; }
    .comp-card .metric { font-size: 16px; font-weight: 700; color: #f1f5f9; }
    .comp-card .detail { font-size: 9px; color: #64748b; }

    /* PROGRESS */
    .progress-bar { width: 100%; height: 6px; background: #334155; border-radius: 3px; overflow: hidden; margin-top: 4px; }
    .progress-fill { height: 100%; border-radius: 3px; }

    /* FOOTER */
    .footer { text-align: center; padding: 16px; color: #475569; font-size: 9px; border-top: 1px solid #1e293b; margin-top: 16px; }

    /* CHART PLACEHOLDER */
    .chart-bar { display: flex; align-items: flex-end; gap: 2px; height: 40px; margin-top: 8px; }
    .chart-bar .bar { flex: 1; background: #3b82f6; border-radius: 2px 2px 0 0; min-width: 3px; transition: height 0.3s; }
    .chart-bar .bar.future { background: #8b5cf6; opacity: 0.7; }
  </style>
</head>
<body>
<div class="container">

  <!-- PORTADA -->
  <div class="cover">
    <div class="logo">📱</div>
    <h1>Reporte Técnico Premium</h1>
    <div class="subtitle">Phone Optimizer — Análisis Completo del Dispositivo</div>
    <div class="divider"></div>
    <div class="device-name">${data.device.model}</div>
    <div class="meta">${data.device.brand} · Android ${data.device.android} · ${data.device.miui}</div>
    <div class="meta">Propietario: ${data.device.owner}</div>
    <div class="meta" style="margin-top:12px">Generado: ${now}</div>
  </div>

  <!-- TABLA DE CONTENIDOS -->
  <div class="toc">
    <h2>📑 Contenido</h2>
    <ol>
      <li>Resumen Ejecutivo</li>
      <li>Métricas del Sistema</li>
      <li>Benchmark de Rendimiento</li>
      <li>Anomalías Detectadas</li>
      <li>Predicciones Lineales</li>
      <li>Predicciones No Lineales (ML Avanzado)</li>
      <li>Top Apps por Uso</li>
      <li>Historial de Optimizaciones</li>
      <li>Resumen de Sesiones</li>
    </ol>
  </div>

  <!-- 1. RESUMEN EJECUTIVO -->
  <div class="section no-break">
    <h2>📋 1. Resumen Ejecutivo</h2>
    <div class="kpi-grid">
      <div class="kpi">
        <div class="label">Salud</div>
        <div class="value" style="color:${healthColor}">${data.health.score}</div>
        <div class="sub">${data.health.label}</div>
        <div class="progress-bar"><div class="progress-fill" style="width:${data.health.score}%;background:${healthColor}"></div></div>
      </div>
      <div class="kpi">
        <div class="label">Batería</div>
        <div class="value">${data.metrics.battery.current ?? '—'}%</div>
        <div class="sub">${data.metrics.battery.history.length} lecturas</div>
      </div>
      <div class="kpi">
        <div class="label">Temperatura</div>
        <div class="value">${data.metrics.temperature.current?.toFixed(1) ?? '—'}°C</div>
        <div class="sub">Máx: ${data.metrics.temperature.max?.toFixed(1) ?? '—'}°C</div>
      </div>
      <div class="kpi">
        <div class="label">Riesgo</div>
        <div class="value" style="color:${riskColor}">${this._calculateRiskLevel(data.linearPredictions.items).toUpperCase()}</div>
        <div class="sub">${data.linearPredictions.total + data.nonLinearPredictions.total} predicciones</div>
      </div>
    </div>
    <div class="kpi-grid">
      <div class="kpi">
        <div class="label">Anomalías</div>
        <div class="value">${data.anomalies.total}</div>
        <div class="sub">${data.anomalies.critical} críticas</div>
      </div>
      <div class="kpi">
        <div class="label">Optimizaciones</div>
        <div class="value">${data.totalOptimizations}</div>
        <div class="sub">sesiones</div>
      </div>
      <div class="kpi">
        <div class="label">Procesos</div>
        <div class="value">${data.metrics.processCount.current}</div>
        <div class="sub">Prom: ${data.metrics.processCount.average?.toFixed(0) ?? '—'}</div>
      </div>
      <div class="kpi">
        <div class="label">Sesiones</div>
        <div class="value">${data.sessionSummary.totalSessions}</div>
        <div class="sub">${data.sessionSummary.timespanDays} días</div>
      </div>
    </div>
  </div>

  <!-- 2. MÉTRICAS -->
  <div class="section no-break">
    <h2>📊 2. Métricas del Sistema</h2>
    <table>
      <tr><th>Métrica</th><th>Actual</th><th>Promedio</th><th>Máximo</th><th>Lecturas</th></tr>
      <tr><td>🔋 Batería</td><td>${data.metrics.battery.current ?? '—'}%</td><td>—</td><td>—</td><td>${data.metrics.battery.history.length}</td></tr>
      <tr><td>🌡️ Temperatura</td><td>${data.metrics.temperature.current?.toFixed(1) ?? '—'}°C</td><td>${data.metrics.temperature.average?.toFixed(1) ?? '—'}°C</td><td>${data.metrics.temperature.max?.toFixed(1) ?? '—'}°C</td><td>${data.metrics.temperature.history.length}</td></tr>
      <tr><td>⚙️ Procesos</td><td>${data.metrics.processCount.current}</td><td>${data.metrics.processCount.average?.toFixed(0) ?? '—'}</td><td>—</td><td>—</td></tr>
      ${data.metrics.storage ? `<tr><td>💾 Almacenamiento</td><td>${data.metrics.storage.usedPercent?.toFixed(1) ?? '—'}%</td><td>—</td><td>—</td><td>—</td></tr>` : ''}
      ${data.metrics.memory ? `<tr><td>🧠 Memoria</td><td>${data.metrics.memory.availablePercent?.toFixed(1) ?? '—'}%</td><td>—</td><td>—</td><td>—</td></tr>` : ''}
    </table>
  </div>

  ${data.benchmark ? `
  <!-- 3. BENCHMARK -->
  <div class="section no-break">
    <h2>🏋️ 3. Benchmark de Rendimiento</h2>
    <div class="kpi-grid">
      <div class="kpi"><div class="label">Score</div><div class="value">${data.benchmark.score ?? '—'}</div><div class="sub">/100</div></div>
      <div class="kpi"><div class="label">CPU</div><div class="value">${data.benchmark.cpu ?? '—'}</div></div>
      <div class="kpi"><div class="label">RAM</div><div class="value">${data.benchmark.ram ?? '—'}</div></div>
      <div class="kpi"><div class="label">I/O</div><div class="value">${data.benchmark.io ?? '—'}</div></div>
    </div>
  </div>` : ''}

  <!-- 4. ANOMALÍAS -->
  <div class="section no-break">
    <h2>🔴 4. Anomalías Detectadas (${data.anomalies.total})</h2>
    ${data.anomalies.total > 0 ? `
    <table>
      <tr><th>Tipo</th><th>Severidad</th><th>Mensaje</th></tr>
      ${data.anomalies.items.map(a => `
      <tr>
        <td>${a.type}</td>
        <td><span class="badge badge-${a.severity === 'critical' ? 'critical' : 'warning'}">${a.severity}</span></td>
        <td>${a.message}</td>
      </tr>`).join('')}
    </table>` : '<p style="color:#10b981">✅ Sin anomalías detectadas</p>'}
  </div>

  <!-- 5. PREDICCIONES LINEALES -->
  <div class="section no-break">
    <h2>🔮 5. Predicciones Lineales (${data.linearPredictions.total})</h2>
    <p style="color:#64748b;font-size:10px;margin-bottom:8px">Confianza del modelo: ${Math.round((data.linearPredictions.confidence || 0) * 100)}%</p>
    ${data.linearPredictions.total > 0 ? `
    <table>
      <tr><th>Fallo</th><th>Urgencia</th><th>Días Est.</th><th>Recomendación</th></tr>
      ${data.linearPredictions.items.map(p => `
      <tr>
        <td>${p.label}</td>
        <td><span class="badge badge-${p.urgency === 'critical' ? 'critical' : p.urgency === 'high' ? 'high' : 'info'}">${p.urgency}</span></td>
        <td>${p.projectedDays ?? '—'}</td>
        <td>${p.recommendation}</td>
      </tr>`).join('')}
    </table>` : '<p style="color:#10b981">✅ Sin riesgos lineales detectados</p>'}
  </div>

  <!-- 6. PREDICCIONES NO LINEALES -->
  <div class="page-break"></div>
  <div class="section no-break">
    <h2>📐 6. Predicciones No Lineales — ML Avanzado</h2>
    <p style="color:#64748b;font-size:10px;margin-bottom:12px">
      Algoritmo: ${data.nonLinearPredictions.modelInfo?.algorithm || 'Regresión Polinómica'} ·
      Grados: ${data.nonLinearPredictions.modelInfo?.degrees?.join(', ') || '2, 3'} ·
      Selección: ${data.nonLinearPredictions.modelInfo?.bestFitSelection || 'R² ajustado'}
    </p>
    ${data.nonLinearPredictions.total > 0 ? data.nonLinearPredictions.items.map(p => `
    <div style="background:#0f172a;border:1px solid #334155;border-radius:8px;padding:12px;margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <div>
          <strong style="color:#f1f5f9">${p.label}</strong>
          <span class="badge badge-${p.urgency === 'critical' ? 'critical' : p.urgency === 'high' ? 'high' : 'info'}" style="margin-left:8px">${p.urgency}</span>
        </div>
        <div style="text-align:right">
          <div style="font-size:10px;color:#64748b">Grado ${p.model.degree} · R²=${p.model.r2} · Adj.R²=${p.model.adjR2}</div>
          <div style="font-size:9px;color:#475569">MSE=${p.model.mse}</div>
        </div>
      </div>
      <div class="comparison">
        <div class="comp-card">
          <h4>Valor Actual</h4>
          <div class="metric">${p.current.value}${p.unit}</div>
          <div class="detail">Paso ${p.current.step}</div>
        </div>
        <div class="comp-card">
          <h4>Proyección (10 pasos)</h4>
          <div class="metric">${p.projection.targetValue}${p.unit}</div>
          <div class="detail">${p.projection.willReachCritical ? `⚠️ Umbral crítico en ~${p.projection.stepsUntilCritical} pasos` : 'Sin riesgo en horizonte'}</div>
        </div>
      </div>
      ${p.comparison ? `
      <div style="margin-top:8px;font-size:9px;color:#64748b">
        Comparación: Lineal R²=${p.comparison.linear.r2} vs Polinómico (grado ${p.comparison.nonLinear.degree}) R²=${p.comparison.nonLinear.adjR2}
        — <span style="color:${p.comparison.improvement > 0 ? '#10b981' : '#ef4444'}">${p.comparison.improvement > 0 ? '+' : ''}${p.comparison.improvement}% de mejora</span>
      </div>` : ''}
    </div>`).join('') : '<p style="color:#10b981">✅ Datos insuficientes para predicciones no lineales (mínimo 5 sesiones)</p>'}
  </div>

  <!-- 7. TOP APPS -->
  ${data.topApps.length > 0 ? `
  <div class="section no-break">
    <h2>📱 7. Top Apps por Uso</h2>
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

  <!-- 8. HISTORIAL OPTIMIZACIONES -->
  <div class="section no-break">
    <h2>⚡ 8. Historial de Optimizaciones (${data.totalOptimizations})</h2>
    ${data.optimizationHistory.length > 0 ? `
    <table>
      <tr><th>Fecha</th><th>Modo</th><th>Acciones</th><th>Duración</th><th>Resultado</th></tr>
      ${data.optimizationHistory.slice(-15).reverse().map(o => `
      <tr>
        <td>${new Date(o.timestamp).toLocaleString('es')}</td>
        <td>${o.mode || '—'}</td>
        <td>${o.actions}</td>
        <td>${o.duration ? (o.duration / 1000).toFixed(1) + 's' : '—'}</td>
        <td><span class="badge ${o.success ? 'badge-success' : 'badge-critical'}">${o.success ? '✅' : '❌'}</span></td>
      </tr>`).join('')}
    </table>` : '<p style="color:#64748b">Sin optimizaciones registradas</p>'}
  </div>

  <!-- 9. SESIONES -->
  <div class="section no-break">
    <h2>📅 9. Resumen de Sesiones</h2>
    <table>
      <tr><td>Total de sesiones</td><td><strong>${data.sessionSummary.totalSessions}</strong></td></tr>
      <tr><td>Primera conexión</td><td>${data.sessionSummary.firstSeen ? new Date(data.sessionSummary.firstSeen).toLocaleString('es') : '—'}</td></tr>
      <tr><td>Última conexión</td><td>${data.sessionSummary.lastSeen ? new Date(data.sessionSummary.lastSeen).toLocaleString('es') : '—'}</td></tr>
      <tr><td>Período analizado</td><td>${data.sessionSummary.timespanDays} días</td></tr>
    </table>
  </div>

  <div class="footer">
    Phone Optimizer Premium · Reporte generado automáticamente · ${now}<br>
    Modelo ML: Regresión Polinómica (grados 2-3) · Selección por R² ajustado · Predicciones a 10 pasos
  </div>
</div>
</body>
</html>`;
  }

  // Utilidades

  _avg(arr) {
    return arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
  }

  _calculateHealth(metrics) {
    let score = 100;
    if (metrics.battery.current != null) {
      if (metrics.battery.current < 20) score -= 25;
      else if (metrics.battery.current < 40) score -= 10;
    }
    if (metrics.temperature.current != null) {
      if (metrics.temperature.current > 42) score -= 25;
      else if (metrics.temperature.current > 37) score -= 10;
    }
    if (metrics.processCount.current > 120) score -= 15;
    else if (metrics.processCount.current > 80) score -= 5;

    score = Math.max(0, Math.min(100, score));
    let label = 'Excelente';
    if (score < 80) label = 'Bueno';
    if (score < 60) label = 'Regular';
    if (score < 40) label = 'Necesita atención';
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

module.exports = new PDFExporter();
