import { useState, useCallback } from 'react';
import es from '../locales/es.json';
import en from '../locales/en.json';
import pt from '../locales/pt.json';
import fr from '../locales/fr.json';
import { I18nContext } from '../hooks/useI18n';

const LOCALES = { es, en, pt, fr };

export function I18nProvider({ children }) {
  const [locale, setLocale] = useState(() => {
    try {
      return localStorage.getItem('mejora-locale') || 'es';
    } catch {
      return 'es';
    }
  });

  const t = useCallback((key, params = {}) => {
    const dict = LOCALES[locale] || LOCALES.es;
    let text = dict[key] || LOCALES.es[key] || key;
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(`{${k}}`, v);
    });
    return text;
  }, [locale]);

  const switchLocale = useCallback((newLocale) => {
    setLocale(newLocale);
    try {
      localStorage.setItem('mejora-locale', newLocale);
    } catch { /* ignore */ }
    document.documentElement.lang = newLocale;
  }, []);

  return (
    <I18nContext.Provider value={{ locale, t, switchLocale, availableLocales: Object.keys(LOCALES) }}>
      {children}
    </I18nContext.Provider>
  );
}
