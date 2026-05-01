import React, { useState, useCallback, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import DeviceCard from './components/DeviceCard';
import OptimizationPanel from './components/OptimizationPanel';
import RealTimeDashboard from './components/RealTimeDashboard';
import TrendsPanel from './components/TrendsPanel';
import DeviceOverview from './components/DeviceOverview';
import SmartInsights from './components/SmartInsights';
import SettingsPanel from './components/SettingsPanel';
import AdvancedDiagnostics from './components/AdvancedDiagnostics';
import BenchmarkPanel from './components/BenchmarkPanel';
import ExtensionsPanel from './components/ExtensionsPanel';

const STATES = {
  IDLE: 'idle',
  DETECTING: 'detecting',
  DETECTED: 'detected',
  OPTIMIZING: 'optimizing',
  DONE: 'done',
  ERROR: 'error',
};

const TABS = {
  OVERVIEW: 'overview',
  REALTIME: 'realtime',
  TRENDS: 'trends',
  INSIGHTS: 'insights',
  DIAGNOSTICS: 'diagnostics',
  BENCHMARK: 'benchmark',
  EXTENSIONS: 'extensions',
  SETTINGS: 'settings',
};

export default function App() {
  const [state, setState] = useState(STATES.IDLE);
  const [device, setDevice] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);
  const [profile, setProfile] = useState(null);
  const [insights, setInsights] = useState(null);
  const [anomalyResults, setAnomalyResults] = useState(null);
  const [activeTab, setActiveTab] = useState(TABS.OVERVIEW);
  const [aestheticMode, setAestheticMode] = useState(false);

  const loadDeviceData = useCallback(async (deviceId) => {
    try {
      const [profileData, insightsData, logsData, anomalies] = await Promise.all([
        window.optimizer.getDeviceProfile({ deviceId }),
        window.optimizer.getSmartInsights({ deviceId }),
        window.optimizer.getDeviceLogs({ deviceId }),
        window.optimizer.detectAnomalies({ deviceId }),
      ]);
      if (!profileData.error) setProfile(profileData);
      if (!insightsData.error) setInsights(insightsData);
      if (!logsData.error) setLogs(logsData);
      if (!anomalies.error) setAnomalyResults(anomalies);
    } catch (err) {
      console.warn('Error loading device data:', err);
    }
  }, []);

  const handleDetect = useCallback(async () => {
    setState(STATES.DETECTING);
    setError(null);
    try {
      const dev = await window.optimizer.detectDevice();
      if (dev.error) throw new Error(dev.error);
      setDevice(dev);
      setState(STATES.DETECTED);
      setActiveTab(TABS.OVERVIEW);
      await loadDeviceData(dev.deviceId);
    } catch (err) {
      setError(err.message);
      setState(STATES.ERROR);
    }
  }, [loadDeviceData]);

  const handleOptimize = useCallback(async () => {
    if (!device) return;
    setState(STATES.OPTIMIZING);
    setError(null);
    try {
      const res = await window.optimizer.runOptimization({
        deviceId: device.deviceId,
        firstConnection: device.firstConnection,
      });
      if (res.error) throw new Error(res.error);
      setResult(res);
      setState(STATES.DONE);
      await loadDeviceData(device.deviceId);
    } catch (err) {
      setError(err.message);
      setState(STATES.ERROR);
    }
  }, [device, loadDeviceData]);

  const handleReset = useCallback(() => {
    setState(STATES.IDLE);
    setDevice(null);
    setResult(null);
    setError(null);
    setLogs([]);
    setProfile(null);
    setInsights(null);
    setActiveTab(TABS.OVERVIEW);
  }, []);

  return (
    <div className="min-h-screen p-6 flex flex-col gap-6">
      {/* Header */}
      <header className="flex items-center justify-between px-2">
        <div>
          <h1 className="text-2xl font-bold gradient-text">
            Phone Optimizer
          </h1>
          <p className="text-dark-400 text-sm mt-1">
            Optimizador Inteligente — Pablo & Sindy
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAestheticMode(!aestheticMode)}
            className={`text-xs px-3 py-1.5 rounded-lg transition-all ${
              aestheticMode
                ? 'bg-accent-purple/20 text-accent-purple border border-accent-purple/30'
                : 'bg-dark-700 text-dark-400 hover:text-dark-200'
            }`}
            title="Ultra Aesthetic Mode"
          >
            {aestheticMode ? '✨' : '☆'} Aesthetic
          </button>
          <div className={`status-dot ${device ? 'connected' : 'disconnected'}`} />
          <span className="text-sm text-dark-400">
            {device ? device.deviceInfo?.model || 'Conectado' : 'Sin dispositivo'}
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel izquierdo */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="glass p-6">
            {state === STATES.IDLE && (
              <div className="text-center">
                <div className="text-5xl mb-4">📱</div>
                <h2 className="text-lg font-semibold mb-2">Conectar teléfono</h2>
                <p className="text-dark-400 text-sm mb-6">
                  Conecta un teléfono Android por USB para comenzar
                </p>
                <button onClick={handleDetect}
                  className="w-full py-3 px-6 bg-accent-blue hover:bg-accent-blue/80
                    text-white font-medium rounded-xl transition-all duration-200
                    hover:shadow-lg hover:shadow-accent-blue/20">
                  🔍 Detectar dispositivo
                </button>
              </div>
            )}

            {state === STATES.DETECTING && (
              <div className="text-center py-8">
                <div className="animate-spin text-4xl mb-4">⚡</div>
                <p className="text-dark-300">Buscando dispositivo...</p>
              </div>
            )}

            {state === STATES.ERROR && (
              <div className="text-center">
                <div className="text-4xl mb-4">❌</div>
                <h2 className="text-lg font-semibold text-accent-red mb-2">Error</h2>
                <p className="text-dark-400 text-sm mb-4 whitespace-pre-line">{error}</p>
                <button onClick={handleDetect}
                  className="py-2 px-4 bg-dark-700 hover:bg-dark-600 text-white rounded-lg transition-all text-sm">
                  Reintentar
                </button>
              </div>
            )}

            {(state === STATES.DETECTED || state === STATES.OPTIMIZING || state === STATES.DONE) && device && (
              <DeviceOverview device={device} profile={profile} />
            )}
          </div>

          {(state === STATES.DETECTED || state === STATES.DONE) && (
            <div className="glass p-6">
              <button onClick={handleOptimize} disabled={state === STATES.OPTIMIZING}
                className="optimize-btn w-full py-4 px-6 bg-gradient-to-r from-accent-purple to-accent-pink
                  hover:from-accent-purple/80 hover:to-accent-pink/80
                  text-white font-semibold rounded-xl transition-all duration-200
                  hover:shadow-lg hover:shadow-accent-purple/30
                  disabled:opacity-50 disabled:cursor-not-allowed">
                {state === STATES.DONE ? '🔄 Optimizar de nuevo' : '⚡ Optimizar ahora'}
              </button>
              <button onClick={handleReset}
                className="w-full mt-3 py-2 text-dark-400 hover:text-dark-200 text-sm transition-colors">
                Desconectar
              </button>
            </div>
          )}
        </div>

        {/* Panel derecho */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {device && (
            <div className="glass px-2 py-1.5 flex items-center gap-1 overflow-x-auto">
              <TabButton active={activeTab === TABS.OVERVIEW} onClick={() => setActiveTab(TABS.OVERVIEW)} icon="📋" label="Resumen" />
              <TabButton active={activeTab === TABS.REALTIME} onClick={() => setActiveTab(TABS.REALTIME)} icon="📊" label="Tiempo Real" />
              <TabButton active={activeTab === TABS.TRENDS} onClick={() => setActiveTab(TABS.TRENDS)} icon="📈" label="Tendencias" />
              <TabButton active={activeTab === TABS.INSIGHTS} onClick={() => setActiveTab(TABS.INSIGHTS)} icon="🧠" label="Insights" />
              <TabButton active={activeTab === TABS.DIAGNOSTICS} onClick={() => setActiveTab(TABS.DIAGNOSTICS)} icon="🔬" label="Diagnóstico" />
              <TabButton active={activeTab === TABS.BENCHMARK} onClick={() => setActiveTab(TABS.BENCHMARK)} icon="🏋️" label="Benchmark" />
              <TabButton active={activeTab === TABS.EXTENSIONS} onClick={() => setActiveTab(TABS.EXTENSIONS)} icon="🧩" label="Extensiones" />
              <TabButton active={activeTab === TABS.SETTINGS} onClick={() => setActiveTab(TABS.SETTINGS)} icon="⚙️" label="Config" />
            </div>
          )}

          <div className="tab-content">
            {activeTab === TABS.OVERVIEW && <Dashboard state={state} device={device} result={result} logs={logs} onOptimize={handleOptimize} />}
            {activeTab === TABS.REALTIME && <RealTimeDashboard deviceId={device?.deviceId} />}
            {activeTab === TABS.TRENDS && <TrendsPanel logs={logs} deviceId={device?.deviceId} />}
            {activeTab === TABS.INSIGHTS && <SmartInsights profile={profile} predictions={insights?.predictions} anomalyResults={anomalyResults} />}
            {activeTab === TABS.DIAGNOSTICS && <AdvancedDiagnostics deviceId={device?.deviceId} />}
            {activeTab === TABS.BENCHMARK && <BenchmarkPanel deviceId={device?.deviceId} />}
            {activeTab === TABS.EXTENSIONS && <ExtensionsPanel />}
            {activeTab === TABS.SETTINGS && <SettingsPanel deviceId={device?.deviceId} />}
          </div>

          {result && <OptimizationPanel result={result} />}
        </div>
      </main>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
        active
          ? 'bg-dark-700/80 text-dark-100 shadow-sm'
          : 'text-dark-400 hover:text-dark-200 hover:bg-dark-800/50'
      }`}>
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}
