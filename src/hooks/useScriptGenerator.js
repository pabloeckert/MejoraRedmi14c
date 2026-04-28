import { useState, useCallback } from 'react';
import { generateScript, downloadScript } from '../services/scriptGenerator';
import { useScriptHistory } from './useHistory';
import { useToastContext } from './useToastContext';

/**
 * Hook que envuelve la generación de scripts con historial y toast.
 * Usar en módulos para generar scripts con tracking automático.
 */
export function useScriptGenerator() {
  const [script, setScript] = useState('');
  const { addToHistory } = useScriptHistory();
  const toast = useToastContext();

  const generate = useCallback((modules, filename) => {
    try {
      const s = generateScript(modules);
      setScript(s);

      const moduleNames = modules.map(m => m.name).join(', ');
      addToHistory({
        modules: moduleNames,
        filename: filename || `mejora_redmi14c_${Date.now()}.sh`,
        scriptLength: s.length,
        moduleCount: modules.length,
      });

      toast?.success('Script generado correctamente');
      return s;
    } catch (err) {
      toast?.error(`Error: ${err.message}`);
      return null;
    }
  }, [addToHistory, toast]);

  const download = useCallback((filename) => {
    if (script) {
      downloadScript(script, filename);
      toast?.success('Script descargado');
    }
  }, [script, toast]);

  return { script, generate, download, setScript };
}
