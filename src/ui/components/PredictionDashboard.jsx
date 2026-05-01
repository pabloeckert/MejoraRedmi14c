import React, { useState, useEffect, useCallback } from 'react';

export default function PredictionDashboard({ deviceId, failurePredictions, proactiveResults }) {
  const [nlPredictions, setNlPredictions] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadNonLinearPredictions = useCallback(async () => {
    if (!deviceId) return;
    setLoading(true);
    try {
      const result = await window.optimizer.predictNonLinear?.({ deviceId });
      if (result && !result.error) {
        setNlPredictions(result);
      }
    } catch {}
    setLoading(false);
  }, [deviceId]);

  useEffect(() => {
    loadNonLinearPredictions();
  }, [loadNonLinearPredictions]);

  const linearPredictions = failurePredictions?.predictions || [];
  const nonLinearItems = nlPredictions?.predictions || [];
  const confidence = failurePredictions?.confidence || 0;
  const criticalCount = (failurePredictions?.criticalPredictions || 0) +
    nonLinearItems.filter(p => p.urgency === 'critical').length;

  if (!deviceId) {
    return (
      <div className="glass p-8 text-center">
        <div className="text-5xl mb-4 opacity-30">🔮</div>
        <h2 className="text-lg font-semibold text-dark-200 mb-2">Predicciones ML</h2>
        <p className="text-dark-400 text-sm">Conecta un dispositivo para ver predicciones</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con métricas clave */}
      <div className="glass p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🔮</span>
            <div>
              <h2 className="text-lg font-bold text-dark-100">Dashboard de Predicciones</h2>
              <p className="text-xs text-dark-400">IA predictiva · Modelos lineales + polinómicos</p>
            </div>
          </div>
          <button onClick={loadNonLinearPredictions} disabled={loading}
            className="text-xs px-3 py-1.5 bg-dark-700 hover:bg-dark-600 rounded-lg text-dark-300 transition-all disabled:opacity-50">
            {loading ? '⏳ Actualizando...' : '🔄 Actualizar'}
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KPICard
            label="Confianza ML"
            value={`${Math.round(confidence * 100)}%`}
            icon="🧠"
            color={confidence > 0.7 ? 'text-accent-green' : confidence > 0.4 ? 'text-accent-orange' : 'text-accent-red'}
          />
          <KPICard
            label="Predicciones"
            value={linearPredictions.length + nonLinearItems.length}
            icon="📊"
            color="text-accent-blue"
          />
          <KPICard
            label="Críticas"
            value={criticalCount}
            icon="🔴"
            color={criticalCount > 0 ? 'text-accent-red' : 'text-accent-green'}
          />
          <KPICard
            label="Modelos"
            value={`L:${linearPredictions.length} NL:${nonLinearItems.length}`}
            icon="📐"
            color="text-accent-purple"
          />
        </div>
      </div>

      {/* Comparación Linear vs No Lineal */}
      {nonLinearItems.length > 0 && (
        <div className="glass p-6">
          <h3 className="text-sm font-semibold text-dark-200 mb-4 flex items-center gap-2">
            <span>📐</span> Comparación: Modelo Lineal vs Polinómico
          </h3>
          <div className="space-y-3">
            {nonLinearItems.map((nlPred, i) => {
              const linearMatch = linearPredictions.find(lp =>
                (lp.id === 'battery_critical' && nlPred.metric === 'battery') ||
                (lp.id === 'thermal_shutdown' && nlPred.metric === 'temperature') ||
                (lp.id === 'process_explosion' && nlPred.metric === 'processes') ||
                (lp.id === 'memory_exhaustion' && nlPred.metric === 'memory') ||
                (lp.id === 'storage_full' && nlPred.metric === 'storage')
              );

              return (
                <div key={i} className="bg-dark-900/50 rounded-xl p-4 border border-dark-700/20">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-dark-100">{nlPred.label}</span>
                      <UrgencyBadge urgency={nlPred.urgency} />
                    </div>
                    <span className="text-[10px] text-dark-500">Grado {nlPred.model?.degree}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="text-center">
                      <div className="text-xs text-dark-500 mb-1">Actual</div>
                      <div className="text-lg font-bold text-dark-100">{nlPred.current?.value}{nlPred.unit}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-dark-500 mb-1">Proyección (10 pasos)</div>
                      <div className={`text-lg font-bold ${nlPred.projection?.willReachCritical ? 'text-accent-red' : 'text-accent-green'}`}>
                        {nlPred.projection?.targetValue}{nlPred.unit}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-dark-500 mb-1">R² Ajustado</div>
                      <div className="text-lg font-bold text-accent-blue">
                        {nlPred.model?.adjR2 ?? '—'}
                      </div>
                    </div>
                  </div>

                  {/* Comparación de R² */}
                  {nlPred.comparison && (
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-dark-500">
                        Lineal R²: <span className="text-dark-300">{nlPred.comparison.linear?.r2}</span>
                      </span>
                      <span className="text-dark-500">
                        Polinómico R²: <span className="text-dark-300">{nlPred.comparison.nonLinear?.adjR2}</span>
                      </span>
                      <span className={nlPred.comparison.improvement > 0 ? 'text-accent-green' : 'text-accent-red'}>
                        {nlPred.comparison.improvement > 0 ? '📈' : '📉'} {nlPred.comparison.improvement > 0 ? '+' : ''}{nlPred.comparison.improvement}%
                      </span>
                    </div>
                  )}

                  {/* Info del modelo */}
                  <div className="mt-2 text-[10px] text-dark-600">
                    Coeficientes: [{nlPred.model?.coefficients?.map(c => c.toFixed(3)).join(', ')}] · MSE: {nlPred.model?.mse}
                  </div>

                  {/* Umbral crítico */}
                  {nlPred.projection?.willReachCritical && (
                    <div className="mt-2 bg-accent-red/10 border border-accent-red/20 rounded-lg px-3 py-2">
                      <span className="text-xs text-accent-red">
                        ⚠️ Umbral crítico ({nlPred.projection.criticalThreshold}{nlPred.unit}) alcanzado en ~{nlPred.projection.stepsUntilCritical} pasos
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Predicciones Lineales */}
      {linearPredictions.length > 0 && (
        <div className="glass p-6">
          <h3 className="text-sm font-semibold text-dark-200 mb-4 flex items-center gap-2">
            <span>📈</span> Predicciones Lineales
          </h3>
          <div className="space-y-3">
            {linearPredictions.map((pred, i) => (
              <div key={i} className={`rounded-xl border p-4 ${
                pred.urgency === 'critical' ? 'border-accent-red/20 bg-accent-red/5' :
                pred.urgency === 'high' ? 'border-accent-orange/20 bg-accent-orange/5' :
                'border-dark-700/20 bg-dark-900/30'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span>{pred.icon}</span>
                    <span className="text-sm font-medium text-dark-100">{pred.label}</span>
                  </div>
                  <UrgencyBadge urgency={pred.urgency} />
                </div>
                <p className="text-xs text-dark-400 mb-2">{pred.description}</p>
                {pred.projection && (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-dark-500">Actual: </span>
                      <span className="text-dark-200">{pred.projection.currentValue}</span>
                    </div>
                    <div>
                      <span className="text-dark-500">Proyectado: </span>
                      <span className="text-dark-200">{pred.projection.projectedValue}</span>
                    </div>
                    {pred.projection.estimatedDays != null && (
                      <div className="col-span-2">
                        <span className="text-dark-500">Días estimados: </span>
                        <span className={`font-medium ${pred.projection.estimatedDays < 7 ? 'text-accent-red' : 'text-accent-orange'}`}>
                          {pred.projection.estimatedDays} días
                        </span>
                      </div>
                    )}
                  </div>
                )}
                {pred.recommendation && (
                  <div className="mt-2 text-xs text-dark-500 bg-dark-900/30 rounded-lg px-3 py-2">
                    💡 {pred.recommendation}
                  </div>
                )}
                {pred.trend && (
                  <div className="mt-2 text-[10px] text-dark-600">
                    R²: {pred.trend.r2?.toFixed(3)} · Pendiente: {pred.trend.slope?.toFixed(3)} · Dirección: {pred.trend.direction}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Acciones proactivas */}
      {proactiveResults?.proactiveActions?.length > 0 && (
        <div className="glass p-6">
          <h3 className="text-sm font-semibold text-dark-200 mb-4 flex items-center gap-2">
            <span>🛡️</span> Acciones Proactivas Recomendadas
          </h3>
          <div className="space-y-2">
            {proactiveResults.proactiveActions.map((action, i) => (
              <div key={i} className="flex items-center justify-between bg-dark-900/50 rounded-lg px-4 py-3 border border-dark-700/20">
                <div className="flex items-center gap-3">
                  <span>{action.icon}</span>
                  <div>
                    <div className="text-sm text-dark-100">{action.label}</div>
                    <div className="text-xs text-dark-400">{action.description}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <UrgencyBadge urgency={action.urgency} />
                  {action.preventable && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-green/10 text-accent-green">prevenible</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sin predicciones */}
      {linearPredictions.length === 0 && nonLinearItems.length === 0 && (
        <div className="glass p-8 text-center">
          <div className="text-4xl mb-3">✨</div>
          <h3 className="text-lg font-semibold text-dark-200 mb-2">Sin predicciones de riesgo</h3>
          <p className="text-dark-400 text-sm">El dispositivo está en buen estado según los modelos ML</p>
          <p className="text-dark-500 text-xs mt-2">Confianza del modelo: {Math.round(confidence * 100)}% · {failurePredictions?.dataPoints || 0} puntos de datos</p>
        </div>
      )}

      {/* Info del modelo */}
      {nlPredictions?.modelInfo && (
        <div className="glass p-4">
          <div className="text-xs text-dark-500 flex items-center gap-4">
            <span>🧠 Algoritmo: {nlPredictions.modelInfo.algorithm}</span>
            <span>📐 Grados: {nlPredictions.modelInfo.degrees?.join(', ')}</span>
            <span>📊 Selección: {nlPredictions.modelInfo.bestFitSelection}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function KPICard({ label, value, icon, color }) {
  return (
    <div className="bg-dark-900/50 rounded-xl p-3 border border-dark-700/20">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm">{icon}</span>
        <span className="text-[10px] text-dark-500 uppercase tracking-wider">{label}</span>
      </div>
      <div className={`text-xl font-bold ${color}`}>{value}</div>
    </div>
  );
}

function UrgencyBadge({ urgency }) {
  const styles = {
    critical: 'bg-accent-red/10 text-accent-red border-accent-red/20',
    high: 'bg-accent-orange/10 text-accent-orange border-accent-orange/20',
    medium: 'bg-accent-yellow/10 text-accent-yellow border-accent-yellow/20',
    low: 'bg-dark-700/50 text-dark-400 border-dark-600/20',
  };

  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${styles[urgency] || styles.low}`}>
      {urgency}
    </span>
  );
}
