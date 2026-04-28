import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HardDrive, Shield, Zap, Palette, RotateCcw, Lock,
  ChevronDown, Lightbulb, HelpCircle
} from 'lucide-react';

const guides = {
  backup: {
    title: 'Asistente — Backup Completo',
    icon: HardDrive,
    greeting: '¡Hola! Te guío para respaldar todo antes de hacer cambios. Es el paso más importante.',
    steps: [
      { text: 'Conectá tu Redmi 14C al PC con cable USB', detail: 'Usá el cable original o uno de calidad. Evitá hubs USB.' },
      { text: 'Activá Depuración USB en el teléfono', detail: 'Settings → Opciones de desarrollador → Depuración USB. Si no ves las opciones, tocá 7 veces "Versión de MIUI".' },
      { text: 'Seleccioná qué querés respaldar', detail: 'Marcá las casillas de abajo. Recomendamos: Contactos, WhatsApp, Fotos, APKs e Info del Sistema.' },
      { text: 'Hacé clic en "Generar Script"', detail: 'Se descargará un archivo .sh ejecutable que resguarda todo en tu PC.' },
      { text: 'Ejecutá el script en tu terminal', detail: 'Abrí una terminal donde descargaste el archivo y corré: bash backup_redmi14c.sh' },
    ],
    tip: 'Siempre hacé backup antes de debloat o performance. Si algo sale mal, podés restaurar todo.',
  },
  debloat: {
    title: 'Asistente — Debloat',
    icon: Shield,
    greeting: 'Te ayudo a limpiar el bloatware. Elegí un perfil y personalizá qué eliminar.',
    steps: [
      { text: 'Elegí un perfil de limpieza', detail: 'Seguro: solo apps redundantes. Equilibrado: incluye launcher y servicios. Agresivo: solo para expertos.' },
      { text: 'Revisá la lista de paquetes', detail: 'Cada paquete muestra su nivel de riesgo. Podés desmarcar los que quieras conservar.' },
      { text: 'Generá el script de debloat', detail: 'El script usa "pm uninstall -k --user 0" — no borra datos, solo desinstala para el usuario actual.' },
      { text: 'Ejecutá el script', detail: 'Conectá el teléfono, abrí terminal y corré el script. Cada paquete se desinstala individualmente.' },
      { text: 'Verificá que todo funcione', detail: 'Probá Bluetooth, WiFi, cámara y apps importantes. Si algo falla, usá el módulo Rescate.' },
    ],
    tip: 'Empezá con el perfil "Seguro". Siempre podés ser más agresivo después. El módulo Rescate revierte cualquier cambio.',
  },
  performance: {
    title: 'Asistente — Performance',
    icon: Zap,
    greeting: 'Vamos a acelerar tu Redmi 14C. Todos los tweaks son sin root y reversibles.',
    steps: [
      { text: 'Revisá cada tweak disponible', detail: 'Cada optimización tiene su nivel de riesgo e impacto. Los de alto impacto son los más notorios.' },
      { text: 'Entendé qué hace cada uno', detail: 'Hacé clic en un tweak para ver el comando ADB exacto. No es magia, son configuraciones del sistema.' },
      { text: 'Seleccioná los que querés aplicar', detail: 'Desmarcá los que no te convenzan. Los más recomendados: Animaciones 0.5x y Desactivar RAM Virtual.' },
      { text: 'Generá y ejecutá el script', detail: 'El script aplica todos los tweaks de una sola vez. Después reiniciá el teléfono.' },
      { text: 'Probá el rendimiento', detail: 'Navegá por el sistema, abrí apps, jugá algo. Si no te gusta, el script de Rescate revierte todo.' },
    ],
    tip: 'Las animaciones 0.5x y desactivar RAM Virtual son los tweaks con mayor impacto percibido.',
  },
  aesthetics: {
    title: 'Asistente — Estética',
    icon: Palette,
    greeting: 'Tu Redmi 14C puede verse mucho mejor. Blur nativo, 90Hz forzado y más.',
    steps: [
      { text: 'Entendé los cambios visuales', detail: 'Blur nativo activa el glassmorphism de HyperOS. 90Hz fuerza la tasa de refresco máxima.' },
      { text: 'Seleccioná los efectos que querés', detail: 'Todos son reversibles. El blur consume un poco más de batería pero se ve premium.' },
      { text: 'Generá el script', detail: 'El script modifica las configuraciones del sistema para activar los efectos visuales.' },
      { text: 'Ejecutá y reiniciá', detail: 'Los cambios visuales suelen requerir un reinicio para aplicarse completamente.' },
      { text: 'Disfrutá tu teléfono renovado', detail: 'Si el blur consume mucha batería, podés desactivarlo desde el módulo Rescate.' },
    ],
    tip: 'El blur nativo + 90Hz son los cambios que más transforman la experiencia visual del teléfono.',
  },
  rescue: {
    title: 'Asistente — Rescate',
    icon: RotateCcw,
    greeting: '¿Algo salió mal? No te preocupes, todo es reversible. Te ayudo a restaurar.',
    steps: [
      { text: 'Identificá qué falló', detail: '¿Bluetooth? ¿Wallpapers? ¿OTA? Cada problema tiene un fix rápido aquí abajo.' },
      { text: 'Usá los fixes rápidos', detail: 'Hacé clic en "Copiar" del fix que necesités y pegalo en tu terminal con el teléfono conectado.' },
      { text: '¿App eliminada por error?', detail: 'Escribí el nombre del paquete (ej: com.miui.gallery) y hacé clic en Restaurar.' },
      { text: '¿Necesitás revertir todo?', detail: 'El script de restauración completa revierte TODOS los cambios: animaciones, configuraciones, apps.' },
      { text: 'Reiniciá el teléfono', detail: 'Después de restaurar, siempre reiniciá: adb reboot' },
    ],
    tip: 'El script de restauración completa es tu red de seguridad. Descargalo antes de hacer cambios.',
  },
  root: {
    title: 'Asistente — Root (Opcional)',
    icon: Lock,
    greeting: 'Root es opcional y avanzado. El 80% de la mejora se logra solo con ADB.',
    steps: [
      { text: 'Entendé los riesgos', detail: 'Desbloquear el bootloader borra TODOS los datos y puede anular la garantía. Es reversible al re-lock.' },
      { text: 'Hacé backup de TODO', detail: 'Usá el módulo Backup primero. El bootloader wipe es total — fotos, apps, todo se borra.' },
      { text: 'Seguí los pasos en orden', detail: 'Bootloader → Magisk → Anti-bootloop → Kernel tuning. No te saltees pasos.' },
      { text: 'Esperá el tiempo de Xiaomi', detail: 'Mi Unlock requiere 72-360 horas de espera. Usá el teléfono normalmente mientras tanto.' },
      { text: 'Instalá protección anti-bootloop', detail: 'abootloop te salva si un módulo Magisk causa problemas. Es obligatorio.' },
    ],
    tip: 'Si solo querés mejorar rendimiento, no necesitás root. Los tweaks de ADB dan el 80% del resultado.',
  },
};

