import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ChevronRight } from 'lucide-react';
import { DEVICE } from '../data/device';
import { AssistantGuide } from '../components/AssistantGuide';
import { GlassCard, Badge } from '../components/ui';

export function RootModule() {
  const [expanded, setExpanded] = useState(null);

  const steps = [
    {
      num: '0',
      title: 'Entender los Riesgos',
      content: `Al desbloquear el bootloader de tu ${DEVICE.name}:
• Pierdes la garantía de Xiaomi (reversible al re-lock)
• Se borran TODOS los datos del teléfono (por eso necesitás el backup)
• Existe un riesgo mínimo (<0.1%) de brick permanente
• Apps bancarias pueden dejar de funcionar (solucionable con Shamiko)
• SafetyNet/Play Integrity puede fallar (solucionable con TrickyStore)

Con Magisk + abootloop, el proceso es seguro para la mayoría de usuarios.`,
    },
    {
      num: '1',
      title: 'Desbloquear Bootloader',
      content: `Método oficial de Xiaomi:
1. Activar Opciones de Desarrollador (tap 7x en versión)
2. Activar: OEM Unlocking + USB Debugging + USB Debugging (Security)
3. Vincular cuenta Xiaomi: Settings > Dev Options > Mi Unlock Status
4. Esperar 72-360 horas (usar el teléfono normalmente)
5. Usar Mi Unlock Tool desde PC: https://en.miui.com/unlock/index.html

⚠️ No desvincular cuenta ni apagar Find My Phone durante la espera.`,
    },
    {
      num: '2',
      title: 'Instalar Magisk',
      content: `1. Descargar ROM stock EXACTA de tu dispositivo
2. Extraer boot.img de la ROM
3. Transferir boot.img al teléfono: adb push boot.img /sdcard/
4. Instalar Magisk app: descargar de github.com/topjohnwu/Magisk
5. En Magisk: Install > Select and Patch a File > boot.img
6. Transferir boot parcheado: adb pull /sdcard/Download/magisk_patched-*.img
7. Entrar en fastboot: adb reboot bootloader
8. Flashear: fastboot flash boot magisk_patched.img
9. Reiniciar: fastboot reboot
10. Verificar: abrir Magisk — debe mostrar "Installed"`,
    },
    {
      num: '3',
      title: 'Instalar Protección Anti-Bootloop',
      content: `Repo: github.com/Magisk-Modules-Alt-Repo/abootloop

1. Descargar abootloop.zip
2. Magisk app > Modules > Install from storage
3. Elegir combinación de teclas (ej: Vol Up + Vol Down)
4. REINICIAR

Si hay bootloop:
1. Forzar apagado (Power 10+ segundos)
2. Encender y presionar la combinación de teclas
3. El teléfono arranca con módulos desactivados
4. Eliminar el módulo problemático`,
    },
    {
      num: '4',
      title: 'Kernel Tuning (Solo con Root)',
      content: `Estos tweaks requieren root y dan el 20% extra de rendimiento:

# CPU Governor (máximo rendimiento)
echo "performance" > /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor

# I/O Scheduler (mejor para flash storage)
echo "bfq" > /sys/block/mmcblk0/queue/scheduler

# Reducir swappiness (menos swap)
echo 60 > /proc/sys/vm/swappiness

# TCP BBR (mejor red)
echo "bbr" > /proc/sys/net/ipv4/tcp_congestion_control

# Read-ahead buffer
echo 256 > /sys/block/mmcblk0/queue/read_ahead_kb`,
    },
    {
      num: '5',
      title: 'Deshacer Root (Si es necesario)',
      content: `1. Magisk app > Uninstall Magisk > Complete Uninstall
2. Esto restaura boot.img original
3. Para re-lock bootloader:
   fastboot flashing locking
   ⚠️ Esto borra TODOS los datos

4. El teléfono queda como si nunca se hubiera rooteado`,
    },
  ];

  return (
    <div className="space-y-4">
      <AssistantGuide module="root" />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-text-primary">Root Opcional — Magisk + Kernel</h2>
          <p className="text-sm text-text-secondary mt-1 leading-relaxed">Para usuarios avanzados que quieren el máximo rendimiento</p>
        </div>
        <Badge variant="danger">Avanzado</Badge>
      </div>

      <GlassCard>
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-warning mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-warning">Advertencia</p>
            <p className="text-xs text-text-muted mt-1">
              Root no es obligatorio. El 80% de la mejora se logra con solo ADB.
              Root da el 20% restante (kernel tuning real) pero requiere desbloquear bootloader,
              lo que borra todos los datos y puede anular la garantía.
            </p>
          </div>
        </div>
      </GlassCard>

      <div className="space-y-2">
        {steps.map((step) => (
          <motion.div
            key={step.num}
            className="glass rounded-lg overflow-hidden"
            layout
          >
            <button
              onClick={() => setExpanded(expanded === step.num ? null : step.num)}
              className="w-full flex items-center gap-3 p-4 text-left hover:bg-surface-1 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-brand-600">{step.num}</span>
              </div>
              <p className="text-sm font-medium flex-1 text-text-primary">{step.title}</p>
              <motion.div
                animate={{ rotate: expanded === step.num ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronRight className="w-4 h-4 text-text-muted" />
              </motion.div>
            </button>
            <AnimatePresence>
              {expanded === step.num && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 ml-11">
                    <pre className="code-block text-xs whitespace-pre-wrap">{step.content}</pre>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
