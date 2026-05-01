import React, { useState, useEffect, useCallback } from 'react';

export default function ExtensionsPanel() {
  const [extensions, setExtensions] = useState([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await window.optimizer.listExtensions();
      if (Array.isArray(data)) setExtensions(data);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const handleToggle = async (extId, enabled) => {
    await window.optimizer.toggleExtension({ extensionId: extId, enabled });
    await refresh();
  };

  const handleRunScript = async (extId, scriptName) => {
    const result = await window.optimizer.runExtensionScript({
      extensionId: extId,
      scriptName,
      deviceId: null, // Se pasa desde el componente padre si hay dispositivo
    });
    return result;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          🧩 Extensiones
        </h2>
        <button onClick={refresh} disabled={loading}
          className="text-xs px-3 py-1.5 bg-dark-700 hover:bg-dark-600 rounded-lg text-dark-200">
          🔄 Actualizar
        </button>
      </div>

      {/* Info */}
      <div className="glass p-4">
        <p className="text-xs text-dark-400">
          Las extensiones permiten agregar funcionalidad personalizada: scripts ADB adicionales,
          paneles de UI, análisis especializados. Coloca extensiones en <code className="text-dark-300 bg-dark-800 px-1 rounded">/extensions/</code>
        </p>
      </div>

      {/* Extensions List */}
      {extensions.length > 0 ? (
        <div className="space-y-3">
          {extensions.map((ext) => (
            <div key={ext.id} className="glass p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-dark-100">{ext.name}</h3>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-dark-700 text-dark-400">
                      v{ext.version}
                    </span>
                    {ext.enabled ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-green/10 text-accent-green">
                        Activa
                      </span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-dark-700 text-dark-500">
                        Inactiva
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-dark-400 mb-2">{ext.description}</p>
                  <p className="text-xs text-dark-500">por {ext.author}</p>
                </div>

                {/* Toggle */}
                <button
                  onClick={() => handleToggle(ext.id, !ext.enabled)}
                  className={`relative w-11 h-6 rounded-full transition-all duration-300 ${
                    ext.enabled ? 'bg-accent-green' : 'bg-dark-600'
                  }`}>
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-300 ${
                    ext.enabled ? 'left-[22px]' : 'left-0.5'
                  }`} />
                </button>
              </div>

              {/* ADB Scripts */}
              {ext.adbScripts && Object.keys(ext.adbScripts).length > 0 && (
                <div className="mt-3 pt-3 border-t border-dark-700/30">
                  <h4 className="text-xs text-dark-400 mb-2">Scripts ADB:</h4>
                  <div className="space-y-1.5">
                    {Object.entries(ext.adbScripts).map(([name, script]) => (
                      <div key={name} className="flex items-center justify-between bg-dark-900/50 rounded-lg px-3 py-2">
                        <div>
                          <div className="text-xs text-dark-200">{script.name || name}</div>
                          {script.description && (
                            <div className="text-xs text-dark-500">{script.description}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* UI Panel */}
              {ext.uiPanel && (
                <div className="mt-3 pt-3 border-t border-dark-700/30">
                  <span className="text-xs text-dark-400">Panel UI: </span>
                  <span className="text-xs text-dark-300">{ext.uiPanel.title}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="glass p-8 text-center">
          <div className="text-4xl mb-3 opacity-30">🧩</div>
          <p className="text-dark-400">No hay extensiones instaladas</p>
          <p className="text-dark-500 text-xs mt-2">
            Coloca extensiones en <code className="text-dark-400 bg-dark-800 px-1 rounded">/extensions/</code> con un <code className="text-dark-400 bg-dark-800 px-1 rounded">manifest.json</code>
          </p>
          <p className="text-dark-500 text-xs mt-1">
            Incluye Battery Doctor como ejemplo: <code className="text-dark-400 bg-dark-800 px-1 rounded">extensions/examples/battery-doctor/</code>
          </p>
        </div>
      )}
    </div>
  );
}
