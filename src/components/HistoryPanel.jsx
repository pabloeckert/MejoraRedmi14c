import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Trash2, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { useScriptHistory } from '../hooks/useHistory';

export function HistoryPanel() {
  const { history, clearHistory, removeFromHistory } = useScriptHistory();
  const [isOpen, setIsOpen] = useState(false);

  if (history.length === 0) return null;

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <motion.div
      className="glass-strong rounded-2xl p-6 mt-6"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-text-muted" />
          <span className="text-sm font-semibold text-text-primary">
            Historial ({history.length})
          </span>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-2">
              {history.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-surface-1 border border-glass-border"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="w-4 h-4 text-brand-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {entry.modules}
                      </p>
                      <p className="text-xs text-text-muted">
                        {formatDate(entry.timestamp)} · {entry.moduleCount} módulo{entry.moduleCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromHistory(entry.id)}
                    className="p-1.5 rounded hover:bg-surface-2 transition-colors flex-shrink-0"
                    aria-label="Eliminar del historial"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-text-muted" />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={clearHistory}
                className="text-xs text-text-muted hover:text-danger transition-colors"
              >
                Limpiar historial
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
