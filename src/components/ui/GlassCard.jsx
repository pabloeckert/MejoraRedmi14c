import { motion } from 'framer-motion';

export function GlassCard({ children, className = '', onClick, hover = false, variant = 'default' }) {
  const variants = {
    default: 'bg-surface-1 border-glass-border',
    brand: 'bg-brand-50 border-brand-200 dark:bg-brand-950/20 dark:border-brand-800/30',
    accent: 'bg-accent-50 border-accent-200 dark:bg-accent-950/20 dark:border-accent-800/30',
  };

  return (
    <motion.div
      className={`rounded-xl p-5 border transition-all ${variants[variant]} ${
        hover ? 'cursor-pointer hover:shadow-md hover:border-brand-400/30' : ''
      } ${className}`}
      whileHover={hover ? { scale: 1.01, y: -1 } : {}}
      whileTap={hover ? { scale: 0.99 } : {}}
      onClick={onClick}
      layout
    >
      {children}
    </motion.div>
  );
}
