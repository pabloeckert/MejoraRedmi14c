import React from 'react';

export default function OptimizationPanel({ result }) {
  if (!result) return null;

  const mode = result.mode === 'max' ? 'Máxima' : 'Inteligente';
  const modeEmoji = result.mode === 'max' ? '🔥' : '🧠';

  return (
    <div className="glass p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">
          {modeEmoji} Optimización {mode}
        </h2>
        <span className={`text-sm px-3 py-1 rounded-full ${
          result.success
            ? 'bg-accent-green/10 text-accent-green border border-accent-green/20'
            : 'bg-accent-red/10 text-accent-red border border-accent-red/20'
        }`}>
          {result.success ? '✅ Completada' : '⚠️ Con errores'}
        </span>
      </div>

      {/* Detalles del modo */}
      {result.mode === 'max' && (
        <div className="space-y-3">
          <DetailRow
            emoji="🗑️"
            title="Bloatware eliminado"
            desc={`${result.bloatwareRemoved} aplicaciones preinstaladas removidas`}
          />
          <DetailRow
            emoji="⚙️"
            title="Servicios MIUI desactivados"
            desc={`${result.servicesDisabled} servicios en background detenidos`}
          />
          <DetailRow
            emoji="🚀"
            title="Modo Xiaomi 17 Ultra activado"
            desc="GPU forzada, animaciones desactivadas, rendimiento máximo"
          />
          <DetailRow
            emoji="🧹"
            title="Limpieza profunda ejecutada"
            desc="Cache, thumbnails, tombstones y archivos temporales eliminados"
          />
          <DetailRow
            emoji="🔋"
            title="Batería optimizada"
            desc="Servicios de background limitados, doze mode habilitado"
          />
        </div>
      )}

      {result.mode === 'smart' && (
        <div className="space-y-3">
          {result.actions?.map((action, i) => (
            <DetailRow
              key={i}
              emoji="✓"
              title={formatActionName(action)}
              desc=""
            />
          ))}
          {result.adjustments?.length > 0 && (
            <div className="mt-4 pt-4 border-t border-dark-700">
              <h3 className="text-sm font-medium text-dark-400 mb-2">Ajustes</h3>
              {result.adjustments.map((adj, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-dark-400">
                  <span className={adj.status === 'done' ? 'text-accent-green' : 'text-accent-red'}>
                    {adj.status === 'done' ? '✓' : '✗'}
                  </span>
                  <span className="font-mono">{adj.type}</span>
                  <span className="text-dark-600">({adj.priority})</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DetailRow({ emoji, title, desc }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-lg mt-0.5">{emoji}</span>
      <div>
        <div className="text-sm font-medium text-dark-200">{title}</div>
        {desc && <div className="text-xs text-dark-400 mt-0.5">{desc}</div>}
      </div>
    </div>
  );
}

function formatActionName(action) {
  const map = {
    cache_cleared: '🧹 Cache limpiado',
    memory_optimized: '🧠 Memoria optimizada',
    performance_enforced: '🚀 Rendimiento reforzado',
    processes_killed: '⚙️ Procesos en background eliminados',
    deep_clean_completed: '🧹 Limpieza profunda ejecutada',
    battery_saver_enabled: '🔋 Modo ahorro activado',
    heavy_apps_killed: '💪 Apps pesadas cerradas',
    cpu_load_reduced: '📉 Carga CPU reducida',
    bloatware_removed: '🗑️ Bloatware eliminado',
    ui_refreshed: '🎨 UI refrescada',
  };

  for (const [key, label] of Object.entries(map)) {
    if (action.startsWith(key)) return label;
  }
  return `✓ ${action}`;
}
