import { useLocalStorage } from './useLocalStorage';

/**
 * Analytics hook — localStorage only, zero PII.
 * Tracks module usage, script generation count, and session data.
 * No external services, no network requests, no personal data.
 */
export function useAnalytics() {
  const [stats, setStats] = useLocalStorage('mejora-analytics', {
    scriptsGenerated: 0,
    modulesUsed: {},
    firstVisit: new Date().toISOString(),
    lastVisit: new Date().toISOString(),
    totalSessions: 0,
  });

  const trackScriptGeneration = (moduleIds) => {
    setStats(prev => {
      const modulesUsed = { ...prev.modulesUsed };
      moduleIds.forEach(id => {
        modulesUsed[id] = (modulesUsed[id] || 0) + 1;
      });
      return {
        ...prev,
        scriptsGenerated: prev.scriptsGenerated + 1,
        modulesUsed,
        lastVisit: new Date().toISOString(),
      };
    });
  };

  const trackSession = () => {
    setStats(prev => ({
      ...prev,
      totalSessions: prev.totalSessions + 1,
      lastVisit: new Date().toISOString(),
    }));
  };

  const getTopModules = () => {
    return Object.entries(stats.modulesUsed)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([id, count]) => ({ id, count }));
  };

  return {
    stats,
    trackScriptGeneration,
    trackSession,
    getTopModules,
  };
}
