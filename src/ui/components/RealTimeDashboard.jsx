import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DonutChart, SparkLine } from '../charts/Charts';

const POLL_INTERVAL = 3000; // 3 segundos

export default function RealTimeDashboard({ deviceId }) {
  const [metrics, setMetrics] = useState(null);
  const [history, setHistory] = useState({ cpu: [], ram: [], temp: [], battery: [] });
  const [connected, setConnected] = useState(false);
  const intervalRef = useRef(null);

  const fetchMetrics = useCallback(async () => {
    if (!deviceId) return;
    try {
      const data = await window.optimizer.getRealTimeMetrics({ deviceId });
      if (data.error) {
        console.warn('Metrics error:', data.error);
        return;
      }
      setMetrics(data);
      setConnected(true);

      setHistory(prev => {
        const now = new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const maxPoints = 30;
        return {
          cpu: [...prev.cpu, { value: data.cpu?.usage || 0, label: now }].slice(-maxPoints),
          ram: [...prev.ram, { value: data.memory?.percent || 0, label: now }].slice(-maxPoints),
          temp: [...prev.temp, { value: data.temperature || 0, label: now }].slice(-maxPoints),
          battery: [...prev.battery, { value: parseInt(data.battery?.level) || 0, label: now }].slice(-maxPoints),
        };
      });
    } catch (err) {
      setConnected(false);
    }
  }, [deviceId]);

  useEffect(() => {
    if (!deviceId) return;

    fetchMetrics();
    intervalRef.current = setInterval(fetchMetrics, POLL_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [deviceId, fetchMetrics]);

  if (!deviceId) {
    return (
      <div className="glass p-8 text-center">
        <p className="text-dark-400">Conecta un dispositivo para ver métricas en tiempo real</p>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="glass p-8 text-center">
        <div className="animate-pulse text-2xl mb-2">📊</div>
        <p className="text-dark-400">Cargando métricas...</p>
      </div>
    );
  }

  return (
    <div className="glass p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          📊 Métricas en Tiempo Real
        </h2>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-accent-green animate-pulse' : 'bg-accent-red'}`} />
          <span className="text-xs text-dark-400">
            {connected ? 'En vivo' : 'Desconectado'}
          </span>
          <span className="text-xs text-dark-600 ml-2">
            Actualización cada {POLL_INTERVAL / 1000}s
          </span>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* CPU */}
        <MetricCard
          icon="🖥️"
          label="CPU"
          value={`${(metrics.cpu?.usage || 0).toFixed(1)}%`}
          detail={`${metrics.cpu?.cores || '?'} cores${metrics.cpu?.freq ? ` · ${metrics.cpu.freq}MHz` : ''}`}
          sparkData={history.cpu.map(d => d.value)}
          color="#3b82f6"
          danger={metrics.cpu?.usage > 80}
        />

        {/* RAM */}
        <MetricCard
          icon="🧠"
          label="RAM"
          value={`${metrics.memory?.percent || 0}%`}
          detail={`${metrics.memory?.usedMb || 0}/${metrics.memory?.totalMb || 0} MB`}
          sparkData={history.ram.map(d => d.value)}
          color="#8b5cf6"
          danger={metrics.memory?.percent > 85}
        />

        {/* Temperatura */}
        <MetricCard
          icon="🌡️"
          label="Temperatura"
          value={`${(metrics.temperature || 0).toFixed(1)}°C`}
          detail={metrics.temperature > 40 ? '⚠️ Alta' : metrics.temperature > 35 ? 'Caliente' : 'Normal'}
          sparkData={history.temp.map(d => d.value)}
          color="#f59e0b"
          danger={metrics.temperature > 40}
        />

        {/* Batería */}
        <MetricCard
          icon="🔋"
          label="Batería"
          value={`${metrics.battery?.level || '?'}%`}
          detail={metrics.battery?.status === 'Charging' ? '⚡ Cargando' : `🔌 ${metrics.battery?.plugged || 'N/A'}`}
          sparkData={history.battery.map(d => d.value)}
          color="#10b981"
          danger={parseInt(metrics.battery?.level) < 20}
        />
      </div>

      {/* Procesos y Servicios */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Procesos */}
        <div className="bg-dark-900/50 rounded-xl p-4">
          <h3 className="text-sm font-medium text-dark-300 mb-3">⚙️ Procesos activos</h3>
          <div className="text-3xl font-bold text-dark-100 mb-1">{metrics.processCount || 0}</div>
          <div className="text-xs text-dark-500">
            {metrics.processCount > 100 ? '⚠️ Muchos procesos — considerar limpieza' : '✅ Normal'}
          </div>
          {metrics.topApps?.length > 0 && (
            <div className="mt-3 space-y-1">
              <div className="text-xs text-dark-400">Apps recientes:</div>
              {metrics.topApps.slice(0, 5).map((app, i) => (
                <div key={i} className="text-xs text-dark-500 font-mono truncate">{app}</div>
              ))}
            </div>
          )}
        </div>

        {/* Servicios MIUI */}
        <div className="bg-dark-900/50 rounded-xl p-4">
          <h3 className="text-sm font-medium text-dark-300 mb-3">🏷️ Servicios MIUI/HyperOS</h3>
          <div className="text-3xl font-bold text-dark-100 mb-1">{metrics.miuiServices?.length || 0}</div>
          <div className="text-xs text-dark-500">
            {metrics.miuiServices?.length > 10 ? '⚠️ Servicios excesivos' : '✅ Controlados'}
          </div>
          {metrics.miuiServices?.length > 0 && (
            <div className="mt-3 space-y-1 max-h-24 overflow-y-auto">
              {metrics.miuiServices.slice(0, 8).map((svc, i) => (
                <div key={i} className="text-xs text-dark-500 font-mono truncate">{svc}</div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CPU y RAM gauge */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-dark-900/50 rounded-xl p-4 flex items-center justify-center">
          <div className="relative">
            <DonutChart value={metrics.cpu?.usage || 0} max={100} size={130} color="#3b82f6" label="CPU" />
          </div>
        </div>
        <div className="bg-dark-900/50 rounded-xl p-4 flex items-center justify-center">
          <div className="relative">
            <DonutChart value={metrics.memory?.percent || 0} max={100} size={130} color="#8b5cf6" label="RAM" />
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, detail, sparkData, color, danger }) {
  return (
    <div className={`bg-dark-900/50 rounded-xl p-4 border transition-all duration-300 ${
      danger ? 'border-accent-red/40 shadow-lg shadow-accent-red/10' : 'border-dark-700/30'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-lg">{icon}</span>
        <SparkLine data={sparkData} width={60} height={20} color={color} />
      </div>
      <div className="text-2xl font-bold text-dark-100">{value}</div>
      <div className="text-xs text-dark-400 mt-1">{label}</div>
      <div className={`text-xs mt-1 ${danger ? 'text-accent-red' : 'text-dark-500'}`}>{detail}</div>
    </div>
  );
}
