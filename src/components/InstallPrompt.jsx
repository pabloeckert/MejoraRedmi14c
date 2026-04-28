import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';

export function InstallPrompt() {
  const [dismissed, setDismissed] = useLocalStorage('mejora-install-dismissed', false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      // Prevent the default mini-infobar
      e.preventDefault();
      setDeferredPrompt(e);
      // Show our custom prompt after a delay
      if (!dismissed) {
        setTimeout(() => setShow(true), 5000);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [dismissed]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShow(false);
    }
    setDeferredPrompt(null);
  };

  const dismiss = () => {
    setShow(false);
    setDismissed(true);
  };

  if (!deferredPrompt || dismissed) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-sm w-full mx-4"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <div className="glass-strong rounded-2xl p-4 shadow-xl flex items-center gap-4 border border-brand-400/20">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-5 h-5 text-brand-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-primary">Instalar MejoraRedmi14c</p>
              <p className="text-xs text-text-muted">Acceso rápido desde tu escritorio o pantalla de inicio</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <motion.button
                onClick={handleInstall}
                className="px-4 py-2 rounded-lg bg-brand-500 text-white text-xs font-semibold hover:bg-brand-400 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Download className="w-3.5 h-3.5" />
              </motion.button>
              <button
                onClick={dismiss}
                className="p-1.5 rounded-lg hover:bg-surface-2 transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4 text-text-muted" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
