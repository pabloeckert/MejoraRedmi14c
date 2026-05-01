import React, { useMemo } from 'react';

export default function SmartInsights({ profile, predictions, anomalyResults, failurePredictions, proactiveResults }) {
  const insights = useMemo(() => {
    const items = [];

    if (!profile) return items;

    // ── Predicciones de fallo (Ciclo 5) ──
    if (failurePredictions?.predictions?.length > 0) {
      for (const pred of failurePredictions.predictions.slice(0, 5)) {
        const urgencyColors = {
          critical: 'critical',
          high: 'warning',
          medium: 'info',
          low: 'info',
        };

        items.push({
          type: urgencyColors[pred.urgency] || 'warning',
          icon: pred.icon || '🔮',
          title: `Predicción: ${pred.label}`,
          description: pred.description,
          badge: pred.urgency,
          items: [
            ...(pred.projection?.estimatedDays != null ? [{
              name: 'Tiempo estimado',
              detail: `${pred.projection.estimatedDays} días`,
              severity: pred.urgency === 'critical' ? 'warning' : 'info',
            }] : []),
            ...(pred.projection?.currentValue != null ? [{
              name: 'Valor actual',
              detail: `${pred.projection.currentValue}${pred.projection.unit || ''}`,
              severity: 'info',
            }] : []),
            ...(pred.projection?.projectedValue != null ? [{
              name: 'Proyección',
              detail: `${pred.projection.projectedValue}${pred.projection.unit || ''}`,
              severity: pred.urgency === 'critical' ? 'warning' : 'info',
            }] : []),
            ...(pred.recommendation ? [{
              name: '💡 Recomendación',
              detail: pred.recommendation,
              severity: 'info',
            }] : []),
          ],
        });
      }
    }

    // ── Acciones proactivas (Ciclo 5) ──
    if (proactiveResults?.proactiveActions?.length > 0) {
      for (const action of proactiveResults.proactiveActions.slice(0, 3)) {
        items.push({
          type: action.urgency === 'critical' ? 'critical' : 'warning',
          icon: action.icon || '🛡️',
          title: `Proactivo: ${action.label}`,
          description: action.description,
          badge: action.executed ? 'ejecutado' : action.urgency,
          items: [
            ...(action.impact ? [{
              name: 'Impacto estimado',
              detail: action.impact,
              severity: 'info',
            }] : []),
            ...(action.executed ? [{
              name: 'Estado',
              detail: '✅ Ejecutado automáticamente',
              severity: 'info',
            }] : []),
          ],
        });
      }
    }

    // ── Anomalías detectadas ──
    if (anomalyResults?.anomalies?.length > 0) {
      for (const anomaly of anomalyResults.anomalies.slice(0, 5)) {
        items.push({
          type: anomaly.severity === 'critical' ? 'critical' : 'warning',
          icon: anomaly.type.includes('battery') ? '🔋' :
                anomaly.type.includes('thermal') ? '🌡️' :
                anomaly.type.includes('process') ? '⚙️' :
                anomaly.type.includes('app') ? '📱' : '⚠️',
          title: formatAnomalyType(anomaly.type),
          description: anomaly.message,
          items: [],
        });
      }
    }

    // ── Apps problemáticas ──
    const topApps = Object.entries(profile.topApps || {})
      .sort((a, b) => b[1].totalTimeMs - a[1].totalTimeMs)
      .slice(0, 5);

    if (topApps.length > 0) {
      items.push({
        type: 'info',
        icon: '📱',
        title: 'Apps más utilizadas',
        description: 'Basado en historial de uso acumulado',
        items: topApps.map(([pkg, data]) => ({
          name: formatPackageName(pkg),
          detail: `${(data.totalTimeMs / 3600000).toFixed(1)}h · ${data.sessions} sesiones`,
          severity: data.totalTimeMs > 7200000 ? 'warning' : 'info',
        })),
      });
    }

    // ── Procesos recurrentes problemáticos ──
    const recurringProcs = Object.entries(profile.recurringProcesses || {})
      .filter(([_, v]) => v.count > (profile.totalProcessSnapshots || 1) * 0.7)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5);

    if (recurringProcs.length > 0) {
      items.push({
        type: 'warning',
        icon: '⚙️',
        title: 'Procesos persistentes detectados',
        description: 'Estos procesos aparecen en la mayoría de conexiones',
        items: recurringProcs.map(([name, data]) => ({
          name: formatProcessName(name),
          detail: `${data.count}/${profile.totalProcessSnapshots} conexiones`,
          severity: 'warning',
        })),
      });
    }

    // ── Temperatura ──
    if (profile.avgTemperature > 35) {
      items.push({
        type: profile.avgTemperature > 40 ? 'critical' : 'warning',
        icon: '🌡️',
        title: 'Temperatura promedio elevada',
        description: `${profile.avgTemperature.toFixed(1)}°C — ${profile.avgTemperature > 40 ? 'Riesgo de thermal throttling' : 'Considerar reducir carga de procesos'}`,
        items: [],
      });
    }

    // ── Batería ──
    if (profile.avgBatteryDrain > 5) {
      items.push({
        type: profile.avgBatteryDrain > 15 ? 'critical' : 'warning',
        icon: '🔋',
        title: 'Drenaje de batería detectado',
        description: `Pérdida promedio de ${profile.avgBatteryDrain.toFixed(1)}% por sesión`,
        items: [],
      });
    }

    // ── Predicciones ML ──
    if (predictions?.actions?.length > 0) {
      for (const pred of predictions.actions) {
        items.push({
          type: pred.urgency === 'high' ? 'critical' : 'warning',
          icon: '🧠',
          title: `Predicción ML: ${formatActionType(pred.type)}`,
          description: `Urgencia: ${pred.urgency} · Confianza: ${Math.round((predictions.confidence || 0) * 100)}%`,
          items: [],
        });
      }
    }

    // ── Recomendaciones basadas en score ──
    if (profile.healthScore < 60) {
      items.push({
        type: 'critical',
        icon: '🏥',
        title: 'Recomendación: Optimización completa',
        description: `El score de salud es ${profile.healthScore}/100. Se recomienda una optimización máxima.`,
        items: [],
      });
    }

    return items;
  }, [profile, predictions, anomalyResults, failurePredictions, proactiveResults]);

  if (!profile) {
    return (
      <div className="glass p-8 text-center">
        <div className="text-4xl mb-3 opacity-30">🧠</div>
        <p className="text-dark-400">Conecta un dispositivo para ver insights</p>
      </div>
    );
  }

  if (insights.length === 0) {
    return (
      <div className="glass p-6">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
          🧠 Smart Insights
        </h2>
        <div className="text-center py-6">
          <div className="text-3xl mb-2">✨</div>
          <p className="text-dark-300">Todo en orden</p>
          <p className="text-dark-500 text-sm mt-1">No se detectan problemas</p>
        </div>
      </div>
    );
  }

  // Contar por tipo para badges
  const criticalCount = insights.filter(i => i.type === 'critical').length;
  const warningCount = insights.filter(i => i.type === 'warning').length;

  return (
    <div className="glass p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          🧠 Smart Insights
        </h2>
        <div className="flex items-center gap-2">
          {criticalCount > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent-red/10 text-accent-red border border-accent-red/20">
              {criticalCount} críticos
            </span>
          )}
          {warningCount > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent-orange/10 text-accent-orange border border-accent-orange/20">
              {warningCount} warnings
            </span>
          )}
          <span className="text-xs text-dark-500">
            {insights.length} {insights.length === 1 ? 'hallazgo' : 'hallazgos'}
          </span>
        </div>
      </div>

      {/* Confianza de predicciones ML */}
      {failurePredictions?.confidence > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent-blue/5 border border-accent-blue/10">
          <span className="text-xs text-accent-blue">🧠</span>
          <span className="text-xs text-dark-400">
            Confianza ML: <strong className="text-dark-200">{Math.round(failurePredictions.confidence * 100)}%</strong>
            <span className="text-dark-500 ml-1">({failurePredictions.dataPoints} puntos de datos)</span>
          </span>
        </div>
      )}

      <div className="space-y-3">
        {insights.map((insight, i) => (
          <InsightCard key={i} insight={insight} />
        ))}
      </div>
    </div>
  );
}

