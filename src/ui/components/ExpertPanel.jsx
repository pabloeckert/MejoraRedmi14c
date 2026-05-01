import React, { useState, useEffect, useCallback, useRef } from 'react';

/**
 * ExpertPanel - Modo Experto: panel técnico profundo
 * Muestra logs crudos, telemetría, predicciones híbridas, estado interno, latencias, memoria
 */
export default function ExpertPanel({ deviceId }) {
  const [activeSection, setActiveSection] = useState('overview');
  const [systemInfo, setSystemInfo] = useState(null);
  const [telemetryData, setTelemetryData] = useState(null);
  const [rawLogs, setRawLogs] = useState([]);
  const [hybridMetrics, setHybridMetrics] = useState(null);
  const [pluginList, setPluginList] = useState([]);
  const [guardianStatus, setGuardianStatus] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [memoryInfo, setMemoryInfo] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const [sysInfo, telemetry, logs, metrics, plugins, guardian] = await Promise.all([
        window.optimizer.getSystemInfo?.() || Promise.resolve(null),
        window.optimizer.getTelemetry?.({ deviceId, limit: 100 }) || Promise.resolve(null),
        window.optimizer.getDeviceLogs?.({ deviceId, limit: 50 }) || Promise.resolve([]),
        window.optimizer.getHybridAIMetrics?.() || Promise.resolve(null),
        window.optimizer.listPlugins?.() || Promise.resolve([]),
        window.optimizer.guardianStatus?.({ deviceId }) || Promise.resolve(null),
      ]);

      setSystemInfo(sysInfo);
      setTelemetryData(telemetry);
      setRawLogs(Array.isArray(logs) ? logs : []);
      setHybridMetrics(metrics);
      setPluginList(Array.isArray(plugins) ? plugins : []);
      setGuardianStatus(guardian);

      // Memory info (si disponible)
      if (window.performance?.memory) {
        setMemoryInfo({
          usedJSHeapSize: Math.round(window.performance.memory.usedJSHeapSize / 1024 / 1024),
          totalJSHeapSize: Math.round(window.performance.memory.totalJSHeapSize / 1024 / 1024),
          jsHeapSizeLimit: Math.round(window.performance.memory.jsHeapSizeLimit / 1024 / 1024),
        });
      }
    } catch (err) {
      console.warn('ExpertPanel refresh error:', err);
    }
  }, [deviceId]);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(refresh, 3000);
      setRefreshInterval(interval);
      return () => clearInterval(interval);
    } else if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }
  }, [autoRefresh, refresh]);

  const sections = [
    { id: 'overview', icon: '🖥️', label: 'Sistema' },
    { id: 'telemetry', icon: '📊', label: 'Telemetría' },
    { id: 'logs', icon: '📜', label: 'Logs' },
    { id: 'hybrid', icon: '🧠', label: 'IA Híbrida' },
    { id: 'plugins', icon: '🔌', label: 'Plugins' },
    { id: 'performance', icon: '⚡', label: 'Rendimiento' },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="glass p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔬</span>
            <h2 className="text-lg font-bold text-dark-100">Modo Experto</h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent-purple/10 text-accent-purple border border-accent-purple/20">
              TÉCNICO
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setAutoRefresh(!autoRefresh)}
              className={`text-xs px-2 py-1 rounded-lg transition-all ${
                autoRefresh ? 'bg-accent-green/20 text-accent-green' : 'bg-dark-700 text-dark-400'
              }`}>
              {autoRefresh ? '⏸ Pausar' : '▶ Auto-refresh'}
            </button>
            <button onClick={refresh}
              className="text-xs px-2 py-1 bg-dark-700 hover:bg-dark-600 rounded-lg text-dark-300">
              🔄
            </button>
          </div>
        </div>

        {/* Section tabs */}
        <div className="flex gap-1 overflow-x-auto">
          {sections.map(s => (
            <button key={s.id} onClick={() => setActiveSection(s.id)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                activeSection === s.id
                  ? 'bg-dark-700/80 text-dark-100'
                  : 'text-dark-500 hover:text-dark-300 hover:bg-dark-800/50'
              }`}>
              <span>{s.icon}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {activeSection === 'overview' && <SystemOverview systemInfo={systemInfo} guardianStatus={guardianStatus} memoryInfo={memoryInfo} />}
      {activeSection === 'telemetry' && <TelemetryView data={telemetryData} />}
      {activeSection === 'logs' && <LogsView logs={rawLogs} />}
      {activeSection === 'hybrid' && <HybridAIView metrics={hybridMetrics} config={systemInfo?.modules?.hybridAI} />}
      {activeSection === 'plugins' && <PluginsView plugins={pluginList} />}
      {activeSection === 'performance' && <PerformanceView memoryInfo={memoryInfo} systemInfo={systemInfo} telemetryData={telemetryData} />}
    </div>
  );
}

// ════════════════════════════════════════════════════
//  Sub-componentes
// ════════════════════════════════════════════════════

function SystemOverview({ systemInfo, guardianStatus, memoryInfo }) {
  if (!systemInfo) return <LoadingState />;

  return (
    <div className="space-y-3">
      <div className="glass p-4">
        <h3 className="text-xs font-semibold text-dark-300 mb-3 uppercase tracking-wider">Estado del Sistema</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <InfoCard label="Versión" value={systemInfo.version} />
          <InfoCard label="Uptime" value={systemInfo.uptimeHuman} />
          <InfoCard label="Módulos" value={Object.keys(systemInfo.modules || {}).length} />
          <InfoCard label="Timestamp" value={new Date(systemInfo.timestamp).toLocaleTimeString('es')} />
        </div>
      </div>

      <div className="glass p-4">
        <h3 className="text-xs font-semibold text-dark-300 mb-3 uppercase tracking-wider">Módulos Activos</h3>
        <div className="space-y-2">
          <ModuleStatus name="Guardian" active={guardianStatus?.active} detail={guardianStatus?.active ? `${guardianStatus.checks || 0} checks` : 'Inactivo'} />
          <ModuleStatus name="Auto Mode" active={systemInfo.modules?.autoMode?.active} />
          <ModuleStatus name="IA Híbrida" active={systemInfo.modules?.hybridAI?.enabled} detail={systemInfo.modules?.hybridAI?.hasApiKey ? 'API Key configurada' : 'Sin API Key'} />
          <ModuleStatus name="Telemetría" active={true} detail={`${systemInfo.modules?.telemetry?.totalEvents || 0} eventos`} />
          <ModuleStatus name="Plugins" active={true} detail={`${systemInfo.modules?.plugins || 0} cargados`} />
        </div>
      </div>

      {memoryInfo && (
        <div className="glass p-4">
          <h3 className="text-xs font-semibold text-dark-300 mb-3 uppercase tracking-wider">Memoria del Renderer</h3>
          <div className="grid grid-cols-3 gap-2">
            <InfoCard label="Usado" value={`${memoryInfo.usedJSHeapSize} MB`} />
            <InfoCard label="Total" value={`${memoryInfo.totalJSHeapSize} MB`} />
            <InfoCard label="Límite" value={`${memoryInfo.jsHeapSizeLimit} MB`} />
          </div>
          <div className="mt-2 h-2 bg-dark-800 rounded-full overflow-hidden">
            <div className="h-full bg-accent-blue rounded-full transition-all"
              style={{ width: `${(memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}

function TelemetryView({ data }) {
  if (!data) return <LoadingState />;

  const { events, stats } = data;

  return (
    <div className="space-y-3">
      <div className="glass p-4">
        <h3 className="text-xs font-semibold text-dark-300 mb-3 uppercase tracking-wider">Estadísticas</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <InfoCard label="Total Eventos" value={stats?.totalEvents || 0} />
          <InfoCard label="Errores" value={stats?.errors?.total || 0} color="text-accent-red" />
          <InfoCard label="Predicciones" value={stats?.predictions?.total || 0} />
          <InfoCard label="Acciones Auto" value={stats?.autoActions?.total || 0} />
        </div>
      </div>

      {stats?.timings && (
        <div className="glass p-4">
          <h3 className="text-xs font-semibold text-dark-300 mb-3 uppercase tracking-wider">Tiempos de Ejecución</h3>
          <div className="grid grid-cols-3 gap-2">
            <InfoCard label="Total" value={stats.timings.total} />
            <InfoCard label="Promedio" value={`${stats.timings.avgMs}ms`} />
            <InfoCard label="Máximo" value={`${stats.timings.maxMs}ms`} />
          </div>
        </div>
      )}

      <div className="glass p-4">
        <h3 className="text-xs font-semibold text-dark-300 mb-3 uppercase tracking-wider">Eventos por Tipo</h3>
        <div className="space-y-1">
          {Object.entries(stats?.byType || {}).map(([type, count]) => (
            <div key={type} className="flex items-center justify-between text-xs">
              <span className="text-dark-300 font-mono">{type}</span>
              <span className="text-dark-500">{count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="glass p-4">
        <h3 className="text-xs font-semibold text-dark-300 mb-3 uppercase tracking-wider">Últimos Eventos ({events?.length || 0})</h3>
        <div className="space-y-1 max-h-60 overflow-y-auto">
          {(events || []).slice(-20).reverse().map((e, i) => (
            <div key={i} className="flex items-start gap-2 text-[11px] py-1 border-b border-dark-800/50">
              <span className="text-dark-600 font-mono whitespace-nowrap">
                {new Date(e.timestamp).toLocaleTimeString('es')}
              </span>
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
                e.type === 'error' ? 'bg-accent-red/10 text-accent-red' :
                e.type === 'prediction' ? 'bg-accent-purple/10 text-accent-purple' :
                e.type === 'timing' ? 'bg-accent-blue/10 text-accent-blue' :
                'bg-dark-700 text-dark-400'
              }`}>{e.type}</span>
              <span className="text-dark-400 truncate">
                {e.category ? `${e.category}.${e.action || ''}` : e.message || JSON.stringify(e.data || {}).slice(0, 50)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LogsView({ logs }) {
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? logs : logs.filter(l => l.type === filter);

  return (
    <div className="glass p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-dark-300 uppercase tracking-wider">Logs Crudos ({filtered.length})</h3>
        <select value={filter} onChange={e => setFilter(e.target.value)}
          className="text-xs bg-dark-800 border border-dark-600 rounded px-2 py-1 text-dark-300">
          <option value="all">Todos</option>
          <option value="snapshot">Snapshots</option>
          <option value="optimization">Optimizaciones</option>
          <option value="guardian_check">Guardian</option>
          <option value="auto_mode_prediction">Auto Mode</option>
        </select>
      </div>
      <div className="space-y-1 max-h-96 overflow-y-auto font-mono text-[10px]">
        {filtered.slice(-30).reverse().map((log, i) => (
          <div key={i} className="flex items-start gap-2 py-1 border-b border-dark-800/30">
            <span className="text-dark-600 whitespace-nowrap">
              {new Date(log.timestamp).toLocaleTimeString('es')}
            </span>
            <span className={`px-1 rounded ${
              log.type === 'snapshot' ? 'bg-accent-blue/10 text-accent-blue' :
              log.type === 'optimization' ? 'bg-accent-green/10 text-accent-green' :
              log.type === 'guardian_check' ? 'bg-accent-orange/10 text-accent-orange' :
              'bg-dark-700 text-dark-500'
            }`}>{log.type?.slice(0, 12)}</span>
            <span className="text-dark-400 break-all">{JSON.stringify(log).slice(0, 120)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HybridAIView({ metrics, config }) {
  return (
    <div className="space-y-3">
      <div className="glass p-4">
        <h3 className="text-xs font-semibold text-dark-300 mb-3 uppercase tracking-wider">Configuración IA Híbrida</h3>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-dark-400">Estado</span>
            <span className={config?.enabled ? 'text-accent-green' : 'text-dark-500'}>
              {config?.enabled ? '✅ Habilitado' : '❌ Deshabilitado'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-dark-400">Endpoint</span>
            <span className="text-dark-300 font-mono truncate ml-2">{config?.endpoint || 'No configurado'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-dark-400">API Key</span>
            <span className={config?.hasApiKey ? 'text-accent-green' : 'text-dark-500'}>
              {config?.hasApiKey ? '✅ Configurada' : '❌ No configurada'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-dark-400">Timeout</span>
            <span className="text-dark-300">{config?.timeout || 10000}ms</span>
          </div>
          <div className="flex justify-between">
            <span className="text-dark-400">Umbral Confianza</span>
            <span className="text-dark-300">{config?.confidenceThreshold || 0.65}</span>
          </div>
        </div>
      </div>

      {metrics && (
        <div className="glass p-4">
          <h3 className="text-xs font-semibold text-dark-300 mb-3 uppercase tracking-wider">Métricas de Uso</h3>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
            <InfoCard label="Llamadas Locales" value={metrics.localCalls} />
            <InfoCard label="Llamadas Remotas" value={metrics.remoteCalls} />
            <InfoCard label="Fallos Remotos" value={metrics.remoteFailures} color="text-accent-red" />
            <InfoCard label="Cache Hits" value={metrics.cacheHits} />
            <InfoCard label="Fusiones" value={metrics.merges} />
            <InfoCard label="Éxito Remoto" value={`${metrics.remoteSuccessRate}%`} />
          </div>
        </div>
      )}
    </div>
  );
}

function PluginsView({ plugins }) {
  if (!plugins || plugins.length === 0) {
    return (
      <div className="glass p-6 text-center">
        <p className="text-dark-400 text-sm">No hay plugins cargados</p>
        <p className="text-dark-600 text-xs mt-1">Coloca plugins en /extensions/plugins/</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {plugins.map(plugin => (
        <div key={plugin.id} className="glass p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-dark-100">{plugin.name}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-dark-700 text-dark-400">v{plugin.version}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                  plugin.enabled ? 'bg-accent-green/10 text-accent-green' : 'bg-dark-700 text-dark-500'
                }`}>{plugin.enabled ? 'Activo' : 'Inactivo'}</span>
              </div>
              <p className="text-xs text-dark-500 mt-0.5">{plugin.description}</p>
            </div>
            <span className="text-[10px] text-dark-600">{plugin.type}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div><span className="text-dark-500">Autor:</span> <span className="text-dark-300">{plugin.author}</span></div>
            <div><span className="text-dark-500">Ejecuciones:</span> <span className="text-dark-300">{plugin.executionCount}</span></div>
            <div><span className="text-dark-500">Permisos:</span> <span className="text-dark-300">{plugin.permissions?.join(', ') || 'ninguno'}</span></div>
          </div>
          {plugin.lastError && (
            <div className="mt-2 text-xs bg-accent-red/5 border border-accent-red/20 rounded px-2 py-1 text-accent-red">
              Último error: {plugin.lastError.message}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function PerformanceView({ memoryInfo, systemInfo, telemetryData }) {
  const timings = telemetryData?.stats?.timings;

  return (
    <div className="space-y-3">
      <div className="glass p-4">
        <h3 className="text-xs font-semibold text-dark-300 mb-3 uppercase tracking-wider">Rendimiento del Renderer</h3>
        {memoryInfo ? (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <InfoCard label="Heap Usado" value={`${memoryInfo.usedJSHeapSize} MB`} />
              <InfoCard label="Heap Total" value={`${memoryInfo.totalJSHeapSize} MB`} />
              <InfoCard label="Límite" value={`${memoryInfo.jsHeapSizeLimit} MB`} />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-dark-400">Uso de memoria</span>
                <span className="text-dark-300">{Math.round((memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100)}%</span>
              </div>
              <div className="h-3 bg-dark-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-accent-blue to-accent-purple rounded-full transition-all"
                  style={{ width: `${(memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100}%` }} />
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-dark-500">Memory API no disponible en este contexto</p>
        )}
      </div>

      {timings && (
        <div className="glass p-4">
          <h3 className="text-xs font-semibold text-dark-300 mb-3 uppercase tracking-wider">Latencias de Operaciones</h3>
          <div className="grid grid-cols-3 gap-2">
            <InfoCard label="Operaciones" value={timings.total} />
            <InfoCard label="Latencia Prom" value={`${timings.avgMs}ms`} color={timings.avgMs > 1000 ? 'text-accent-orange' : 'text-accent-green'} />
            <InfoCard label="Latencia Máx" value={`${timings.maxMs}ms`} color={timings.maxMs > 5000 ? 'text-accent-red' : 'text-dark-200'} />
          </div>
        </div>
      )}

      <div className="glass p-4">
        <h3 className="text-xs font-semibold text-dark-300 mb-3 uppercase tracking-wider">Uptime del Sistema</h3>
        <div className="grid grid-cols-2 gap-2">
          <InfoCard label="API Version" value={systemInfo?.version || '—'} />
          <InfoCard label="Uptime" value={systemInfo?.uptimeHuman || '—'} />
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════
//  Componentes reutilizables
// ════════════════════════════════════════════════════

function InfoCard({ label, value, color = 'text-dark-100' }) {
  return (
    <div className="bg-dark-900/50 rounded-lg p-2 text-center">
      <div className={`text-sm font-bold ${color}`}>{value}</div>
      <div className="text-[10px] text-dark-500">{label}</div>
    </div>
  );
}

function ModuleStatus({ name, active, detail }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${active ? 'bg-accent-green' : 'bg-dark-600'}`} />
        <span className="text-dark-300">{name}</span>
      </div>
      <span className="text-dark-500">{detail || (active ? 'Activo' : 'Inactivo')}</span>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="glass p-8 text-center">
      <div className="animate-spin text-2xl mb-2">⏳</div>
      <p className="text-dark-400 text-sm">Cargando datos...</p>
    </div>
  );
}
