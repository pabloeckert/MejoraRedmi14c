import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, CheckCircle2 } from 'lucide-react';
import { DEVICE, TWEAKS } from '../data/device';
import { generateScript, downloadScript } from '../services/scriptGenerator';
import { AssistantGuide } from '../components/AssistantGuide';
import { Badge, ImpactBadge, CopyButton } from '../components/ui';
import { useToastContext } from '../hooks/useToastContext';

export function AestheticsModule() {
  const [selected, setSelected] = useState(new Set(TWEAKS.aesthetics.map(t => t.id)));
  const [script, setScript] = useState('');
  const toast = useToastContext();

  const toggle = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const generate = () => {
    const tweaks = TWEAKS.aesthetics.filter(t => selected.has(t.id));
    const s = generateScript([{ name: 'Estética', type: 'tweak', tweaks }]);
    setScript(s);
    toast?.success('Script de estética generado');
  };

  return (
    <div className="space-y-4">
      <AssistantGuide module="aesthetics" />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-text-primary">Estética — Visual y Animaciones</h2>
          <p className="text-sm text-text-secondary mt-1 leading-relaxed">Blur, refresh rate y pulido visual para {DEVICE.name}</p>
        </div>
        <Badge variant="brand">Visual</Badge>
      </div>

      <div className="space-y-3">
        {TWEAKS.aesthetics.map((tweak, i) => (
          <motion.div
            key={tweak.id}
            className={`glass rounded-lg p-4 cursor-pointer ${selected.has(tweak.id) ? 'ring-1 ring-brand-400/40' : 'opacity-60'}`}
            onClick={() => toggle(tweak.id)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: selected.has(tweak.id) ? 1 : 0.6, y: 0 }}
            transition={{ delay: 0.05 * i }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <CheckCircle2 className={`w-5 h-5 mt-0.5 ${selected.has(tweak.id) ? 'text-brand-500' : 'text-surface-4'}`} />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-text-primary">{tweak.name}</p>
                    <ImpactBadge impact={tweak.impact} />
                  </div>
                  <p className="text-xs text-text-muted mt-1">{tweak.desc}</p>
                  {selected.has(tweak.id) && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2">
                      <pre className="code-block text-xs">{tweak.cmd}</pre>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.button
        onClick={generate}
        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-500 text-white font-semibold text-sm hover:bg-brand-400 transition-colors"
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
      >
        <Download className="w-4 h-4" />
        Generar Script
      </motion.button>

      {script && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-text-secondary">Script generado:</p>
            <div className="flex gap-2">
              <CopyButton text={script} />
              <button
                onClick={() => downloadScript(script, 'aesthetics_redmi14c.sh')}
                className="text-xs text-brand-500 hover:text-brand-600 font-medium"
              >
                Descargar .sh
              </button>
            </div>
          </div>
          <pre className="code-block max-h-64 overflow-y-auto">{script}</pre>
        </motion.div>
      )}
    </div>
  );
}
