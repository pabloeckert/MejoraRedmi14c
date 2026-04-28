import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Sun, Moon, Film, Sparkles, Globe, AlertTriangle } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';

export function SettingsPanel({ theme, setTheme, grain, setGrain, animations, setAnimations, locale, switchLocale }) {
  const [isOpen, setIsOpen] = useState(false);
  const [, setDisclaimerAccepted] = useLocalStorage('mejora-disclaimer-accepted', false);

  return (
    <div className="relative">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="glass rounded-xl p-2.5 hover:bg-surface-1 transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title="Configuración"
        aria-label="Abrir configuración"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Settings className="w-4 h-4 text-text-secondary" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-64 glass-strong rounded-xl p-4 z-50"
          >
            <p className="text-sm font-bold text-text-primary mb-3">Configuración</p>

            {/* Theme toggle */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                {theme === 'dark' ? <Moon className="w-4 h-4 text-brand-400" /> : <Sun className="w-4 h-4 text-brand-500" />}
                <span className="text-sm text-text-secondary" id="theme-label">Tema</span>
              </div>
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                aria-labelledby="theme-label"
                aria-pressed={theme === 'dark'}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer ${
                  theme === 'dark' ? 'bg-brand-500' : 'bg-surface-4'
                }`}
              >
                <motion.div
                  className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md"
                  animate={{ x: theme === 'dark' ? 20 : 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </button>
            </div>

            {/* Grain toggle */}
            <div className="flex items-center justify-between py-2 border-t border-surface-3">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-text-muted" />
                <span className="text-sm text-text-secondary" id="grain-label">Grain</span>
              </div>
              <button
                onClick={() => setGrain(grain === 'on' ? 'off' : 'on')}
                aria-labelledby="grain-label"
                aria-pressed={grain === 'on'}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer ${
                  grain === 'on' ? 'bg-brand-500' : 'bg-surface-4'
                }`}
              >
                <motion.div
                  className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md"
                  animate={{ x: grain === 'on' ? 20 : 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </button>
            </div>

            {/* Animations toggle */}
            <div className="flex items-center justify-between py-2 border-t border-surface-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-text-muted" />
                <span className="text-sm text-text-secondary" id="animations-label">Animaciones</span>
              </div>
              <button
                onClick={() => setAnimations(animations === 'on' ? 'off' : 'on')}
                aria-labelledby="animations-label"
                aria-pressed={animations === 'on'}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer ${
                  animations === 'on' ? 'bg-brand-500' : 'bg-surface-4'
                }`}
              >
                <motion.div
                  className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md"
                  animate={{ x: animations === 'on' ? 20 : 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </button>
            </div>

            {/* Language switcher */}
            {switchLocale && (
              <div className="flex items-center justify-between py-2 border-t border-surface-3">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-text-muted" />
                  <span className="text-sm text-text-secondary" id="lang-label">Idioma</span>
                </div>
                <button
                  onClick={() => switchLocale(locale === 'es' ? 'en' : 'es')}
                  aria-labelledby="lang-label"
                  className="px-3 py-1 rounded-lg bg-surface-2 text-xs font-semibold text-text-secondary hover:bg-surface-3 transition-colors"
                >
                  {locale === 'es' ? 'EN' : 'ES'}
                </button>
              </div>
            )}

            {/* Show disclaimer again */}
            <div className="py-2 border-t border-surface-3">
              <button
                onClick={() => { setDisclaimerAccepted(false); setIsOpen(false); }}
                className="flex items-center gap-2 w-full text-left text-xs text-text-muted hover:text-text-secondary transition-colors"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Ver aviso legal
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
