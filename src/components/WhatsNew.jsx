import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';

const CURRENT_VERSION = '1.1.0';
const HIGHLIGHTS = [
  { emoji: '📚', text: 'Storybook para documentar componentes visuales' },
  { emoji: '❓', text: 'Panel de Preguntas Frecuentes con búsqueda' },
  { emoji: '⌨️', text: 'Atajos de teclado (1-6, ⌘G, ?)' },
  { emoji: '🌍', text: 'Portugués y Francés — 4 idiomas en total' },
  { emoji: '🛡️', text: 'Aviso legal de seguridad en primera visita' },
  { emoji: '📊', text: 'Analytics locales (sin telemetría, cero PII)' },
];

export function WhatsNew() {
  const [lastSeen, setLastSeen] = useLocalStorage('mejora-whats-new', '1.0.0');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (lastSeen !== CURRENT_VERSION) {
      // Small delay to not overwhelm on first load
      const timer = setTimeout(() => setOpen(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [lastSeen]);

  const dismiss = () => {
    setOpen(false);
    setLastSeen(CURRENT_VERSION);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed bottom-24 right-6 z-50 max-w-xs"
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <div className="glass-strong rounded-2xl p-5 shadow-xl border border-brand-400/20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-500" />
                <span className="text-sm font-bold text-text-primary">¿Qué hay de nuevo?</span>
              </div>
              <button
                onClick={dismiss}
                className="p-1 rounded-lg hover:bg-surface-2 transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-3.5 h-3.5 text-text-muted" />
              </button>
            </div>

            <p className="text-xs text-text-muted mb-3">v{CURRENT_VERSION}</p>

            <ul className="space-y-2 mb-4">
              {HIGHLIGHTS.map((h, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                  <span className="flex-shrink-0">{h.emoji}</span>
                  <span>{h.text}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={dismiss}
              className="w-full py-2 rounded-lg bg-brand-500 text-white text-xs font-semibold hover:bg-brand-400 transition-colors"
            >
              Entendido
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
