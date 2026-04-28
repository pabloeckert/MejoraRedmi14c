import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, HardDrive, Zap, ChevronRight, ChevronLeft, X } from 'lucide-react';
import { useI18n } from '../hooks/useI18n';
import { useLocalStorage } from '../hooks/useLocalStorage';

const STEPS = [
  { icon: Smartphone, titleKey: 'onboarding.step1.title', descKey: 'onboarding.step1.desc' },
  { icon: HardDrive, titleKey: 'onboarding.step2.title', descKey: 'onboarding.step2.desc' },
  { icon: Zap, titleKey: 'onboarding.step3.title', descKey: 'onboarding.step3.desc' },
];

export function Onboarding() {
  const { t } = useI18n();
  const [seen, setSeen] = useLocalStorage('mejora-onboarding-seen', false);
  const [step, setStep] = useState(0);

  if (seen) return null;

  const currentStep = STEPS[step];
  const Icon = currentStep.icon;

  const finish = () => setSeen(true);
  const next = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else finish();
  };
  const prev = () => {
    if (step > 0) setStep(step - 1);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="glass-strong rounded-2xl p-8 max-w-md w-full mx-4 relative"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        {/* Close */}
        <button
          onClick={finish}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-surface-2 transition-colors"
          aria-label={t('onboarding.skip')}
        >
          <X className="w-4 h-4 text-text-muted" />
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            className="w-16 h-16 rounded-2xl bg-brand-500/10 flex items-center justify-center mx-auto mb-4 border border-brand-500/15"
            key={step}
            initial={{ scale: 0.8, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            <Icon className="w-8 h-8 text-brand-400" />
          </motion.div>
          <h2 className="text-2xl font-bold text-text-primary">{t('onboarding.welcome')}</h2>
          <p className="text-sm text-text-secondary mt-2">{t('onboarding.intro')}</p>
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="text-center mb-8"
          >
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              {t(currentStep.titleKey)}
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              {t(currentStep.descKey)}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-6">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === step ? 'bg-brand-500' : i < step ? 'bg-brand-300' : 'bg-surface-3'
              }`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={prev}
            disabled={step === 0}
            className="flex items-center gap-1 text-sm text-text-muted hover:text-text-secondary transition-colors disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
            {t('onboarding.prev')}
          </button>

          <div className="flex gap-2">
            <button
              onClick={finish}
              className="px-4 py-2 rounded-lg text-sm text-text-muted hover:text-text-secondary transition-colors"
            >
              {t('onboarding.skip')}
            </button>
            <motion.button
              onClick={next}
              className="flex items-center gap-1 px-5 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-400 transition-colors"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              {step === STEPS.length - 1 ? t('onboarding.start') : t('onboarding.next')}
              {step < STEPS.length - 1 && <ChevronRight className="w-4 h-4" />}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
