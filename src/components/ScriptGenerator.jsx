import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download } from 'lucide-react';
import { BLOATWARE, TWEAKS, BACKUP_TARGETS } from '../data/device';
import { generateScript, downloadScript } from '../services/scriptGenerator';
import { MODULES } from '../data/modules';
import { useScriptHistory } from '../hooks/useHistory';

export function ScriptGenerator({ toast }) {
  const [activeModules, setActiveModules] = useState(['backup', 'performance', 'aesthetics']);
  const { addToHistory } = useScriptHistory();

  const toggleModule = (id) => {
    setActiveModules(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const generateFull = () => {
    const modules = [];

    if (activeModules.includes('backup')) {
      modules.push({ name: 'FASE 1: Backup Completo', type: 'backup', targets: BACKUP_TARGETS });
    }
    if (activeModules.includes('debloat')) {
      modules.push({ name: 'FASE 2: Debloat (Perfil Seguro)', type: 'debloat', packages: BLOATWARE.safe });
    }
    if (activeModules.includes('performance')) {
      modules.push({ name: 'FASE 3: Performance Tweaks', type: 'tweak', tweaks: TWEAKS.performance });
    }
    if (activeModules.includes('aesthetics')) {
      modules.push({ name: 'FASE 4: Estética', type: 'tweak', tweaks: TWEAKS.aesthetics });
    }

    const s = generateScript(modules);
    downloadScript(s, 'mejora_redmi14c_completo.sh');

    addToHistory({
      modules: modules.map(m => m.name).join(', '),
      filename: 'mejora_redmi14c_completo.sh',
      scriptLength: s.length,
      moduleCount: modules.length,
    });

    toast?.success('Script completo descargado correctamente');
  };

  return (
    <motion.div
      className="glass-strong rounded-2xl p-8 mt-10"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <h2 className="text-xl font-bold mb-3 text-text-primary">Generador de Script Completo</h2>
      <p className="text-sm text-text-secondary mb-6 leading-relaxed">
        Seleccioná las fases que querés incluir y generá un solo script ejecutable
      </p>

      <div className="flex flex-wrap gap-3 mb-7">
        {MODULES.filter(m => m.id !== 'rescue' && m.id !== 'root').map((mod) => (
          <button
            key={mod.id}
            onClick={() => toggleModule(mod.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all border ${
              activeModules.includes(mod.id)
                ? 'bg-brand-500/10 text-brand-300 border-brand-500/30'
                : 'bg-surface-2 text-text-muted border-glass-border hover:border-text-muted'
            }`}
          >
            <mod.icon className="w-3.5 h-3.5" />
            {mod.name}
          </button>
        ))}
      </div>

      <motion.button
        onClick={generateFull}
        className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-brand-500 text-white font-semibold hover:bg-brand-400 transition-colors"
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
      >
        <Download className="w-5 h-5" />
        Descargar Script Completo (.sh)
      </motion.button>
    </motion.div>
  );
}
