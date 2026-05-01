import React from 'react';

const STATES = {
  IDLE: 'idle',
  DETECTING: 'detecting',
  DETECTED: 'detected',
  OPTIMIZING: 'optimizing',
  DONE: 'done',
  ERROR: 'error',
};

export default function Dashboard({ state, device, result, logs, onOptimize }) {
  return (
    <div className="glass-strong p-6 flex-1">
      {/* Título del dashboard */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">Dashboard</h2>
        {state === STATES.OPTIMIZING && (
          <span className="text-accent-orange text-sm animate-pulse flex items-center gap-2">
            <span className="animate-spin">⚡</span>
            Optimizando...
          </span>
        )}
      </div>

      {/* Estado vacío */}
      {state === STATES.IDLE && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-6xl mb-6 opacity-30">🔧</div>
          <h3 className="text-xl font-medium text-dark-300 mb-2">
            Esperando dispositivo
          </h3>
          <p className="text-dark-500 max-w-md">
            Conecta un teléfono Android por USB y pulso "Detectar dispositivo"
            para comenzar la optimización.
          </p>
        </div>
      )}

      {/* Optimizando */}
      {state === STATES.OPTIMIZING && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="relative w-24 h-24 mb-6">
            <div className="absolute inset-0 border-4 border-dark-700 rounded-full" />
            <div className="absolute inset-0 border-4 border-accent-purple border-t-transparent rounded-full animate-spin" />
            <div className="absolute inset-3 border-4 border-dark-700 rounded-full" />
            <div className="absolute inset-3 border-4 border-accent-pink border-b-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
          </div>
          <h3 className="text-xl font-medium text-dark-200 mb-2">
            {device?.firstConnection
              ? 'Optimización máxima en progreso...'
              : 'Optimización inteligente en progreso...'}
          </h3>
          <p className="text-dark-400 text-sm">
            Esto puede tomar unos minutos
          </p>
        </div>
      )}

      {/* Resultados */}
      {state === STATES.DONE && result && (
        <div className="space-y-4">
          {/* Stats cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon="🗑️"
              label="Bloatware eliminado"
              value={result.bloatwareRemoved || 0}
              color="red"
            />
            <StatCard
              icon="⚙️"
              label="Servicios desactivados"
              value={result.servicesDisabled || 0}
              color="orange"
            />
            <StatCard
              icon="📋"
              label="Acciones ejecutadas"
              value={result.actions?.length || 0}
              color="blue"
            />
            <StatCard
              icon="⏱️"
              label="Duración"
              value={`${((result.durationMs || 0) / 1000).toFixed(1)}s`}
              color="purple"
            />
          </div>

          {/* Lista de acciones */}
          <div className="mt-6">
            <h3 className="text-sm font-medium text-dark-400 mb-3">Acciones realizadas</h3>
            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-2">
              {(result.actions || []).map((action, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className="text-accent-green text-xs">✓</span>
                  <span className="text-dark-300 font-mono text-xs">{action}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Errores si los hay */}
          {result.errors?.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-accent-red mb-3">
                ⚠️ Errores ({result.errors.length})
              </h3>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-2">
                {result.errors.map((err, i) => (
                  <div key={i} className="text-xs text-dark-400 font-mono bg-dark-900/50 p-2 rounded">
                    {err.package || err.action}: {err.error}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Historial de conexiones */}
      {logs.length > 0 && state !== STATES.IDLE && (
        <div className="mt-6 pt-6 border-t border-dark-700">
          <h3 className="text-sm font-medium text-dark-400 mb-3">
            Historial ({logs.length} eventos)
          </h3>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
            {logs.slice(-5).reverse().map((log, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-dark-500">
                  {new Date(log.timestamp).toLocaleString('es')}
                </span>
                <span className={`font-mono ${
                  log.type === 'optimization'
                    ? log.success ? 'text-accent-green' : 'text-accent-red'
                    : 'text-dark-400'
                }`}>
                  {log.type === 'optimization'
                    ? `${log.mode} — ${log.success ? 'OK' : 'ERROR'}`
                    : log.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  const colorMap = {
    red: 'from-accent-red/10 to-accent-red/5 border-accent-red/20',
    orange: 'from-accent-orange/10 to-accent-orange/5 border-accent-orange/20',
    blue: 'from-accent-blue/10 to-accent-blue/5 border-accent-blue/20',
    purple: 'from-accent-purple/10 to-accent-purple/5 border-accent-purple/20',
    green: 'from-accent-green/10 to-accent-green/5 border-accent-green/20',
  };

  return (
    <div className={`bg-gradient-to-br ${colorMap[color]} border rounded-xl p-4`}>
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-2xl font-bold text-dark-100">{value}</div>
      <div className="text-xs text-dark-400 mt-1">{label}</div>
    </div>
  );
}
