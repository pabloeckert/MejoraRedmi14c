import React, { useState, useEffect } from 'react';

/**
 * UI del Sample Plugin
 * Panel que muestra info básica del dispositivo usando la Plugin API
 */
export default function SamplePluginPanel({ deviceId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const result = await window.optimizer.runPluginScript?.({
        pluginId: 'sample-plugin',
        method: 'analyze',
        args: [deviceId],
      });
      setData(result);
    } catch (err) {
      setData({ error: err.message });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-dark-100">
          🔌 Sample Plugin
        </h3>
        <button
          onClick={runAnalysis}
          disabled={loading || !deviceId}
          className="text-xs px-3 py-1.5 bg-accent-blue/20 hover:bg-accent-blue/30 rounded-lg text-accent-blue disabled:opacity-40"
        >
          {loading ? 'Analizando...' : '▶ Ejecutar'}
        </button>
      </div>

      {!deviceId && (
        <p className="text-xs text-dark-500">Conectá un dispositivo para ejecutar</p>
      )}

      {data && !data.error && (
        <div className="glass p-4 space-y-2">
          {data.data?.device && (
            <div>
              <span className="text-xs text-dark-400">Dispositivo: </span>
              <span className="text-xs text-dark-200">
                {data.data.device.brand} {data.data.device.model} (Android {data.data.device.android})
              </span>
            </div>
          )}
          {data.data?.battery !== undefined && (
            <div>
              <span className="text-xs text-dark-400">Batería: </span>
              <span className="text-xs text-dark-200">{data.data.battery}%</span>
            </div>
          )}
          {data.data?.storage && (
            <div>
              <span className="text-xs text-dark-400">Almacenamiento: </span>
              <span className="text-xs text-dark-200">
                {data.data.storage.used} / {data.data.storage.total}
              </span>
            </div>
          )}
          <div className="text-[10px] text-dark-500 mt-2">
            Ejecutado: {data.timestamp}
          </div>
        </div>
      )}

      {data?.error && (
        <div className="glass p-4 border border-red-500/20">
          <p className="text-xs text-red-400">Error: {data.error}</p>
        </div>
      )}
    </div>
  );
}
