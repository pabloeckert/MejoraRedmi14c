import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, ChevronRight, Search } from 'lucide-react';

const FAQ_ITEMS = [
  {
    q: '¿Es seguro usar esto?',
    a: 'Sí. Todos los comandos ADB usados son estándar y reversibles. El módulo Rescate permite restaurar cualquier cambio. Los scripts se generan para que los leas antes de ejecutar.',
    tags: 'seguridad riesgo seguro',
  },
  {
    q: '¿Necesito root?',
    a: 'No. El 80% de la optimización se logra solo con ADB (sin root). Root es opcional y solo para usuarios avanzados que quieren kernel tuning.',
    tags: 'root adb necesario',
  },
  {
    q: '¿Se borran mis datos?',
    a: 'No. Los comandos ADB de debloat y performance no borran datos. Solo el desbloqueo de bootloader (módulo Root, opcional) borra datos.',
    tags: 'datos pérdida información',
  },
  {
    q: '¿Puedo deshacer los cambios?',
    a: 'Sí. El módulo Rescate tiene un script de restauración completa que revierte todos los cambios. También podés restaurar apps individuales.',
    tags: 'deshacer revertir restaurar undo',
  },
  {
    q: '¿Qué pasa si elimino algo importante?',
    a: 'El perfil "Seguro" solo elimina bloatware no esencial. Si eliminás algo importante, usá el módulo Rescate → "Restaurar app específica" con el nombre del paquete.',
    tags: 'eliminar importante restaurar',
  },
  {
    q: '¿Funciona con otros teléfonos Xiaomi?',
    a: 'Esta app está optimizada para el Redmi 14C (airflow). Los comandos ADB genéricos funcionan en otros teléfonos, pero los paquetes de bloatware pueden ser diferentes.',
    tags: 'compatibilidad otros teléfonos xiaomi redmi',
  },
  {
    q: '¿Necesito tener ADB instalado?',
    a: 'Para la versión web, solo necesitás descargar el script y ejecutarlo en una terminal con ADB. Para la versión Desktop, la app verifica que ADB esté instalado.',
    tags: 'adb instalación terminal',
  },
  {
    q: '¿La app recopila datos?',
    a: 'No. Todo se ejecuta localmente. No hay servidores, no hay telemetría, no hay requests de red. Los analytics son solo un contador en localStorage.',
    tags: 'privacidad datos telemetría',
  },
  {
    q: '¿Por qué las animaciones 0.5x son tan importantes?',
    a: 'Las animaciones lentas hacen que el teléfono se sienta lento aunque sea potente. Con 0.5x, todo se siente instantáneo. Es el cambio con mayor impacto percibido.',
    tags: 'animaciones velocidad percepción',
  },
  {
    q: '¿Qué es la RAM virtual y por qué desactivarla?',
    a: 'La RAM virtual usa almacenamiento como RAM extra. Pero el eMMC del Redmi 14C es mucho más lento que la RAM real. Desactivarla mejora el rendimiento general.',
    tags: 'ram virtual zram rendimiento',
  },
];

export function FAQ() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? FAQ_ITEMS.filter(
        item =>
          item.q.toLowerCase().includes(search.toLowerCase()) ||
          item.a.toLowerCase().includes(search.toLowerCase()) ||
          item.tags.includes(search.toLowerCase())
      )
    : FAQ_ITEMS;

  return (
    <>
      {/* FAQ trigger button */}
      <motion.button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 left-6 z-40 glass rounded-full p-3 shadow-lg hover:shadow-xl transition-shadow"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        title="Preguntas frecuentes"
        aria-label="Abrir preguntas frecuentes"
      >
        <HelpCircle className="w-5 h-5 text-brand-500" />
      </motion.button>

      {/* FAQ modal */}
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
              className="glass-strong rounded-2xl p-6 max-w-lg w-full mx-4 max-h-[80vh] flex flex-col"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-text-primary">Preguntas Frecuentes</h2>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-surface-2 transition-colors text-text-muted"
                  aria-label="Cerrar"
                >
                  ✕
                </button>
              </div>

              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-surface-1 border border-glass-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* FAQ list */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {filtered.length === 0 && (
                  <p className="text-sm text-text-muted text-center py-8">No se encontraron resultados.</p>
                )}
                {filtered.map((item, i) => (
                  <div key={i} className="glass rounded-lg overflow-hidden">
                    <button
                      onClick={() => setExpanded(expanded === i ? null : i)}
                      className="w-full flex items-center gap-3 p-3.5 text-left hover:bg-surface-1 transition-colors"
                    >
                      <p className="text-sm font-medium text-text-primary flex-1">{item.q}</p>
                      <motion.div
                        animate={{ rotate: expanded === i ? 90 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronRight className="w-4 h-4 text-text-muted" />
                      </motion.div>
                    </button>
                    <AnimatePresence>
                      {expanded === i && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <p className="px-3.5 pb-3.5 text-xs text-text-secondary leading-relaxed">
                            {item.a}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
