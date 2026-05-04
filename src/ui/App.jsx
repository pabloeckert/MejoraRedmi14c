import React, { useState, useCallback, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import OptimizationPanel from './components/OptimizationPanel';
import RealTimeDashboard from './components/RealTimeDashboard';
import TrendsPanel from './components/TrendsPanel';
import DeviceOverview from './components/DeviceOverview';
import SmartInsights from './components/SmartInsights';
import SettingsPanel from './components/SettingsPanel';
import AdvancedDiagnostics from './components/AdvancedDiagnostics';
import BenchmarkPanel from './components/BenchmarkPanel';
import ExtensionsPanel from './components/ExtensionsPanel';
import PredictionDashboard from './components/PredictionDashboard';
import ExpertPanel from './components/ExpertPanel';

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
  PREDICTIONS: 'predictions',
  DIAGNOSTICS: 'diagnostics',
  BENCHMARK: 'benchmark',
  EXTENSIONS: 'extensions',
  EXPERT: 'expert',
  SETTINGS: 'settings',
  HELP: 'help',
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
  const [failurePredictions, setFailurePredictions] = useState(null);
  const [proactiveResults, setProactiveResults] = useState(null);
  const [activeTab, setActiveTab] = useState(TABS.OVERVIEW);
  const [aestheticMode, setAestheticMode] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [abortController, setAbortController] = useState(null);

  const loadDeviceData = useCallback(async (deviceId) => {
    try {
      const [profileData, insightsData, logsData, anomalies, failures, proactive] = await Promise.all([
        window.optimizer.getDeviceProfile({ deviceId }),
        window.optimizer.getSmartInsights({ deviceId }),
        window.optimizer.getDeviceLogs({ deviceId }),
        window.optimizer.detectAnomalies({ deviceId }),
        window.optimizer.predictFailures?.({ deviceId }) || Promise.resolve({ error: true }),
        window.optimizer.analyzeProactive?.({ deviceId }) || Promise.resolve({ error: true }),
      ]);
      if (!profileData.error) setProfile(profileData);
      if (!insightsData.error) setInsights(insightsData);
      if (!logsData.error) setLogs(logsData);
      if (!anomalies.error) setAnomalyResults(anomalies);
      if (!failures.error) setFailurePredictions(failures);
      if (!proactive.error) setProactiveResults(proactive);
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
    const controller = { cancelled: false };
    setAbortController(controller);
    try {
      const res = await window.optimizer.runOptimization({
        deviceId: device.deviceId,
        firstConnection: device.firstConnection,
      });
      if (controller.cancelled) return;
      if (res.error) throw new Error(res.error);
      setResult(res);
      setState(STATES.DONE);
      await loadDeviceData(device.deviceId);
    } catch (err) {
      if (!controller.cancelled) {
        setError(err.message);
        setState(STATES.ERROR);
      }
    }
  }, [device, loadDeviceData]);

  const handleCancel = useCallback(() => {
    if (abortController) {
      abortController.cancelled = true;
    }
    setState(STATES.DETECTED);
    setAbortController(null);
  }, [abortController]);

  const handleKillAll = useCallback(async () => {
    if (!device) return;
    try {
      await window.optimizer.runTurbo?.({ deviceId: device.deviceId });
      await loadDeviceData(device.deviceId);
    } catch {}
  }, [device, loadDeviceData]);

  const handleReset = useCallback(() => {
    setState(STATES.IDLE);
    setDevice(null);
    setResult(null);
    setError(null);
    setLogs([]);
    setProfile(null);
    setInsights(null);
    setAbortController(null);
    setActiveTab(TABS.OVERVIEW);
  }, []);

  // Close menu on click outside
  useEffect(() => {
    const handleClick = () => { if (menuOpen) setMenuOpen(false); };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [menuOpen]);

  // Listen for native menu navigation
  useEffect(() => {
    window.optimizer.onNavigate?.((action) => {
      switch (action) {
        case 'detect': handleDetect(); break;
        case 'optimize': handleOptimize(); break;
        case 'killall': handleKillAll(); break;
        case 'disconnect': handleReset(); break;
        case 'overview': setActiveTab(TABS.OVERVIEW); break;
        case 'realtime': setActiveTab(TABS.REALTIME); break;
        case 'trends': setActiveTab(TABS.TRENDS); break;
        case 'insights': setActiveTab(TABS.INSIGHTS); break;
        case 'predictions': setActiveTab(TABS.PREDICTIONS); break;
        case 'diagnostics': setActiveTab(TABS.DIAGNOSTICS); break;
        case 'benchmark': setActiveTab(TABS.BENCHMARK); break;
        case 'expert': setActiveTab(TABS.EXPERT); break;
        case 'settings': setActiveTab(TABS.SETTINGS); break;
        case 'help': setActiveTab(TABS.HELP); break;
        case 'turbo': if (device) window.optimizer.runTurbo?.({ deviceId: device.deviceId }); break;
        case 'backup': if (device) window.optimizer.createBackup?.({ deviceId: device.deviceId }); break;
        case 'export-json': if (device) window.optimizer.exportReport?.({ deviceId: device.deviceId, format: 'json' }); break;
        case 'export-html': if (device) window.optimizer.exportReport?.({ deviceId: device.deviceId, format: 'html' }); break;
        case 'export-pdf': if (device) window.optimizer.exportPDF?.({ deviceId: device.deviceId }); break;
        case 'export-bundle': if (device) window.optimizer.advancedExport?.({ deviceId: device.deviceId, format: 'bundle' }); break;
      }
    });
  }, [device, handleDetect, handleOptimize, handleKillAll, handleReset]);

  return (
    <div className="min-h-screen p-6 flex flex-col gap-6">
      {/* Header */}
      <header className="flex items-center justify-between px-2">
        <div className="flex items-center gap-4">
          {/* Menu hamburger */}
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-dark-800 border border-dark-600 hover:bg-dark-700 transition-all"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            {/* Dropdown menu */}
            {menuOpen && (
              <div className="absolute left-0 top-11 w-56 bg-white rounded-xl shadow-lg border border-dark-600 z-50 py-2"
                onClick={e => e.stopPropagation()}>
                <div className="px-4 py-2 border-b border-dark-700">
                  <p className="text-xs font-semibold text-dark-200 uppercase tracking-wider">Navegación</p>
                </div>
                <MenuButton icon="📋" label="Resumen" active={activeTab === TABS.OVERVIEW} onClick={() => { setActiveTab(TABS.OVERVIEW); setMenuOpen(false); }} />
                <MenuButton icon="📊" label="Tiempo Real" active={activeTab === TABS.REALTIME} onClick={() => { setActiveTab(TABS.REALTIME); setMenuOpen(false); }} />
                <MenuButton icon="📈" label="Tendencias" active={activeTab === TABS.TRENDS} onClick={() => { setActiveTab(TABS.TRENDS); setMenuOpen(false); }} />
                <MenuButton icon="🧠" label="Insights" active={activeTab === TABS.INSIGHTS} onClick={() => { setActiveTab(TABS.INSIGHTS); setMenuOpen(false); }} />
                <MenuButton icon="🔮" label="Predicciones" active={activeTab === TABS.PREDICTIONS} onClick={() => { setActiveTab(TABS.PREDICTIONS); setMenuOpen(false); }} />
                <MenuButton icon="🔬" label="Diagnóstico" active={activeTab === TABS.DIAGNOSTICS} onClick={() => { setActiveTab(TABS.DIAGNOSTICS); setMenuOpen(false); }} />
                <MenuButton icon="🏋️" label="Benchmark" active={activeTab === TABS.BENCHMARK} onClick={() => { setActiveTab(TABS.BENCHMARK); setMenuOpen(false); }} />
                <MenuButton icon="🧩" label="Extensiones" active={activeTab === TABS.EXTENSIONS} onClick={() => { setActiveTab(TABS.EXTENSIONS); setMenuOpen(false); }} />
                <MenuButton icon="🔬" label="Experto" active={activeTab === TABS.EXPERT} onClick={() => { setActiveTab(TABS.EXPERT); setMenuOpen(false); }} />
                <MenuButton icon="⚙️" label="Configuración" active={activeTab === TABS.SETTINGS} onClick={() => { setActiveTab(TABS.SETTINGS); setMenuOpen(false); }} />
                <div className="border-t border-dark-700 mt-1 pt-1">
                  <MenuButton icon="❓" label="Guía de Uso" active={activeTab === TABS.HELP} onClick={() => { setActiveTab(TABS.HELP); setMenuOpen(false); }} />
                </div>
                {device && (
                  <div className="border-t border-dark-700 mt-1 pt-1">
                    <MenuButton icon="🔌" label="Desconectar" onClick={() => { handleReset(); setMenuOpen(false); }} danger />
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <h1 className="text-2xl font-bold text-accent-blue">
              Phone Optimizer
            </h1>
            <p className="text-dark-300 text-sm mt-1">
              Optimizador Inteligente — Pablo & Sindy
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Kill All button */}
          {device && (state === STATES.DETECTED || state === STATES.DONE) && (
            <button
              onClick={handleKillAll}
              className="text-xs px-3 py-1.5 rounded-lg bg-accent-red/10 text-accent-red border border-accent-red/20 hover:bg-accent-red/20 transition-all"
              title="Forzar cierre de todas las apps pesadas"
            >
              ☠️ Kill All
            </button>
          )}

          <button
            onClick={() => setAestheticMode(!aestheticMode)}
            className={`text-xs px-3 py-1.5 rounded-lg transition-all ${
              aestheticMode
                ? 'bg-accent-blue/10 text-accent-blue border border-accent-blue/20'
                : 'bg-dark-800 text-dark-300 hover:text-dark-100 border border-dark-600'
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
                <button onClick={() => setActiveTab(TABS.HELP)}
                  className="w-full mt-3 py-2 text-dark-400 hover:text-accent-blue text-sm transition-colors">
                  ❓ ¿Necesitás ayuda?
                </button>
              </div>
            )}

            {state === STATES.DETECTING && (
              <div className="text-center py-8">
                <div className="animate-spin text-4xl mb-4">⚡</div>
                <p className="text-dark-300">Buscando dispositivo...</p>
                <button onClick={handleCancel}
                  className="mt-4 py-2 px-4 bg-dark-800 hover:bg-dark-700 text-dark-300 rounded-lg transition-all text-sm border border-dark-600">
                  ✕ Cancelar
                </button>
              </div>
            )}

            {state === STATES.ERROR && (
              <div className="text-center">
                <div className="text-4xl mb-4">❌</div>
                <h2 className="text-lg font-semibold text-accent-red mb-2">Error</h2>
                <p className="text-dark-400 text-sm mb-4 whitespace-pre-line">{error}</p>
                <div className="flex gap-2 justify-center">
                  <button onClick={handleDetect}
                    className="py-2 px-4 bg-accent-blue hover:bg-accent-blue/80 text-white rounded-lg transition-all text-sm">
                    Reintentar
                  </button>
                  <button onClick={() => setActiveTab(TABS.HELP)}
                    className="py-2 px-4 bg-dark-800 hover:bg-dark-700 text-dark-300 rounded-lg transition-all text-sm border border-dark-600">
                    ❓ Ayuda
                  </button>
                </div>
              </div>
            )}

            {(state === STATES.DETECTED || state === STATES.OPTIMIZING || state === STATES.DONE) && device && (
              <DeviceOverview device={device} profile={profile} />
            )}
          </div>

          {(state === STATES.DETECTED || state === STATES.DONE) && (
            <div className="glass p-6">
              <button onClick={handleOptimize} disabled={state === STATES.OPTIMIZING}
                className="optimize-btn w-full py-4 px-6 bg-gradient-to-r from-accent-blue to-blue-400
                  hover:from-accent-blue/80 hover:to-blue-400/80
                  text-white font-semibold rounded-xl transition-all duration-200
                  hover:shadow-lg hover:shadow-accent-blue/30
                  disabled:opacity-50 disabled:cursor-not-allowed">
                {state === STATES.DONE ? '🔄 Optimizar de nuevo' : '⚡ Optimizar ahora'}
              </button>
              <button onClick={handleReset}
                className="w-full mt-3 py-2 text-dark-400 hover:text-dark-200 text-sm transition-colors">
                Desconectar
              </button>
            </div>
          )}

          {state === STATES.OPTIMIZING && (
            <div className="glass p-6">
              <div className="text-center">
                <div className="animate-pulse text-2xl mb-2">⚡</div>
                <p className="text-dark-300 text-sm mb-4">Optimización en curso...</p>
                <button onClick={handleCancel}
                  className="w-full py-3 px-6 bg-accent-red/10 hover:bg-accent-red/20
                    text-accent-red font-medium rounded-xl transition-all duration-200
                    border border-accent-red/20">
                  ✕ Cancelar optimización
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Panel derecho */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {device && activeTab !== TABS.HELP && (
            <div className="glass px-2 py-1.5 flex items-center gap-1 overflow-x-auto">
              <TabButton active={activeTab === TABS.OVERVIEW} onClick={() => setActiveTab(TABS.OVERVIEW)} icon="📋" label="Resumen" />
              <TabButton active={activeTab === TABS.REALTIME} onClick={() => setActiveTab(TABS.REALTIME)} icon="📊" label="Tiempo Real" />
              <TabButton active={activeTab === TABS.TRENDS} onClick={() => setActiveTab(TABS.TRENDS)} icon="📈" label="Tendencias" />
              <TabButton active={activeTab === TABS.INSIGHTS} onClick={() => setActiveTab(TABS.INSIGHTS)} icon="🧠" label="Insights" />
              <TabButton active={activeTab === TABS.PREDICTIONS} onClick={() => setActiveTab(TABS.PREDICTIONS)} icon="🔮" label="Predicciones" />
              <TabButton active={activeTab === TABS.DIAGNOSTICS} onClick={() => setActiveTab(TABS.DIAGNOSTICS)} icon="🔬" label="Diagnóstico" />
              <TabButton active={activeTab === TABS.BENCHMARK} onClick={() => setActiveTab(TABS.BENCHMARK)} icon="🏋️" label="Benchmark" />
              <TabButton active={activeTab === TABS.EXTENSIONS} onClick={() => setActiveTab(TABS.EXTENSIONS)} icon="🧩" label="Extensiones" />
              <TabButton active={activeTab === TABS.EXPERT} onClick={() => setActiveTab(TABS.EXPERT)} icon="🔬" label="Experto" />
              <TabButton active={activeTab === TABS.SETTINGS} onClick={() => setActiveTab(TABS.SETTINGS)} icon="⚙️" label="Config" />
            </div>
          )}

          <div className="tab-content">
            {activeTab === TABS.OVERVIEW && <Dashboard state={state} device={device} result={result} logs={logs} onOptimize={handleOptimize} />}
            {activeTab === TABS.REALTIME && <RealTimeDashboard deviceId={device?.deviceId} />}
            {activeTab === TABS.TRENDS && <TrendsPanel logs={logs} deviceId={device?.deviceId} />}
            {activeTab === TABS.INSIGHTS && <SmartInsights profile={profile} predictions={insights?.predictions} anomalyResults={anomalyResults} failurePredictions={failurePredictions} proactiveResults={proactiveResults} />}
            {activeTab === TABS.PREDICTIONS && <PredictionDashboard deviceId={device?.deviceId} failurePredictions={failurePredictions} proactiveResults={proactiveResults} />}
            {activeTab === TABS.DIAGNOSTICS && <AdvancedDiagnostics deviceId={device?.deviceId} />}
            {activeTab === TABS.BENCHMARK && <BenchmarkPanel deviceId={device?.deviceId} />}
            {activeTab === TABS.EXTENSIONS && <ExtensionsPanel />}
            {activeTab === TABS.EXPERT && <ExpertPanel deviceId={device?.deviceId} />}
            {activeTab === TABS.SETTINGS && <SettingsPanel deviceId={device?.deviceId} />}
            {activeTab === TABS.HELP && <HelpPanel onBack={() => setActiveTab(device ? TABS.OVERVIEW : null)} />}
          </div>

          {result && activeTab !== TABS.HELP && <OptimizationPanel result={result} />}
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

function MenuButton({ icon, label, onClick, active, danger }) {
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all ${
        danger
          ? 'text-accent-red hover:bg-accent-red/10'
          : active
            ? 'bg-accent-blue/10 text-accent-blue font-medium'
            : 'text-dark-200 hover:bg-dark-800'
      }`}>
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function HelpPanel({ onBack }) {
  return (
    <div className="glass p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-dark-100 flex items-center gap-2">
          ❓ Guía de Uso
        </h2>
        <button onClick={onBack}
          className="text-xs px-3 py-1.5 bg-dark-800 hover:bg-dark-700 rounded-lg text-dark-300 border border-dark-600">
          ← Volver
        </button>
      </div>

      {/* Inicio rápido */}
      <Section icon="🚀" title="Inicio Rápido">
        <div className="space-y-3 text-sm text-dark-300">
          <Step n={1} text="Activá la Depuración USB en tu teléfono: Ajustes → Sobre del teléfono → tocá 'Número de compilación' 7 veces" />
          <Step n={2} text="Andá a Ajustes → Opciones de desarrollador → activá 'Depuración USB'" />
          <Step n={3} text="Conectá el teléfono por USB (usá un cable que transmita datos, no solo carga)" />
          <Step n={4} text="Aceptá la autorización que aparece en el teléfono" />
          <Step n={5} text="Presioná 'Detectar dispositivo' en la app" />
        </div>
      </Section>

      {/* Modos de optimización */}
      <Section icon="⚡" title="Modos de Optimización">
        <div className="space-y-3">
          <InfoBlock
            title="🔥 Optimización Máxima (Primera conexión)"
            text="Se ejecuta automáticamente la primera vez que conectás un dispositivo. Elimina bloatware, desactiva servicios MIUI, aplica ajustes de rendimiento extremo y optimiza batería. Es la limpieza más profunda."
          />
          <InfoBlock
            title="🧠 Optimización Inteligente (Siguientes conexiones)"
            text="Aprende de tu uso y optimiza de forma personalizada. Detecta bloatware que reapareció, analiza tendencias de batería y temperatura, y aplica ajustes basados en tus patrones."
          />
          <InfoBlock
            title="🚀 Modo Turbo"
            text="Optimización extrema en 8 fases: limpieza profunda, eliminación de bloatware, boost de rendimiento, control de procesos, optimización de batería, reducción de servicios, red y finalización. Desactiva animaciones y limita servicios en background."
          />
          <InfoBlock
            title="🛡️ Modo Guardian"
            text="Protección continua: monitorea el dispositivo cada 30 segundos. Si detecta temperatura alta, batería baja, demasiados procesos o anomalías, optimiza automáticamente y puede escalar a Modo Turbo."
          />
        </div>
      </Section>

      {/* Paneles */}
      <Section icon="📊" title="Paneles Disponibles">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <PanelCard icon="📋" title="Resumen" text="Estado del dispositivo, resultados de optimización e historial" />
          <PanelCard icon="📊" title="Tiempo Real" text="CPU, RAM, temperatura y batería en vivo con gráficos" />
          <PanelCard icon="📈" title="Tendencias" text="Gráficos históricos de batería, temperatura, procesos y apps" />
          <PanelCard icon="🧠" title="Insights" text="Análisis inteligente: predicciones, anomalías y recomendaciones" />
          <PanelCard icon="🔮" title="Predicciones" text="Modelos ML que predicen fallos: batería, temperatura, almacenamiento" />
          <PanelCard icon="🔬" title="Diagnóstico" text="Análisis profundo: sensores, radio, servicios MIUI, procesos zombis" />
          <PanelCard icon="🏋️" title="Benchmark" text="Tests de rendimiento: CPU, RAM, IO, latencia, servicios, térmica" />
          <PanelCard icon="🧩" title="Extensiones" text="Sistema de plugins para agregar funcionalidad personalizada" />
          <PanelCard icon="🔬" title="Experto" text="Panel técnico: logs crudos, telemetría, IA híbrida, memoria del renderer" />
          <PanelCard icon="⚙️" title="Configuración" text="Modo automático, Guardian, WiFi ADB, backups, reportes, scheduler" />
        </div>
      </Section>

      {/* Botones de acción */}
      <Section icon="🎮" title="Botones de Acción">
        <div className="space-y-2 text-sm">
          <ActionRow icon="🔍" label="Detectar dispositivo" desc="Busca y conecta un teléfono Android por USB" />
          <ActionRow icon="⚡" label="Optimizar ahora" desc="Ejecuta la optimización apropiada (máxima o inteligente)" />
          <ActionRow icon="🚀" label="Activar Modo Turbo" desc="Optimización extrema en 8 fases" />
          <ActionRow icon="☠️" label="Kill All" desc="Fuerza el cierre de todas las apps pesadas (Facebook, Instagram, TikTok, etc.)" />
          <ActionRow icon="✕" label="Cancelar" desc="Cancela la operación actual (detección u optimización)" />
          <ActionRow icon="💾" label="Backup" desc="Crea un respaldo del estado actual del dispositivo" />
          <ActionRow icon="📶" label="WiFi" desc="Conecta el dispositivo por WiFi (sin cable USB)" />
        </div>
      </Section>

      {/* Reportes */}
      <Section icon="📄" title="Exportar Reportes">
        <div className="space-y-2 text-sm text-dark-300">
          <p>Podés exportar reportes técnicos completos en múltiples formatos:</p>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <FormatBadge format="JSON" desc="Datos estructurados" />
            <FormatBadge format="HTML" desc="Reporte visual" />
            <FormatBadge format="PDF" desc="Documento profesional" />
            <FormatBadge format="CSV" desc="Para hojas de cálculo" />
            <FormatBadge format="XML" desc="Integración externa" />
            <FormatBadge format="Bundle" desc="Todos los formatos" />
          </div>
        </div>
      </Section>

      {/* Solución de problemas */}
      <Section icon="🔧" title="Solución de Problemas">
        <div className="space-y-3 text-sm">
          <TroubleItem
            q="¿No detecta mi teléfono?"
            a="Verificá que: 1) La depuración USB esté activa, 2) El cable transmita datos (no solo carga), 3) Hayas aceptado la autorización en el teléfono, 4) ADB esté funcionando (la app lo incluye)"
          />
          <TroubleItem
            q="¿La optimización tarda mucho?"
            a="Es normal la primera vez. La optimización máxima puede tomar 2-5 minutos. Las siguientes serán más rápidas."
          />
          <TroubleItem
            q="¿Puedo revertir los cambios?"
            a="Sí, usá el botón 'Backup' antes de optimizar. Si algo sale mal, podés hacer 'Rollback' desde Configuración → Backups."
          />
          <TroubleItem
            q="¿Es seguro eliminar bloatware?"
            a="Sí, las apps eliminadas son preinstaladas no esenciales. Se eliminan solo para el usuario actual (pm uninstall --user 0), no del sistema. Se pueden restaurar con un factory reset."
          />
          <TroubleItem
            q="¿Qué hace el Modo Turbo exactamente?"
            a="Ejecuta 8 fases: limpieza de cache/archivos temporales, eliminación de bloatware, desactivación de animaciones, cierre de procesos pesados, optimización de batería, reducción de servicios MIUI, optimización de red y reinicio del dispositivo."
          />
        </div>
      </Section>

      {/* Acerca de */}
      <Section icon="ℹ️" title="Acerca de">
        <div className="text-sm text-dark-300 space-y-1">
          <p><strong className="text-dark-100">Phone Optimizer v1.4.0</strong></p>
          <p>Optimizador inteligente para Android — Pablo & Sindy</p>
          <p className="text-dark-400">MIT License</p>
          <p className="text-dark-400">ADB incluido — No necesitás instalar ADB por separado</p>
        </div>
      </Section>
    </div>
  );
}

function Section({ icon, title, children }) {
  return (
    <div className="border-b border-dark-700 pb-5 last:border-0">
      <h3 className="text-sm font-semibold text-dark-200 mb-3 flex items-center gap-2">
        <span>{icon}</span> {title}
      </h3>
      {children}
    </div>
  );
}

function Step({ n, text }) {
  return (
    <div className="flex gap-3">
      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent-blue/10 text-accent-blue text-xs font-bold flex items-center justify-center border border-accent-blue/20">{n}</span>
      <span>{text}</span>
    </div>
  );
}

function InfoBlock({ title, text }) {
  return (
    <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700/30">
      <h4 className="text-sm font-medium text-dark-100 mb-1">{title}</h4>
      <p className="text-xs text-dark-400">{text}</p>
    </div>
  );
}

function PanelCard({ icon, title, text }) {
  return (
    <div className="bg-dark-800/50 rounded-lg p-3 border border-dark-700/20">
      <div className="flex items-center gap-2 mb-1">
        <span>{icon}</span>
        <span className="text-sm font-medium text-dark-100">{title}</span>
      </div>
      <p className="text-xs text-dark-400">{text}</p>
    </div>
  );
}

function ActionRow({ icon, label, desc }) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="text-lg">{icon}</span>
      <div>
        <span className="text-sm font-medium text-dark-100">{label}</span>
        <span className="text-xs text-dark-400 ml-2">— {desc}</span>
      </div>
    </div>
  );
}

function FormatBadge({ format, desc }) {
  return (
    <div className="flex items-center gap-2 bg-dark-800/50 rounded-lg px-3 py-2 border border-dark-700/20">
      <span className="text-xs font-mono font-bold text-accent-blue">{format}</span>
      <span className="text-xs text-dark-400">{desc}</span>
    </div>
  );
}

function TroubleItem({ q, a }) {
  return (
    <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700/20">
      <h4 className="text-sm font-medium text-dark-100 mb-1">{q}</h4>
      <p className="text-xs text-dark-400">{a}</p>
    </div>
  );
}
