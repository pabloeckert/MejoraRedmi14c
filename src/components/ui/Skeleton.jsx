import { motion } from 'framer-motion';

/**
 * Skeleton loading component — animated placeholder for content loading.
 */
export function Skeleton({ className = '', variant = 'text', width, height }) {
  const variants = {
    text: 'rounded-md',
    circle: 'rounded-full',
    card: 'rounded-xl',
    button: 'rounded-lg',
  };

  return (
    <motion.div
      className={`bg-surface-3 animate-pulse ${variants[variant]} ${className}`}
      style={{ width, height }}
      initial={{ opacity: 0.5 }}
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      aria-hidden="true"
    />
  );
}

/**
 * Module skeleton — placeholder for module content loading.
 */
export function ModuleSkeleton() {
  return (
    <div className="space-y-4" aria-label="Cargando..." role="status">
      <Skeleton variant="text" className="h-7 w-48" />
      <Skeleton variant="text" className="h-4 w-72" />
      <div className="space-y-3 mt-6">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} variant="card" className="h-20 w-full" />
        ))}
      </div>
      <div className="flex justify-between mt-6">
        <Skeleton variant="text" className="h-4 w-32" />
        <Skeleton variant="button" className="h-10 w-40" />
      </div>
    </div>
  );
}
