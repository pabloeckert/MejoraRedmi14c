import { useEffect, useCallback } from 'react';

/**
 * Keyboard shortcuts hook
 * Registers global keyboard shortcuts for the app.
 */
export function useKeyboard({ onModuleSelect, onGenerate, onToggleSettings }) {
  const handleKeyDown = useCallback((e) => {
    // Don't trigger shortcuts when typing in inputs
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    // Number keys 1-6 → select module
    if (e.key >= '1' && e.key <= '6' && !e.metaKey && !e.ctrlKey) {
      const modules = ['backup', 'debloat', 'performance', 'aesthetics', 'rescue', 'root'];
      const idx = parseInt(e.key) - 1;
      if (modules[idx] && onModuleSelect) {
        onModuleSelect(modules[idx]);
      }
    }

    // Ctrl/Cmd + G → generate script
    if ((e.metaKey || e.ctrlKey) && e.key === 'g') {
      e.preventDefault();
      if (onGenerate) onGenerate();
    }

    // Ctrl/Cmd + , → toggle settings
    if ((e.metaKey || e.ctrlKey) && e.key === ',') {
      e.preventDefault();
      if (onToggleSettings) onToggleSettings();
    }

    // ? → show shortcuts help
    if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
      // Show help modal (handled by component)
    }
  }, [onModuleSelect, onGenerate, onToggleSettings]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