export function AssistantGuide({ module }) {
  const [isOpen, setIsOpen] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);

  const guide = guides[module];
  if (!guide) return null;
  const Icon = guide.icon;

  return (
    <motion.div
      className="assistant-panel mb-5"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      role="region"
      aria-label={guide.title}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="assistant-header w-full"
        aria-expanded={isOpen}
        aria-controls={`guide-content-${module}`}
      >
        <Icon className="w-5 h-5" />
        <span className="text-sm font-semibold flex-1 text-left">{guide.title}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
            id={`guide-content-${module}`}
            role="region"
          >
            <div className="p-3">
              <p className="text-sm text-text-secondary mb-3 flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-brand-400 flex-shrink-0 mt-0.5" />
                {guide.greeting}
              </p>

              <div className="space-y-0">
                {guide.steps.map((step, i) => (
                  <div
                    key={i}
                    className={`assistant-step cursor-pointer transition-colors hover:bg-brand-50 ${
                      i === currentStep ? 'bg-brand-50' : ''
                    }`}
                    onClick={() => setCurrentStep(i)}
                  >
                    <div className={`assistant-step-num ${i < currentStep ? 'assistant-step-done' : ''}`}>
                      {i < currentStep ? '✓' : i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${i === currentStep ? 'text-brand-700' : 'text-text-primary'}`}>
                        {step.text}
                      </p>
                      <AnimatePresence>
                        {i === currentStep && (
                          <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="text-xs text-text-muted mt-1"
                          >
                            {step.detail}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                    {i === currentStep && (
                      <HelpCircle className="w-4 h-4 text-brand-400 flex-shrink-0 mt-0.5" />
                    )}
                  </div>
                ))}
              </div>

              <div className="assistant-tip mt-3 flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-brand-400 flex-shrink-0 mt-0.5" />
                <span>{guide.tip}</span>
              </div>

              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                  disabled={currentStep === 0}
                  className="text-xs px-3 py-1.5 rounded-lg bg-surface-2 text-text-secondary hover:bg-surface-3 transition-colors disabled:opacity-40"
                >
                  ← Anterior
                </button>
                <button
                  onClick={() => setCurrentStep(Math.min(guide.steps.length - 1, currentStep + 1))}
                  disabled={currentStep === guide.steps.length - 1}
                  className="text-xs px-3 py-1.5 rounded-lg bg-brand-500 text-white hover:bg-brand-600 transition-colors disabled:opacity-40"
                >
                  Siguiente →
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
