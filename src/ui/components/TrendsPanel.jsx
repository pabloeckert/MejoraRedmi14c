import React, { useMemo } from 'react';
import { LineChart, BarChart, SparkLine } from './charts/Charts';

export default function TrendsPanel({ logs, deviceId }) {
  const trends = useMemo(() => {
    if (!logs || logs.length === 0) return null;

    const snapshots = logs.filter(l => l.type === 'snapshot');
    const optimizations = logs.filter(l => l.type === 'optimization');

    if (snapshots.length < 2) return null;

    // ── Battery trend ──
    const batteryData = snapshots
      .filter(s => s.battery?.level)
      .map((s, i) => ({
        value: parseInt(s.battery.level),
        label: new Date(s.timestamp).toLocaleDateString('es', { day: '2-digit', month: '2-digit' }),
      }));

    // ── Temperature trend ──
    const tempData = snapshots
      .filter(s => s.temperature != null)
      .map(s => ({
        value: s.temperature,
        label: new Date(s.timestamp).toLocaleDateString('es', { day: '2-digit', month: '2-digit' }),
      }));

    // ── Process count trend ──
    const processData = snapshots
      .filter(s => s.processes?.length)
      .map(s => ({
        value: s.processes.length,
        label: new Date(s.timestamp).toLocaleDateString('es', { day: '2-digit', month: '2-digit' }),
      }));

    // ── Top apps ──
    const appUsage = {};
    for (const s of snapshots) {
      if (!s.usageStats) continue;
      for (const app of s.usageStats) {
        appUsage[app.package] = (appUsage[app.package] || 0) + app.totalTimeMs;
      }
    }
    const topAppsData = Object.entries(appUsage)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([pkg, ms]) => ({
        label: pkg.split('.').pop(),
        value: Math.round(ms / 60000), // minutos
        color: getAppColor(pkg),
      }));

    // ── Optimization performance ──
    const perfData = optimizations.map(o => ({
      value: o.durationMs ? Math.round(o.durationMs / 1000) : 0,
      label: new Date(o.timestamp).toLocaleDateString('es', { day: '2-digit', month: '2-digit' }),
    }));

    // ── Summary stats ──
    const totalOptimizations = optimizations.length;
    const successRate = optimizations.length > 0
      ? Math.round(optimizations.filter(o => o.success).length / optimizations.length * 100)
      : 0;
    const avgDuration = optimizations.length > 0
      ? Math.round(optimizations.reduce((sum, o) => sum + (o.durationMs || 0), 0) / optimizations.length / 1000)
      : 0;
    const totalBloatware = optimizations.reduce((sum, o) => sum + (o.bloatwareRemoved || 0), 0);

    return {
      batteryData,
      tempData,
      processData,
      topAppsData,
      perfData,
      stats: { totalOptimizations, successRate, avgDuration, totalBloatware },
    };
  }, [logs]);

  if (!logs || logs.length === 0) {
    return (
      <div className="glass p-8 text-center">
        <div className="text-4xl mb-3 opacity-30">📈</div>
        <p className="text-dark-400">Sin datos de tendencias aún</p>
        <p className="text-dark-500 text-sm mt-1">Los gráficos aparecerán después de la primera optimización</p>
      </div>
    );
  }

  if (!trends) {
    return (
      <div className="glass p-8 text-center">
        <div className="animate-pulse text-2xl mb-2">📊</div>
        <p className="text-dark-400">Necesito al menos 2 snapshots para mostrar tendencias</p>
      </div>
    );
  }

  return (
    <div className="glass p-6 space-y-6">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        📈 Tendencias Históricas
      </h2>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MiniStat label="Optimizaciones" value={trends.stats.totalOptimizations} icon="⚡" />
        <MiniStat label="Tasa de éxito" value={`${trends.stats.successRate}%`} icon="✅" />
        <MiniStat label="Duración prom." value={`${trends.stats.avgDuration}s`} icon="⏱️" />
        <MiniStat label="Bloatware total" value={trends.stats.totalBloatware} icon="🗑️" />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Battery Trend */}
        {trends.batteryData.length >= 2 && (
          <ChartCard title="🔋 Tendencia de Batería" subtitle="% de carga por conexión">
            <LineChart
              data={trends.batteryData}
              width={460}
              height={180}
              color="#10b981"
              label="battery"
              unit="%"
            />
          </ChartCard>
        )}

        {/* Temperature Trend */}
        {trends.tempData.length >= 2 && (
          <ChartCard title="🌡️ Tendencia de Temperatura" subtitle="°C por conexión">
            <LineChart
              data={trends.tempData}
              width={460}
              height={180}
              color="#f59e0b"
              label="temp"
              unit="°C"
            />
          </ChartCard>
        )}

        {/* Process Count */}
        {trends.processData.length >= 2 && (
          <ChartCard title="⚙️ Procesos por Conexión" subtitle="Cantidad de procesos activos">
            <LineChart
              data={trends.processData}
              width={460}
              height={180}
              color="#3b82f6"
              label="processes"
            />
          </ChartCard>
        )}

        {/* Top Apps */}
        {trends.topAppsData.length > 0 && (
          <ChartCard title="📱 Apps Más Usadas" subtitle="Minutos de uso total">
            <BarChart
              data={trends.topAppsData}
              width={460}
              height={180}
              color="#8b5cf6"
              label="apps"
            />
          </ChartCard>
        )}

        {/* Optimization Duration */}
        {trends.perfData.length >= 2 && (
          <ChartCard title="⚡ Rendimiento de Optimización" subtitle="Duración en segundos">
            <LineChart
              data={trends.perfData}
              width={460}
              height={180}
              color="#ec4899"
              label="perf"
              unit="s"
            />
          </ChartCard>
        )}
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="bg-dark-900/50 rounded-xl p-4 border border-dark-700/30">
      <h3 className="text-sm font-medium text-dark-200 mb-1">{title}</h3>
      {subtitle && <p className="text-xs text-dark-500 mb-3">{subtitle}</p>}
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

function MiniStat({ label, value, icon }) {
  return (
    <div className="bg-dark-900/50 rounded-lg p-3 border border-dark-700/20">
      <div className="text-lg mb-1">{icon}</div>
      <div className="text-xl font-bold text-dark-100">{value}</div>
      <div className="text-xs text-dark-400">{label}</div>
    </div>
  );
}

function getAppColor(pkg) {
  const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#f97316'];
  let hash = 0;
  for (let i = 0; i < pkg.length; i++) hash = pkg.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}