function InsightCard({ insight }) {
  const typeStyles = {
    info: 'border-accent-blue/20 bg-accent-blue/5',
    warning: 'border-accent-orange/20 bg-accent-orange/5',
    critical: 'border-accent-red/20 bg-accent-red/5',
  };

  const typeBadge = {
    info: 'bg-accent-blue/10 text-accent-blue',
    warning: 'bg-accent-orange/10 text-accent-orange',
    critical: 'bg-accent-red/10 text-accent-red',
  };

  return (
    <div className={`rounded-xl border p-4 ${typeStyles[insight.type]}`}>
      <div className="flex items-start gap-3">
        <span className="text-xl mt-0.5">{insight.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-medium text-dark-100">{insight.title}</h3>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${typeBadge[insight.type]}`}>
              {insight.badge || insight.type}
            </span>
          </div>
          <p className="text-xs text-dark-400 mb-2">{insight.description}</p>
          {insight.items?.length > 0 && (
            <div className="space-y-1.5 mt-3">
              {insight.items.map((item, j) => (
                <div key={j} className="flex items-center justify-between bg-dark-900/30 rounded-lg px-3 py-1.5">
                  <span className="text-xs text-dark-200 font-mono truncate">{item.name}</span>
                  <span className={`text-xs ml-2 whitespace-nowrap ${
                    item.severity === 'warning' ? 'text-accent-orange' : 'text-dark-500'
                  }`}>{item.detail}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatPackageName(pkg) {
  const map = {
    'com.facebook.katana': 'Facebook',
    'com.instagram.android': 'Instagram',
    'com.whatsapp': 'WhatsApp',
    'com.google.android.youtube': 'YouTube',
    'com.zhiliaoapp.musically': 'TikTok',
    'com.twitter.android': 'Twitter/X',
    'com.snapchat.android': 'Snapchat',
    'com.spotify.music': 'Spotify',
  };
  return map[pkg] || pkg.split('.').pop();
}

function formatProcessName(name) {
  return name.replace(/com\.\w+\./g, '').replace(/android\./g, '');
}

function formatActionType(type) {
  const map = {
    'battery_optimization': 'Optimizar batería',
    'thermal_throttle': 'Reducir temperatura',
    'process_cleanup': 'Limpiar procesos',
  };
  return map[type] || type;
}

function formatAnomalyType(type) {
  const map = {
    'battery_spike': '🔴 Spike de batería',
    'battery_outlier': '🟡 Batería inusual',
    'thermal_spike': '🌡️ Spike de temperatura',
    'thermal_outlier': '🌡️ Temperatura inusual',
    'process_spike': '⚙️ Exceso de procesos',
    'process_outlier': '⚙️ Procesos inusuales',
    'app_excessive_usage': '📱 App con consumo excesivo',
    'app_usage_spike': '📱 Spike de uso de app',
    'rapid_degradation': '🔴 Degradación rápida',
  };
  return map[type] || `⚠️ ${type}`;
}
