import { motion } from 'framer-motion';
import { MODULES } from '../data/modules';

export function Navigation({ active, onSelect }) {
  return (
    <nav className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-10" aria-label="Módulos de optimización">
      {MODULES.map((mod, i) => (
        <motion.button
          key={mod.id}
          onClick={() => onSelect(mod.id)}
          aria-current={active === mod.id ? 'page' : undefined}
          aria-label={`${mod.name}: ${mod.desc}`}
          className={`glass rounded-xl p-4 text-left transition-all ${
            active === mod.id ? 'ring-1 ring-brand-400/30 bg-brand-500/5 border-brand-400/15' : ''
          }`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04 * i + 0.15 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <mod.icon className={`w-5 h-5 mb-2.5 ${active === mod.id ? mod.color : 'text-text-muted'}`} />
          <p className={`text-sm font-semibold ${active === mod.id ? 'text-text-primary' : 'text-text-secondary'}`}>
            {mod.name}
          </p>
          <p className="text-xs text-text-muted mt-1 hidden sm:block leading-relaxed">{mod.desc}</p>
        </motion.button>
      ))}
    </nav>
  );
}
