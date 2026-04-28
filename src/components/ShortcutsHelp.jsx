import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Keyboard, X } from 'lucide-react';

const SHORTCUTS = [
  { keys: ['1'], desc: 'Backup' },
  { keys: ['2'], desc: 'Debloat' },
  { keys: ['3'], desc: 'Performance' },
  { keys: ['4'], desc: 'Estética' },
  { keys: ['5'], desc: 'Rescate' },
  { keys: ['6'], desc: 'Root' },
  { keys: ['⌘', 'G'], desc: 'Generar script' },
  { keys: ['⌘', ','], desc: 'Configuración' },
  { keys: ['?'], desc: 'Atajos de teclado' },
];

export function ShortcutsHelp() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setOpen(prev => !prev);
      }
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  return (
    <>
      <motion.button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-20 z-40 glass rounded-full p-3 shadow-lg hover:shadow-xl transition-shadow"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        title="Atajos de teclado (?)"
        aria-label="Ver atajos de teclado"
      >
        <Keyboard className="w-5 h-5 text-text-muted" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              className="glass-strong rounded-2xl p-6 max-w-sm w-full mx-4"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-text-primary">Atajos de Teclado</h2>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-surface-2 transition-colors"
                  aria-label="Cerrar"
                >
                  <X className="w-4 h-4 text-text-muted" />
                </button>
              </div>

              <div className="space-y-2">
                {SHORTCUTS.map((s, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-glass-border last:border-0">
                    <span className="text-sm text-text-secondary">{s.desc}</span>
                    <div className="flex gap-1">
                      {s.keys.map((k, j) => (
                        <kbd
                          key={j}
                          className="px-2 py-1 rounded-md bg-surface-2 border border-glass-border text-xs font-mono font-semibold text-text-primary"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-[10px] text-text-muted text-center mt-4">
                En macOS usa ⌘, en Windows/Linux usa Ctrl
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
