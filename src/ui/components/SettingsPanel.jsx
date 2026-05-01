import React, { useState, useEffect, useCallback } from 'react';

export default function SettingsPanel({ deviceId }) {
  const [autoMode, setAutoMode] = useState(false);
  const [autoModeStatus, setAutoModeStatus] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [backups, setBackups] = useState([]);
  const [wifiStatus, setWifiStatus] = useState(null);
  const [errors, setErrors] = useState({ stats: {}, recent: [] });
  const [showAddJob, setShowAddJob] = useState(false);
  const [newJob, setNewJob] = useState({ type: 'interval', days: 1, threshold: 40, comparator: 'lt' });
  const [aestheticMode, setAestheticMode] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportResult, setExportResult] = useState(null);
  const [reports, setReports] = useState([]);
  const [guardianActive, setGuardianActive] = useState(false);
  const [guardianStatus, setGuardianStatus] = useState(null);
  const [guardianLoading, setGuardianLoading] = useState(false);
  const [failureNotifications, setFailureNotifications] = useState(true);

  // Load data
  const refresh = useCallback(async () => {
    try {
      const [status, jobsList, errorStats, recentErrors] = await Promise.all([
        window.optimizer.autoModeStatus(),
        window.optimizer.schedulerListJobs(),
        window.optimizer.getErrorStats(),
        window.optimizer.getRecentErrors({ limit: 10 }),
      ]);
      if (!status.error) setAutoMode(status.active);
      if (Array.isArray(jobsList)) setJobs(jobsList);
      setErrors({ stats: errorStats || {}, recent: recentErrors || [] });

      if (deviceId) {
        const backupsList = await window.optimizer.listBackups({ deviceId });
        if (Array.isArray(backupsList)) setBackups(backupsList);
      }

      // Cargar reportes existentes (Ciclo 5)
      try {
        const reportsList = await window.optimizer.listReports?.();
        if (Array.isArray(reportsList)) setReports(reportsList.slice(0, 5));
      } catch {}

      // Cargar estado Guardian (Ciclo 6)
      try {
        const guardianSt = await window.optimizer.guardianStatus?.({ deviceId });
        if (guardianSt && !guardianSt.error) {
          setGuardianActive(guardianSt.active || false);
          setGuardianStatus(guardianSt);
        }
      } catch {}

      // Cargar preferencia de notificaciones de fallo
      try {
        const notifPref = await window.optimizer.getSetting?.('failureNotifications');
        if (notifPref != null) setFailureNotifications(notifPref);
      } catch {}
    } catch {}
  }, [deviceId]);

  useEffect(() => { refresh(); }, [refresh]);

  // Listen for auto mode status changes
  useEffect(() => {
    window.optimizer.onAutoModeStatus?.((data) => {
      setAutoModeStatus(data);
      refresh();
    });
  }, [refresh]);

  const handleToggleAutoMode = async () => {
    const result = await window.optimizer.autoModeToggle({ enabled: !autoMode });
    if (!result.error) setAutoMode(result.active);
  };

  const handleWifiConnect = async () => {
    if (!deviceId) return;
    setWifiStatus({ connecting: true });
    const result = await window.optimizer.wifiConnect({ deviceId });
    setWifiStatus(result.error ? { error: result.error } : result);
  };

  const handleWifiDisconnect = async () => {
    if (!deviceId) return;
    await window.optimizer.wifiDisconnect({ deviceId });
    setWifiStatus(null);
  };

  const handleCreateBackup = async () => {
    if (!deviceId) return;
    const result = await window.optimizer.createBackup({ deviceId });
    if (!result.error) {
      await refresh();
    }
  };

  const handleRollback = async (timestamp) => {
    if (!deviceId) return;
    await window.optimizer.rollback({ deviceId, timestamp });
  };

  const handleAddJob = async () => {
    const config = { deviceId, ...newJob };
    const result = await window.optimizer.schedulerAddJob(config);
    if (!result.error) {
      setShowAddJob(false);
      await refresh();
    }
  };

  const handleRemoveJob = async (jobId) => {
    await window.optimizer.schedulerRemoveJob({ jobId });
    await refresh();
  };

  const handleToggleJob = async (jobId, enabled) => {
    await window.optimizer.schedulerToggleJob({ jobId, enabled });
    await refresh();
  };

  // ── Exportar Reporte (Ciclo 5) ──
  const handleExportReport = async (format) => {
    if (!deviceId) return;
    setExporting(true);
    setExportResult(null);
    try {
      const result = await window.optimizer.exportReport({ deviceId, format });
      setExportResult(result.error ? { error: result.error } : result);
      if (!result.error) await refresh();
    } catch (err) {
      setExportResult({ error: err.message });
    }
    setExporting(false);
  };

  // ── Guardian Mode (Ciclo 6) ──
  const handleToggleGuardian = async () => {
    if (!deviceId) return;
    setGuardianLoading(true);
    try {
      if (guardianActive) {
        const result = await window.optimizer.guardianStop?.({ deviceId });
        if (result && !result.error) {
          setGuardianActive(false);
          setGuardianStatus(null);
        }
      } else {
        const result = await window.optimizer.guardianStart?.({ deviceId });
        if (result && !result.error) {
          setGuardianActive(true);
          setGuardianStatus({ active: true, checks: 0, alerts: 0 });
        }
      }
    } catch {}
    setGuardianLoading(false);
  };

  // ── PDF Export (Ciclo 6) ──
  const handleExportPDF = async () => {
    if (!deviceId) return;
    setExporting(true);
    setExportResult(null);
    try {
      const result = await window.optimizer.exportPDF?.({ deviceId });
      setExportResult(result?.error ? { error: result.error } : result);
      if (!result?.error) await refresh();
    } catch (err) {
      setExportResult({ error: err.message });
    }
    setExporting(false);
  };

  // ── Failure Notifications Toggle (Ciclo 6) ──
  const handleToggleFailureNotifications = async () => {
    const next = !failureNotifications;
    setFailureNotifications(next);
    try {
      await window.optimizer.setSetting?.('failureNotifications', next);
    } catch {}
  };

  return (
    <div className="space-y-6">
      {/* Auto Mode */}
      <Section icon="🤖" title="Modo Automático">
        <p className="text-xs text-dark-400 mb-4">
          Cuando está activo, detecta dispositivos automáticamente, optimiza, registra y notifica sin intervención.
          Ahora incluye integración profunda con predicciones ML y activación automática de Modo Turbo.
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Toggle enabled={autoMode} onToggle={handleToggleAutoMode} />
            <span className={`text-sm font-medium ${autoMode ? 'text-accent-green' : 'text-dark-400'}`}>
              {autoMode ? 'Activo' : 'Inactivo'}
            </span>
          </div>
          {autoModeStatus && (
            <span className="text-xs text-dark-500">{autoModeStatus.message}</span>
          )}
        </div>
      </Section>

      {/* Guardian Mode (Ciclo 6) */}
      <Section icon="🛡️" title="Modo Guardian">
        <p className="text-xs text-dark-400 mb-4">
          Protección continua: monitorea predicciones, anomalías, temperatura y procesos cada 30 segundos.
          Si detecta riesgo crítico, optimiza automáticamente y puede escalar a Modo Turbo.
        </p>
        {!deviceId ? (
          <p className="text-xs text-dark-500">Conecta un dispositivo primero</p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Toggle enabled={guardianActive} onToggle={handleToggleGuardian} />
                <span className={`text-sm font-medium ${guardianActive ? 'text-accent-green' : 'text-dark-400'}`}>
                  {guardianActive ? '🛡️ Protegido' : 'Inactivo'}
                </span>
              </div>
              {guardianLoading && <span className="text-xs text-dark-500">⏳</span>}
            </div>

            {guardianActive && guardianStatus && (
              <div className="bg-dark-900/50 rounded-xl p-3 border border-dark-700/20">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-lg font-bold text-dark-100">{guardianStatus.checks || 0}</div>
                    <div className="text-[10px] text-dark-500">Verificaciones</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-accent-orange">{guardianStatus.alerts || 0}</div>
                    <div className="text-[10px] text-dark-500">Alertas</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-accent-green">{guardianStatus.optimizations || 0}</div>
                    <div className="text-[10px] text-dark-500">Auto-optimizaciones</div>
                  </div>
                </div>
                {guardianStatus.criticalCount > 0 && (
                  <div className="mt-2 text-center">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent-red/10 text-accent-red border border-accent-red/20">
                      {guardianStatus.criticalCount} alertas críticas acumuladas
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="text-[10px] text-dark-600 space-y-1">
              <p>• Monitoreo cada 30s de métricas críticas</p>
              <p>• Notificaciones automáticas de riesgos</p>
              <p>• Optimización proactiva ante alertas críticas</p>
              <p>• Escalación a Modo Turbo tras 3 alertas críticas</p>
            </div>
          </div>
        )}
      </Section>

      {/* WiFi ADB */}
      <Section icon="📶" title="Conexión WiFi">
        <p className="text-xs text-dark-400 mb-4">
          Conecta el dispositivo por WiFi para operar sin cable USB. Requiere conexión USB inicial.
        </p>
        {!deviceId ? (
          <p className="text-xs text-dark-500">Conecta un dispositivo primero</p>
        ) : (
          <div className="space-y-3">
            {wifiStatus?.ip ? (
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-accent-green">✅ Conectado</span>
                  <span className="text-xs text-dark-400 ml-2">{wifiStatus.ip}:{wifiStatus.port}</span>
                </div>
                <button onClick={handleWifiDisconnect}
                  className="text-xs px-3 py-1.5 bg-dark-700 hover:bg-dark-600 rounded-lg text-dark-200">
                  Desconectar
                </button>
              </div>
            ) : (
              <button onClick={handleWifiConnect}
                disabled={wifiStatus?.connecting}
                className="w-full py-2.5 px-4 bg-accent-blue/10 hover:bg-accent-blue/20 border border-accent-blue/20
                  text-accent-blue text-sm font-medium rounded-xl transition-all disabled:opacity-50">
                {wifiStatus?.connecting ? '⏳ Conectando...' : '📶 Conectar por WiFi'}
              </button>
            )}
            {wifiStatus?.error && (
              <p className="text-xs text-accent-red">{wifiStatus.error}</p>
            )}
          </div>
        )}
      </Section>

      {/* Backups */}
      <Section icon="💾" title="Backups">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-dark-400">
            {backups.length} backup{backups.length !== 1 ? 's' : ''} disponible{backups.length !== 1 ? 's' : ''}
          </p>
          {deviceId && (
            <button onClick={handleCreateBackup}
              className="text-xs px-3 py-1.5 bg-accent-green/10 hover:bg-accent-green/20 border border-accent-green/20
                text-accent-green rounded-lg transition-all">
              + Crear backup
            </button>
          )}
        </div>
        {backups.length > 0 ? (
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {backups.map((b, i) => (
              <div key={i} className="flex items-center justify-between bg-dark-900/50 rounded-lg px-3 py-2 border border-dark-700/20">
                <div>
                  <div className="text-xs text-dark-200 font-mono">
                    {new Date(b.timestamp).toLocaleString('es')}
                  </div>
                  <div className="text-xs text-dark-500">
                    {b.appsCount} apps · {b.errorsCount} errores
                  </div>
                </div>
                <button onClick={() => handleRollback(b.timestamp)}
                  className="text-xs px-2 py-1 bg-dark-700 hover:bg-accent-red/20 hover:text-accent-red rounded text-dark-300 transition-all">
                  ↩️ Rollback
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-dark-500">No hay backups aún</p>
        )}
      </Section>

      {/* Exportar Reporte (Ciclo 5) */}
      <Section icon="📊" title="Exportar Reporte Técnico">
        <p className="text-xs text-dark-400 mb-4">
          Genera un reporte completo con métricas, anomalías, predicciones ML y recomendaciones.
        </p>
        {!deviceId ? (
          <p className="text-xs text-dark-500">Conecta un dispositivo primero</p>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-2">
              <button onClick={() => handleExportReport('json')}
                disabled={exporting}
                className="flex-1 py-2.5 px-4 bg-accent-blue/10 hover:bg-accent-blue/20 border border-accent-blue/20
                  text-accent-blue text-sm font-medium rounded-xl transition-all disabled:opacity-50">
                {exporting ? '⏳ Generando...' : '📄 JSON'}
              </button>
              <button onClick={() => handleExportReport('html')}
                disabled={exporting}
                className="flex-1 py-2.5 px-4 bg-accent-purple/10 hover:bg-accent-purple/20 border border-accent-purple/20
                  text-accent-purple text-sm font-medium rounded-xl transition-all disabled:opacity-50">
                {exporting ? '⏳ Generando...' : '🌐 HTML'}
              </button>
              <button onClick={handleExportPDF}
                disabled={exporting}
                className="flex-1 py-2.5 px-4 bg-accent-orange/10 hover:bg-accent-orange/20 border border-accent-orange/20
                  text-accent-orange text-sm font-medium rounded-xl transition-all disabled:opacity-50">
                {exporting ? '⏳ Generando...' : '📋 PDF'}
              </button>
            </div>

            <div className="flex gap-2">
              <button onClick={() => handleExportReport('both')}
                disabled={exporting}
                className="flex-1 py-2 px-4 bg-accent-green/10 hover:bg-accent-green/20 border border-accent-green/20
                  text-accent-green text-xs font-medium rounded-xl transition-all disabled:opacity-50">
                {exporting ? '⏳' : '📦 JSON + HTML'}
              </button>
            </div>

            {exportResult && !exportResult.error && (
              <div className="bg-accent-green/5 border border-accent-green/20 rounded-xl p-3">
                <p className="text-xs text-accent-green font-medium mb-1">✅ Reporte generado</p>
                {exportResult.files?.map((f, i) => (
                  <div key={i} className="flex items-center justify-between text-xs text-dark-400 mt-1">
                    <span className="font-mono">{f.format.toUpperCase()}</span>
                    <span>{(f.size / 1024).toFixed(1)} KB</span>
                  </div>
                ))}
              </div>
            )}

            {exportResult?.error && (
              <p className="text-xs text-accent-red">❌ {exportResult.error}</p>
            )}

            {/* Reportes recientes */}
            {reports.length > 0 && (
              <div>
                <p className="text-xs text-dark-500 mb-2">Reportes recientes:</p>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {reports.map((r, i) => (
                    <div key={i} className="flex items-center justify-between bg-dark-900/50 rounded-lg px-3 py-1.5 border border-dark-700/20">
                      <span className="text-xs text-dark-300 font-mono truncate">{r.name}</span>
                      <span className="text-xs text-dark-500 ml-2">{(r.size / 1024).toFixed(1)} KB</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Section>

      {/* Scheduler */}
      <Section icon="⏰" title="Optimización Programada">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-dark-400">{jobs.length} tarea{jobs.length !== 1 ? 's' : ''}</p>
          {deviceId && (
            <button onClick={() => setShowAddJob(!showAddJob)}
              className="text-xs px-3 py-1.5 bg-accent-purple/10 hover:bg-accent-purple/20 border border-accent-purple/20
                text-accent-purple rounded-lg transition-all">
              + Nueva tarea
            </button>
          )}
        </div>

        {/* Add Job Form */}
        {showAddJob && (
          <div className="bg-dark-900/50 rounded-xl p-4 border border-dark-700/30 mb-3 space-y-3">
            <div className="flex gap-2">
              <select value={newJob.type}
                onChange={e => setNewJob({ ...newJob, type: e.target.value })}
                className="flex-1 bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-sm text-dark-200">
                <option value="interval">📅 Cada X días</option>
                <option value="battery">🔋 Cuando batería {'<'} umbral</option>
                <option value="temperature">🌡️ Cuando temperatura {'>'} umbral</option>
              </select>
            </div>

            {newJob.type === 'interval' && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-dark-400">Cada</span>
                <input type="number" min="1" max="30" value={newJob.days}
                  onChange={e => setNewJob({ ...newJob, days: parseInt(e.target.value) || 1 })}
                  className="w-16 bg-dark-800 border border-dark-600 rounded-lg px-2 py-1.5 text-sm text-dark-200 text-center" />
                <span className="text-xs text-dark-400">días</span>
              </div>
            )}

            {newJob.type === 'battery' && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-dark-400">Cuando batería {'<'}</span>
                <input type="number" min="10" max="90" value={newJob.threshold}
                  onChange={e => setNewJob({ ...newJob, threshold: parseInt(e.target.value) || 40 })}
                  className="w-16 bg-dark-800 border border-dark-600 rounded-lg px-2 py-1.5 text-sm text-dark-200 text-center" />
                <span className="text-xs text-dark-400">%</span>
              </div>
            )}

            {newJob.type === 'temperature' && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-dark-400">Cuando temperatura {'>'}</span>
                <input type="number" min="30" max="55" value={newJob.threshold}
                  onChange={e => setNewJob({ ...newJob, threshold: parseInt(e.target.value) || 42 })}
                  className="w-16 bg-dark-800 border border-dark-600 rounded-lg px-2 py-1.5 text-sm text-dark-200 text-center" />
                <span className="text-xs text-dark-400">°C</span>
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={handleAddJob}
                className="flex-1 py-2 bg-accent-purple hover:bg-accent-purple/80 text-white text-sm rounded-lg transition-all">
                Crear tarea
              </button>
              <button onClick={() => setShowAddJob(false)}
                className="px-3 py-2 bg-dark-700 hover:bg-dark-600 text-dark-300 text-sm rounded-lg transition-all">
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Jobs List */}
        {jobs.length > 0 ? (
          <div className="space-y-2">
            {jobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between bg-dark-900/50 rounded-lg px-3 py-2 border border-dark-700/20">
                <div className="flex items-center gap-2">
                  <Toggle enabled={job.enabled} onToggle={() => handleToggleJob(job.id, !job.enabled)} small />
                  <div>
                    <div className="text-xs text-dark-200">
                      {job.type === 'interval' && `📅 Cada ${job.days} días`}
                      {job.type === 'battery' && `🔋 Batería < ${job.threshold}%`}
                      {job.type === 'temperature' && `🌡️ Temp > ${job.threshold}°C`}
                    </div>
                    {job.lastRun && (
                      <div className="text-xs text-dark-500">
                        Última: {new Date(job.lastRun).toLocaleString('es')}
                      </div>
                    )}
                  </div>
                </div>
                <button onClick={() => handleRemoveJob(job.id)}
                  className="text-xs text-dark-500 hover:text-accent-red transition-colors">
                  🗑️
                </button>
              </div>
            ))}
          </div>
        ) : !showAddJob && (
          <p className="text-xs text-dark-500">No hay tareas programadas</p>
        )}
      </Section>

      {/* Ultra Aesthetic Mode */}
      <Section icon="✨" title="Ultra Aesthetic Mode">
        <p className="text-xs text-dark-400 mb-3">
          Activa efectos visuales premium: glassmorphism avanzado, blur dinámico, sombras suaves, microinteracciones y animaciones fluidas.
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Toggle enabled={aestheticMode} onToggle={() => {
              const next = !aestheticMode;
              setAestheticMode(next);
              try {
                const ua = require('../theme/ultraAesthetic');
                if (next) ua.enable(); else ua.disable();
              } catch {}
            }} />
            <span className={`text-sm font-medium ${aestheticMode ? 'text-accent-purple' : 'text-dark-400'}`}>
              {aestheticMode ? '✨ Activo' : 'Inactivo'}
            </span>
          </div>
        </div>
      </Section>

      {/* Notificaciones de Fallos Predichos (Ciclo 6) */}
      <Section icon="🔔" title="Notificaciones de Predicciones">
        <p className="text-xs text-dark-400 mb-3">
          Recibe notificaciones cuando el motor ML predice fallos inminentes: temperatura {'>'}  45°C, batería {'<'} 15%, procesos {'>'} 120, almacenamiento {'<'} 5%.
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Toggle enabled={failureNotifications} onToggle={handleToggleFailureNotifications} />
            <span className={`text-sm font-medium ${failureNotifications ? 'text-accent-green' : 'text-dark-400'}`}>
              {failureNotifications ? '🔔 Activas' : '🔕 Desactivadas'}
            </span>
          </div>
        </div>
        {failureNotifications && (
          <div className="mt-3 text-[10px] text-dark-600 space-y-1">
            <p>🌡️ Temperatura futura {'>'} 45°C → Notificación crítica</p>
            <p>🔋 Batería futura {'<'} 15% → Notificación de advertencia</p>
            <p>⚙️ Procesos futuros {'>'} 120 → Notificación de advertencia</p>
            <p>💾 Almacenamiento futuro {'<'} 5% → Notificación crítica</p>
          </div>
        )}
      </Section>

      {/* Error Log */}
      <Section icon="🐛" title="Registro de Errores">
        <div className="flex items-center gap-4 mb-3">
          <span className="text-xs text-dark-400">
            Total: {errors.stats?.total || 0} errores
          </span>
        </div>
        {errors.recent?.length > 0 ? (
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {errors.recent.slice(-5).reverse().map((err, i) => (
              <div key={i} className="bg-dark-900/50 rounded-lg px-3 py-2 border border-dark-700/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-dark-300">{err.context}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    err.severity === 'critical' ? 'bg-accent-red/10 text-accent-red' :
                    err.severity === 'high' ? 'bg-accent-orange/10 text-accent-orange' :
                    'bg-dark-700 text-dark-400'
                  }`}>{err.severity}</span>
                </div>
                <p className="text-xs text-dark-500 mt-1 truncate">{err.message}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-accent-green">✅ Sin errores recientes</p>
        )}
      </Section>
    </div>
  );
}

function Section({ icon, title, children }) {
  return (
    <div className="glass p-5">
      <h3 className="text-sm font-semibold text-dark-200 mb-3 flex items-center gap-2">
        <span>{icon}</span> {title}
      </h3>
      {children}
    </div>
  );
}

function Toggle({ enabled, onToggle, small = false }) {
  return (
    <button onClick={onToggle}
      className={`relative rounded-full transition-all duration-300 ${
        small ? 'w-8 h-4' : 'w-11 h-6'
      } ${enabled ? 'bg-accent-green' : 'bg-dark-600'}`}>
      <div className={`absolute top-0.5 rounded-full bg-white shadow transition-all duration-300 ${
        small ? 'w-3 h-3' : 'w-5 h-5'
      } ${enabled
        ? small ? 'left-[18px]' : 'left-[22px]'
        : 'left-0.5'
      }`} />
    </button>
  );
}
