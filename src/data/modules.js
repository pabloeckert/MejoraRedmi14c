import { HardDrive, Shield, Zap, Palette, RotateCcw, Lock } from 'lucide-react';

export const MODULES = [
  { id: 'backup', name: 'Backup Completo', icon: HardDrive, color: 'text-info', desc: 'Respaldar todo antes de tocar nada' },
  { id: 'debloat', name: 'Debloat', icon: Shield, color: 'text-success', desc: 'Eliminar bloatware de Xiaomi/Google' },
  { id: 'performance', name: 'Performance', icon: Zap, color: 'text-warning', desc: 'Tweaks de rendimiento y kernel' },
  { id: 'aesthetics', name: 'Estética', icon: Palette, color: 'text-brand-500', desc: 'Blur, animaciones, refresh rate' },
  { id: 'rescue', name: 'Rescate', icon: RotateCcw, color: 'text-danger', desc: 'Restaurar apps y configuraciones' },
  { id: 'root', name: 'Root (Opcional)', icon: Lock, color: 'text-text-muted', desc: 'Magisk + kernel tuning avanzado' },
];
