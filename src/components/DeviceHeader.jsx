import { motion } from 'framer-motion';
import { Smartphone, Cpu, HardDrive, Zap, Eye } from 'lucide-react';
import { DEVICE } from '../data/device';
import { Badge } from './ui';

export function DeviceHeader() {
  return (
    <motion.div
      className="glass-strong rounded-2xl p-8 mb-8"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center gap-5">
        <div className="w-14 h-14 rounded-xl bg-brand-500/10 flex items-center justify-center border border-brand-500/15">
          <Smartphone className="w-7 h-7 text-brand-400" />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-text-primary">{DEVICE.name}</h2>
          <p className="text-sm text-text-secondary mt-1">
            {DEVICE.soc} · {DEVICE.ram.physical}GB RAM · {DEVICE.storage.total}GB · {DEVICE.os}
          </p>
        </div>
        <div className="text-right hidden sm:block">
          <Badge variant="brand">{DEVICE.display.refreshRate}Hz</Badge>
          <p className="text-xs text-text-muted mt-2">{DEVICE.display.resolution}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-7">
        {[
          { icon: Cpu, label: 'CPU', value: `${DEVICE.cpu.big.count}+${DEVICE.cpu.little.count} cores` },
          { icon: HardDrive, label: 'Storage', value: `${DEVICE.storage.total}GB ${DEVICE.storage.type}` },
          { icon: Zap, label: 'Batería', value: `${DEVICE.battery.capacity}mAh` },
          { icon: Eye, label: 'Pantalla', value: DEVICE.display.size },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            className="text-center p-4 rounded-xl bg-surface-1 border border-glass-border"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 * i + 0.2 }}
          >
            <item.icon className="w-5 h-5 mx-auto mb-2 text-brand-400" />
            <p className="text-xs text-text-muted uppercase tracking-wide">{item.label}</p>
            <p className="text-sm font-semibold text-text-primary mt-1">{item.value}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
