import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, CheckCircle, Loader2, X } from 'lucide-react';
import { useElectron } from '../hooks/useElectron';

export function UpdateBanner() {
  const { isElectron } = useElectron();
  const [updateState, setUpdateState] = useState('idle'); // idle | checking | available | downloading | downloaded | error
  const [updateInfo, setUpdateInfo] = useState(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!isElectron || !window.electronAPI) return;

    // Listen for update events
    window.electronAPI.onUpdateAvailable((info) => {
      setUpdateState('available');
      setUpdateInfo(info);
      setDismissed(false);
    });

    window.electronAPI.onUpdateProgress((data) => {
      setUpdateState('downloading');
      setProgress(Math.round(data.percent));
    });

    window.electronAPI.onUpdateDownloaded((info) => {
      setUpdateState('downloaded');
      setUpdateInfo(info);
    });

    window.electronAPI.onUpdateError((data) => {
      setUpdateState('error');
      setError(data.message);
    });

    // Check for updates on mount
    checkForUpdates();
  }, [isElectron]);

  const checkForUpdates = async () => {
    if (!window.electronAPI) return;
    setUpdateState('checking');
    try {
      const result = await window.electronAPI.checkForUpdates();
      if (result.available) {
        setUpdateState('available');
        setUpdateInfo(result);
      } else {
        setUpdateState('idle');
      }
    } catch {
      setUpdateState('idle');
    }
  };

  const handleDownload = async () => {
    if (!window.electronAPI) return;
    setUpdateState('downloading');
    setProgress(0);
    await window.electronAPI.downloadUpdate();
  };

  const handleInstall = () => {
    if (window.electronAPI) {
      window.electronAPI.installUpdate();
    }
  };

  if (!isElectron || dismissed) return null;

  const variants = {
    initial: { opacity: 0, y: -20, height: 0 },
    animate: { opacity: 1, y: 0, height: 'auto' },
    exit: { opacity: 0, y: -20, height: 0 },
  };

  return (
    <AnimatePresence>
      {updateState === 'available' && updateInfo && (
        <motion.div
          key="update-available"
          {...variants}
          className="glass rounded-xl p-4 mb-4 border border-info/30"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Download className="w-5 h-5 text-info" />
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  Actualización disponible: v{updateInfo.version}
                </p>
                <p className="text-xs text-text-muted">
                  Nueva versión lista para descargar
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                onClick={handleDownload}
                className="px-4 py-2 rounded-lg bg-info text-white text-xs font-semibold hover:opacity-90"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                Descargar
              </motion.button>
              <button
                onClick={() => setDismissed(true)}
                className="p-1 text-text-muted hover:text-text-primary"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {updateState === 'downloading' && (
        <motion.div
          key="update-downloading"
          {...variants}
          className="glass rounded-xl p-4 mb-4 border border-info/30"
        >
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-info animate-spin" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-text-primary">
                Descargando actualización...
              </p>
              <div className="mt-2 h-2 bg-surface-3 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-info rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="text-xs text-text-muted mt-1">{progress}%</p>
            </div>
          </div>
        </motion.div>
      )}

      {updateState === 'downloaded' && (
        <motion.div
          key="update-ready"
          {...variants}
          className="glass rounded-xl p-4 mb-4 border border-success/30"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-success" />
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  Actualización lista
                </p>
                <p className="text-xs text-text-muted">
                  Se instalará al reiniciar la app
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                onClick={handleInstall}
                className="px-4 py-2 rounded-lg bg-success text-white text-xs font-semibold hover:opacity-90"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                Reiniciar y actualizar
              </motion.button>
              <button
                onClick={() => setDismissed(true)}
                className="p-1 text-text-muted hover:text-text-primary"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {updateState === 'error' && (
        <motion.div
          key="update-error"
          {...variants}
          className="glass rounded-xl p-4 mb-4 border border-danger/30"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-secondary">
              Error al verificar actualizaciones
            </p>
            <button
              onClick={() => { setUpdateState('idle'); setError(null); }}
              className="p-1 text-text-muted hover:text-text-primary"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
