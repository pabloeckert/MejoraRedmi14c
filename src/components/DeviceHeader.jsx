import { motion } from 'framer-motion';
import { Smartphone, Cpu, HardDrive, Battery, Monitor } from 'lucide-react';
import { DEVICE } from '../data/device';

export function DeviceHeader() {
  const specs = [
    { icon: Cpu, label: 'Procesador', value: `${DEVICE.cpu.big.count}+${DEVICE.cpu.little.count} núcleos`, sub: DEVICE.soc },
    { icon: HardDrive, label: 'Almacenamiento', value: `${DEVICE.storage.total}GB`, sub: DEVICE.storage.type },
    { icon: Battery, label: 'Batería', value: `${DEVICE.battery.capacity}mAh`, sub: `${DEVICE.battery.charging}W carga` },
    { icon: Monitor, label: 'Pantalla', value: DEVICE.display.size, sub: `${DEVICE.display.resolution} · ${DEVICE.display.refreshRate}Hz` },
  ];

  return (
    <motion.div
      className="rounded-2xl overflow-hidden mb-8 border border-glass-border"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header with gradient */}
      <div className="relative bg-gradient-to-br from-brand-500 via-brand-400 to-accent-pink p-6 sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.15),transparent)]" />
        <div className="relative flex items-center gap-5">
          <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/20">
            <Smartphone className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white">{DEVICE.name}</h2>
            <p className="text-sm text-white/80 mt-1">
              {DEVICE.os} · Codename: {DEVICE.codename}
            </p>
          </div>
          <div className="text-right hidden sm:block">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/20 text-white text-xs font-semibold">
              {DEVICE.display.refreshRate}Hz
            </div>
          </div>
        </div>
      </div>

      {/* Specs grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-glass-border bg-surface-1">
        {specs.map((item, i) => (
          <motion.div
            key={item.label}
            className="p-4 sm:p-5 text-center"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 * i + 0.2 }}
          >
            <item.icon className="w-4 h-4 mx-auto mb-2 text-brand-500" />
            <p className="text-[0.65rem] text-text-muted uppercase tracking-wider font-medium">{item.label}</p>
            <p className="text-sm font-bold text-text-primary mt-1">{item.value}</p>
            <p className="text-[0.7rem] text-text-muted mt-0.5">{item.sub}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
