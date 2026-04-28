// Detect if running inside Electron
export const isElectron = () => {
  return typeof window !== 'undefined' && window.electronAPI !== undefined;
};

// Electron API wrapper (safe to call in browser — returns null)
export const electronAPI = typeof window !== 'undefined' ? window.electronAPI : null;
