import React, { useState, useEffect, useCallback } from 'react';

export default function AdvancedDiagnostics({ deviceId }) {
  const [diagnostics, setDiagnostics] = useState(null);
  const [loading, setLoading] = useState(false);

  const runDiagnostics = useCallback(async () => {
    if (!deviceId) return;
    setLoading(true);
    try {
      const data = await window.optimizer.runAdvancedDiagnostics({ deviceId });
      if (!data.error) setDiagnostics(data);
    } catch {}
    setLoading(false);
  }, [deviceId]);

  useEffect(() => { runDiagnostics(); }, [runDiagnostics]);

  if (!deviceId) {
    return (
      <div className="glass p-8 text-center">
        <p className="text-dark-400">Conecta un dispositivo para ejecutar diagnósticos</p>
      </div>
    );
  }

  if (loading && !diagnostics) {
    return (
      <div className="glass p-8 text-center">
        <div className="animate-pulse text-3xl mb-3">🔬</div>
        <p className="text-dark-400">Ejecutando diagnóstico avanzado...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          🔬 Diagnóstico Avanzado
        </h2>
        <button onClick={runDiagnostics} disabled={loading}
          className="text-xs px-3 py-1.5 bg-dark-700 hover:bg-dark-600 rounded-lg text-dark-200 disabled:opacity-50">
          {loading ? '⏳' : '🔄'} Actualizar
        </button>
      </div>

      {diagnostics && (
        <>
          {/* Battery Health */}
          <Card icon="🔋" title="Salud de Batería">
            <MetricRow label="Nivel" value={`${diagnostics.battery?.level || '?'}%`} />
            <MetricRow label="Estado" value={diagnostics.battery?.status || '?'} />
            <MetricRow label="Voltaje" value={`${diagnostics.battery?.voltage || '?'}mV`} />
            <MetricRow label="Temperatura" value={`${diagnostics.battery?.temperature || '?'}°C`} />
            <MetricRow label="Tecnología" value={diagnostics.battery?.technology || '?'} />
            <MetricRow label="Carga" value={diagnostics.battery?.plugged || 'N/A'} />
          </Card>

          {/* Temperature by Component */}
          <Card icon="🌡️" title="Temperatura por Componente">
            {diagnostics.thermal?.zones?.length > 0 ? (
              diagnostics.thermal.zones.map((z, i) => (
                <MetricRow key={i} label={z.name} value={`${z.temp}°C`}
                  danger={z.temp > 40} />
              ))
            ) : (
              <p className="text-xs text-dark-500">No disponible</p>
            )}
          </Card>

          {/* Sensors */}
          <Card icon="📡" title="Estado de Sensores">
            {diagnostics.sensors?.length > 0 ? (
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {diagnostics.sensors.slice(0, 10).map((s, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-dark-300 font-mono truncate">{s.name}</span>
                    <span className="text-dark-400">{s.value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-dark-500">No disponible</p>
            )}
          </Card>

          {/* Radio Status */}
          <Card icon="📶" title="Estado de Radio">
            <MetricRow label="WiFi" value={diagnostics.radio?.wifi || '?'} />
            <MetricRow label="WiFi IP" value={diagnostics.radio?.wifiIp || '?'} mono />
            <MetricRow label="LTE/Red" value={diagnostics.radio?.mobile || '?'} />
            <MetricRow label="Operador" value={diagnostics.radio?.carrier || '?'} />
            <MetricRow label="Tipo de red" value={diagnostics.radio?.networkType || '?'} />
          </Card>

          {/* MIUI Services */}
          <Card icon="🏷️" title="Servicios MIUI/HyperOS">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-dark-400">Activos</span>
              <span className={`text-sm font-bold ${
                (diagnostics.miui?.count || 0) > 15 ? 'text-accent-red' : 'text-accent-green'
              }`}>{diagnostics.miui?.count || 0}</span>
            </div>
            {diagnostics.miui?.services?.slice(0, 8).map((s, i) => (
              <div key={i} className="text-xs text-dark-500 font-mono truncate py-0.5">{s}</div>
            ))}
          </Card>

          {/* Zombie Processes */}
          <Card icon="💀" title="Procesos Zombis">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-dark-400">Detectados</span>
              <span className={`text-sm font-bold ${
                (diagnostics.zombies?.count || 0) > 0 ? 'text-accent-red' : 'text-accent-green'
              }`}>{diagnostics.zombies?.count || 0}</span>
            </div>
            {diagnostics.zombies?.count > 0 && (
              <p className="text-xs text-accent-orange">
                ⚠️ Procesos zombis consumen recursos sin hacer nada
              </p>
            )}
          </Card>

          {/* Self-Reactivating Services */}
          <Card icon="🔄" title="Servicios que se Reactivan">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-dark-400">Detectados</span>
              <span className={`text-sm font-bold ${
                (diagnostics.selfReactivate?.count || 0) > 0 ? 'text-accent-orange' : 'text-accent-green'
              }`}>{diagnostics.selfReactivate?.count || 0}</span>
            </div>
            {diagnostics.selfReactivate?.services?.slice(0, 5).map((s, i) => (
              <div key={i} className="text-xs text-dark-500 font-mono truncate py-0.5">{s}</div>
            ))}
            {(diagnostics.selfReactivate?.count || 0) > 0 && (
              <p className="text-xs text-dark-400 mt-2">
                Estos servicios se reactivan después de ser deshabilitados.
                Considera usar "Deshabilitar permanente" en la optimización.
              </p>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function Card({ icon, title, children }) {
  return (
    <div className="glass p-5">
      <h3 className="text-sm font-semibold text-dark-200 mb-3 flex items-center gap-2">
        <span>{icon}</span> {title}
      </h3>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function MetricRow({ label, value, mono = false, danger = false }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-dark-400">{label}</span>
      <span className={`${mono ? 'font-mono text-xs' : ''} ${
        danger ? 'text-accent-red' : 'text-dark-200'
      }`}>{value}</span>
    </div>
  );
}
