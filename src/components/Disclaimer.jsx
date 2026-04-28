import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Shield } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';

export function Disclaimer() {
  const [accepted, setAccepted] = useLocalStorage('mejora-disclaimer-accepted', false);
  const [showDetails, setShowDetails] = useState(false);

  if (accepted) return null;

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="glass-strong rounded-2xl p-8 max-w-lg w-full mx-4 relative"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        {/* Icon */}
        <div className="flex items-center justify-center mb-5">
          <div className="w-14 h-14 rounded-2xl bg-warning/10 flex items-center justify-center border border-warning/20">
            <AlertTriangle className="w-7 h-7 text-warning" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-text-primary text-center mb-2">
          Aviso Legal y de Seguridad
        </h2>
        <p className="text-sm text-text-secondary text-center mb-5 leading-relaxed">
          Esta herramienta genera scripts ADB para optimizar tu dispositivo.
          Usala bajo tu propio riesgo.
        </p>

        {/* Key warnings */}
        <div className="space-y-3 mb-5">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-surface-1 border border-glass-border">
            <Shield className="w-4 h-4 text-accent-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-text-secondary leading-relaxed">
              <strong className="text-text-primary">Todo es reversible.</strong> Los scripts generados usan comandos ADB estándar que pueden deshacerse. El módulo Rescate permite restaurar cualquier cambio.
            </p>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-xl bg-surface-1 border border-glass-border">
            <AlertTriangle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
            <p className="text-xs text-text-secondary leading-relaxed">
              <strong className="text-text-primary">Revisá antes de ejecutar.</strong> Los scripts se generan para que los leas y ejecutes vos mismo. No ejecutamos comandos directamente en tu dispositivo.
            </p>
          </div>
        </div>

        {/* Expandable details */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs text-brand-500 hover:text-brand-400 font-medium mb-4 transition-colors"
        >
          {showDetails ? 'Ocultar detalles' : 'Ver más detalles →'}
        </button>

        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-4"
            >
              <div className="text-xs text-text-muted space-y-2 p-3 rounded-xl bg-surface-1 border border-glass-border">
                <p>• <strong>Perfil Agresivo de Debloat</strong> incluye paquetes críticos (Google Play Services, Bluetooth). Solo usalo si sabés lo que hacés.</p>
                <p>• <strong>Root y desbloqueo de bootloader</strong> anulan la garantía y borran todos los datos. Es opcional y solo para usuarios avanzados.</p>
                <p>• <strong>Los scripts no recopilan datos.</strong> Todo se ejecuta localmente vía USB. No hay servidores, no hay telemetría.</p>
                <p>• <strong>Licencia MIT:</strong> esta herramienta se ofrece "tal cual", sin garantía de ningún tipo.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Accept button */}
        <motion.button
          onClick={() => setAccepted(true)}
          className="w-full py-3 rounded-xl bg-brand-500 text-white font-semibold text-sm hover:bg-brand-400 transition-colors shadow-lg shadow-brand-500/20"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Entiendo los riesgos, continuar
        </motion.button>

        <p className="text-[10px] text-text-muted text-center mt-3">
          Podés ver la documentación completa en cualquier momento desde Configuración.
        </p>
      </motion.div>
    </motion.div>
  );
}
