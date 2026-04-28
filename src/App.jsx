import { useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocalStorage } from './hooks/useLocalStorage';
import { DEVICE } from './data/device';
import { DeviceHeader } from './components/DeviceHeader';
import { Navigation } from './components/Navigation';
import { ElectronStatusBar } from './components/ElectronStatusBar';
import { SettingsPanel } from './components/SettingsPanel';
import { ScriptGenerator } from './components/ScriptGenerator';
import { HistoryPanel } from './components/HistoryPanel';
import { ProfilesPanel } from './components/ProfilesPanel';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastContainer } from './components/Toast';
import { useToast } from './hooks/useToast';
import { ToastContext } from './hooks/useToastContext';
import { useI18n } from './hooks/useI18n';
import { I18nProvider } from './components/I18nProvider';
import { Onboarding } from './components/Onboarding';
import { Disclaimer } from './components/Disclaimer';
import { FAQ } from './components/FAQ';
import { UpdateBanner } from './components/UpdateBanner';

// Code splitting — módulos cargados bajo demanda
const BackupModule = lazy(() => import('./modules/BackupModule').then(m => ({ default: m.BackupModule })));
const DebloatModule = lazy(() => import('./modules/DebloatModule').then(m => ({ default: m.DebloatModule })));
const PerformanceModule = lazy(() => import('./modules/PerformanceModule').then(m => ({ default: m.PerformanceModule })));
const AestheticsModule = lazy(() => import('./modules/AestheticsModule').then(m => ({ default: m.AestheticsModule })));
const RescueModule = lazy(() => import('./modules/RescueModule').then(m => ({ default: m.RescueModule })));
const RootModule = lazy(() => import('./modules/RootModule').then(m => ({ default: m.RootModule })));

const MODULE_COMPONENTS = {
  backup: BackupModule,
  debloat: DebloatModule,
  performance: PerformanceModule,
  aesthetics: AestheticsModule,
  rescue: RescueModule,
  root: RootModule,
};

function ModuleLoader() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="flex items-center gap-3 text-text-muted">
        <motion.div
          className="w-5 h-5 border-2 border-brand-400 border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
        />
        <span className="text-sm">Cargando módulo...</span>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <AppContent />
    </I18nProvider>
  );
}

function AppContent() {
  const [activeModule, setActiveModule] = useLocalStorage('mejora-active-module', 'backup');
  const [theme, setTheme] = useLocalStorage('mejora-theme', 'light');
  const [grain, setGrain] = useLocalStorage('mejora-grain', 'on');
  const [animations, setAnimations] = useLocalStorage('mejora-animations', 'on');
  const toast = useToast();
  const { locale, switchLocale } = useI18n();

  // Apply data attributes to html for CSS selectors
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    root.setAttribute('data-grain', grain);
    root.setAttribute('data-animations', animations);
  }, [theme, grain, animations]);

  const ActiveModule = MODULE_COMPONENTS[activeModule] || BackupModule;

  return (
    <div className="min-h-screen bg-gradient-mesh">
      <Disclaimer />
      <Onboarding />
      <UpdateBanner />
      {/* Skip to content — accesibilidad */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-brand-500 focus:text-white focus:rounded-lg">
        Saltar al contenido principal
      </a>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Hero header */}
        <motion.div
          className="text-center mb-10 relative"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Settings in top-right corner */}
          <div className="absolute top-0 right-0 z-10">
            <SettingsPanel
              theme={theme} setTheme={setTheme}
              grain={grain} setGrain={setGrain}
              animations={animations} setAnimations={setAnimations}
              locale={locale} switchLocale={switchLocale}
            />
          </div>

          {/* Logo/icon */}
          <motion.div
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-400 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-brand-500/25"
            initial={{ scale: 0.8, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
          >
            <span className="text-2xl">📱</span>
          </motion.div>

          <motion.h1
            className="text-4xl sm:text-5xl font-bold text-text-primary leading-none"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            Mejora<span className="text-brand-500">Redmi</span>14c
          </motion.h1>

          <motion.p
            className="text-base text-text-secondary mt-3 max-w-md mx-auto leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
          >
            Potenciá tu {DEVICE.name} sin root, sin riesgo.
            <br />
            <span className="text-text-muted text-sm">Todo reversible · Scripts ADB automáticos</span>
          </motion.p>
        </motion.div>

        <DeviceHeader />
        <ElectronStatusBar />
        <Navigation active={activeModule} onSelect={setActiveModule} />

        {/* Module Content — Error Boundary por módulo + Suspense para code splitting */}
        <main id="main-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeModule}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="glass-strong rounded-2xl p-8"
          >
            <ErrorBoundary module={activeModule} key={activeModule}>
              <ToastContext.Provider value={toast}>
              <Suspense fallback={<ModuleLoader />}>
                <ActiveModule />
              </Suspense>
              </ToastContext.Provider>
            </ErrorBoundary>
          </motion.div>
        </AnimatePresence>
        </main>

        <ScriptGenerator toast={toast} />
        <HistoryPanel />
        <ProfilesPanel currentConfig={{ activeModule, theme, grain, animations, locale }} />

        {/* Footer — generous spacing */}
        <motion.footer
          className="text-center mt-14 pt-8 border-t border-glass-border"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <p className="text-sm text-text-muted">
            {DEVICE.name} ({DEVICE.codename}) · {DEVICE.ram.physical}GB RAM · {DEVICE.storage.total}GB
          </p>
          <p className="text-sm text-text-muted mt-2">
            MIT License · UADNG · debloat-hyperos-adb · adb-turbo
          </p>
        </motion.footer>

        <FAQ />
        <ToastContainer toasts={toast.toasts} onDismiss={toast.dismiss} />
      </div>
    </div>
  );
}
