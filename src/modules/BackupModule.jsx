import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, CheckCircle2 } from 'lucide-react';
import { BACKUP_TARGETS } from '../data/device';
import { generateScript, downloadScript } from '../services/scriptGenerator';
import { AssistantGuide } from '../components/AssistantGuide';
import { GlassCard, Badge, CopyButton } from '../components/ui';
import { useToastContext } from '../hooks/useToastContext';

export function BackupModule() {
  const [selected, setSelected] = useState(BACKUP_TARGETS.map(t => t.id));
  const [script, setScript] = useState('');
  const toast = useToastContext();

  const toggle = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const generate = () => {
    const targets = BACKUP_TARGETS.filter(t => selected.includes(t.id));
    const s = generateScript([{ name: 'Backup Completo', type: 'backup', targets }]);
    setScript(s);
    toast?.success('Script de backup generado');
  };

  return (
    <div className="space-y-4">
      <AssistantGuide module="backup" />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-text-primary">Backup Completo a PC</h2>
          <p className="text-sm text-text-secondary mt-1 leading-relaxed">Seleccioná qué respaldar antes de hacer cualquier cambio</p>
        </div>
        <Badge variant="info">FASE 1 — Obligatorio</Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {BACKUP_TARGETS.map((target) => (
          <GlassCard
            key={target.id}
            className={selected.includes(target.id) ? 'ring-1 ring-brand-400/50' : ''}
            hover
            onClick={() => toggle(target.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2
                  className={`w-5 h-5 ${selected.includes(target.id) ? 'text-brand-500' : 'text-surface-4'}`}
                />
                <div>
                  <p className="text-sm font-medium text-text-primary">{target.name}</p>
                  <p className="text-xs text-text-muted">{target.desc}</p>
                </div>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="flex gap-3">
        <motion.button
          onClick={generate}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-500 text-white font-semibold text-sm hover:bg-brand-400 transition-colors"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <Download className="w-4 h-4" />
          Generar Script
        </motion.button>
      </div>

      {script && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-text-secondary">Script generado:</p>
            <div className="flex gap-2">
              <CopyButton text={script} />
              <button
                onClick={() => downloadScript(script, 'backup_redmi14c.sh')}
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
