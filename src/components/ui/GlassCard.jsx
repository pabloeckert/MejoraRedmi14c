import { motion } from 'framer-motion';

export function GlassCard({ children, className = '', onClick, hover = false }) {
  return (
    <motion.div
      className={`glass rounded-xl p-5 ${hover ? 'cursor-pointer' : ''} ${className}`}
      whileHover={hover ? { scale: 1.01 } : {}}
      whileTap={hover ? { scale: 0.99 } : {}}
      onClick={onClick}
      layout
    >
      {children}
    </motion.div>
  );
}
