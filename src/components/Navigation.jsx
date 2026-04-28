import { motion } from 'framer-motion';
import { MODULES } from '../data/modules';

const MODULE_COLORS = {
  backup:     { bg: 'bg-blue-50',    border: 'border-blue-200',    icon: 'text-blue-500',    activeBg: 'bg-blue-500',    activeText: 'text-white' },
  debloat:    { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'text-emerald-500', activeBg: 'bg-emerald-500', activeText: 'text-white' },
  performance:{ bg: 'bg-amber-50',   border: 'border-amber-200',   icon: 'text-amber-500',   activeBg: 'bg-amber-500',   activeText: 'text-white' },
  aesthetics: { bg: 'bg-purple-50',  border: 'border-purple-200',  icon: 'text-purple-500',  activeBg: 'bg-purple-500',  activeText: 'text-white' },
  rescue:     { bg: 'bg-rose-50',    border: 'border-rose-200',    icon: 'text-rose-500',    activeBg: 'bg-rose-500',    activeText: 'text-white' },
  root:       { bg: 'bg-slate-50',   border: 'border-slate-200',   icon: 'text-slate-500',   activeBg: 'bg-slate-600',   activeText: 'text-white' },
};

const MODULE_COLORS_DARK = {
  backup:     { bg: 'dark:bg-blue-950/40',    border: 'dark:border-blue-800/40',    activeBg: 'dark:bg-blue-500' },
  debloat:    { bg: 'dark:bg-emerald-950/40', border: 'dark:border-emerald-800/40', activeBg: 'dark:bg-emerald-500' },
  performance:{ bg: 'dark:bg-amber-950/40',   border: 'dark:border-amber-800/40',   activeBg: 'dark:bg-amber-500' },
  aesthetics: { bg: 'dark:bg-purple-950/40',  border: 'dark:border-purple-800/40',  activeBg: 'dark:bg-purple-500' },
  rescue:     { bg: 'dark:bg-rose-950/40',    border: 'dark:border-rose-800/40',    activeBg: 'dark:bg-rose-500' },
  root:       { bg: 'dark:bg-slate-900/40',   border: 'dark:border-slate-700/40',   activeBg: 'dark:bg-slate-500' },
};

export function Navigation({ active, onSelect }) {
  return (
    <nav className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-10" aria-label="Módulos de optimización">
      {MODULES.map((mod, i) => {
        const isActive = active === mod.id;
        const colors = MODULE_COLORS[mod.id];
        const darkColors = MODULE_COLORS_DARK[mod.id];

        return (
          <motion.button
            key={mod.id}
            onClick={() => onSelect(mod.id)}
            aria-current={isActive ? 'page' : undefined}
            aria-label={`${mod.name}: ${mod.desc}`}
            className={`relative rounded-xl p-4 text-left transition-all border ${
              isActive
                ? `${colors.activeBg} ${darkColors.activeBg} ${colors.activeText} border-transparent shadow-lg`
                : `${colors.bg} ${darkColors.bg} ${colors.border} ${darkColors.border} hover:shadow-md`
            }`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 * i + 0.15 }}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
          >
            {/* Active indicator dot */}
            {isActive && (
              <motion.div
                layoutId="nav-indicator"
                className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-white shadow-sm"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}

            <mod.icon className={`w-5 h-5 mb-2 ${
              isActive ? 'opacity-90' : colors.icon
            }`} />

            <p className={`text-sm font-semibold ${
              isActive ? '' : 'text-text-primary'
            }`}>
              {mod.name}
            </p>

            <p className={`text-xs mt-1 hidden sm:block leading-relaxed ${
              isActive ? 'opacity-80' : 'text-text-muted'
            }`}>
              {mod.desc}
            </p>
          </motion.button>
        );
      })}
    </nav>
  );
}
