import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';

/**
 * Hook para historial de scripts generados.
 * Guarda los últimos N scripts en localStorage.
 */
export function useScriptHistory(maxItems = 20) {
  const [history, setHistory] = useLocalStorage('mejora-script-history', []);

  const addToHistory = useCallback((entry) => {
    setHistory(prev => {
      const newEntry = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        ...entry,
      };
      return [newEntry, ...prev].slice(0, maxItems);
    });
  }, [setHistory, maxItems]);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, [setHistory]);

  const removeFromHistory = useCallback((id) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  }, [setHistory]);

  return { history, addToHistory, clearHistory, removeFromHistory };
}

/**
 * Hook para perfiles de configuración exportables/importables.
 */
export function useProfiles() {
  const [profiles, setProfiles] = useLocalStorage('mejora-profiles', {});

  const saveProfile = useCallback((name, config) => {
    setProfiles(prev => ({
      ...prev,
      [name]: {
        ...config,
        savedAt: new Date().toISOString(),
      },
    }));
  }, [setProfiles]);

  const deleteProfile = useCallback((name) => {
    setProfiles(prev => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }, [setProfiles]);

  const exportProfile = useCallback((name) => {
    const profile = profiles[name];
    if (!profile) return null;
    const blob = new Blob([JSON.stringify({ name, ...profile }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mejora_profile_${name}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [profiles]);

  const importProfile = useCallback(() => {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return resolve(null);
        const reader = new FileReader();
        reader.onload = (ev) => {
          try {
            const data = JSON.parse(ev.target.result);
            if (data.name) {
              saveProfile(data.name, data);
              resolve(data);
            }
          } catch {
            resolve(null);
          }
        };
        reader.readAsText(file);
      };
      input.click();
    });
  }, [saveProfile]);

  return { profiles, saveProfile, deleteProfile, exportProfile, importProfile };
}
