import React, { useState, useCallback } from 'react';
import Dashboard from './components/Dashboard';
import DeviceCard from './components/DeviceCard';
import OptimizationPanel from './components/OptimizationPanel';

const STATES = {
  IDLE: 'idle',
  DETECTING: 'detecting',
  DETECTED: 'detected',
  OPTIMIZING: 'optimizing',
  DONE: 'done',
  ERROR: 'error',
};

export default function App() {
  const [state, setState] = useState(STATES.IDLE);
  const [device, setDevice] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);

  const handleDetect = useCallback(async () => {
    setState(STATES.DETECTING);
    setError(null);
    try {
      const dev = await window.optimizer.detectDevice();
      if (dev.error) throw new Error(dev.error);
      setDevice(dev);
      setState(STATES.DETECTED);

      // Cargar logs existentes
      const existingLogs = await window.optimizer.getDeviceLogs({ deviceId: dev.deviceId });
      if (!existingLogs.error) setLogs(existingLogs);
    } catch (err) {
      setError(err.message);
      setState(STATES.ERROR);
    }
  }, []);

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

      // Recargar logs
      const updatedLogs = await window.optimizer.getDeviceLogs({ deviceId: device.deviceId });
      if (!updatedLogs.error) setLogs(updatedLogs);
    } catch (err) {
      setError(err.message);
      setState(STATES.ERROR);
    }
  }, [device]);

  const handleReset = useCallback(() => {
    setState(STATES.IDLE);
    setDevice(null);
    setResult(null);
    setError(null);
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
          <div className={`status-dot ${device ? 'connected' : 'disconnected'}`} />
          <span className="text-sm text-dark-400">
            {device ? device.deviceInfo?.model || 'Conectado' : 'Sin dispositivo'}
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel izquierdo: Conexión y info del dispositivo */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          {/* Botón de conexión */}
          <div className="glass p-6">
            {state === STATES.IDLE && (
              <div className="text-center">
                <div className="text-5xl mb-4">📱</div>
                <h2 className="text-lg font-semibold mb-2">Conectar teléfono</h2>
                <p className="text-dark-400 text-sm mb-6">
                  Conecta un teléfono Android por USB para comenzar
                </p>
                <button
                  onClick={handleDetect}
                  className="w-full py-3 px-6 bg-accent-blue hover:bg-accent-blue/80
                    text-white font-medium rounded-xl transition-all duration-200
                    hover:shadow-lg hover:shadow-accent-blue/20"
                >
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
                <button
                  onClick={handleDetect}
                  className="py-2 px-4 bg-dark-700 hover:bg-dark-600 text-white
                    rounded-lg transition-all text-sm"
                >
                  Reintentar
                </button>
              </div>
            )}

            {(state === STATES.DETECTED || state === STATES.OPTIMIZING || state === STATES.DONE) && device && (
              <DeviceCard device={device} result={result} />
            )}
          </div>

          {/* Botón de optimización */}
          {(state === STATES.DETECTED || state === STATES.DONE) && (
            <div className="glass p-6">
              <button
                onClick={handleOptimize}
                disabled={state === STATES.OPTIMIZING}
                className="w-full py-4 px-6 bg-gradient-to-r from-accent-purple to-accent-pink
                  hover:from-accent-purple/80 hover:to-accent-pink/80
                  text-white font-semibold rounded-xl transition-all duration-200
                  hover:shadow-lg hover:shadow-accent-purple/30
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {state === STATES.DONE ? '🔄 Optimizar de nuevo' : '⚡ Optimizar ahora'}
              </button>
              <button
                onClick={handleReset}
                className="w-full mt-3 py-2 text-dark-400 hover:text-dark-200
                  text-sm transition-colors"
              >
                Desconectar
              </button>
            </div>
          )}
        </div>

        {/* Panel derecho: Dashboard y resultados */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Dashboard
            state={state}
            device={device}
            result={result}
            logs={logs}
            onOptimize={handleOptimize}
          />

          {result && <OptimizationPanel result={result} />}
        </div>
      </main>
    </div>
  );
}
