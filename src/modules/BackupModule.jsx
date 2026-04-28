import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, CheckCircle2, Users, MessageCircle, Camera, FileText, Package, HardDrive, Info } from 'lucide-react';
import { BACKUP_TARGETS } from '../data/device';
import { generateScript, downloadScript } from '../services/scriptGenerator';
import { AssistantGuide } from '../components/AssistantGuide';
import { CopyButton } from '../components/ui';
import { useToastContext } from '../hooks/useToastContext';

const TARGET_ICONS = {
  contacts: Users,
  whatsapp: MessageCircle,
  dcim: Camera,
  downloads: Download,
  documents: FileText,
  apks: Package,
  'system-info': Info,
};

const TARGET_COLORS = {
  contacts:  { bg: 'bg-blue-50', icon: 'text-blue-500', ring: 'ring-blue-400', darkBg: 'dark:bg-blue-950/30' },
  whatsapp:  { bg: 'bg-green-50', icon: 'text-green-500', ring: 'ring-green-400', darkBg: 'dark:bg-green-950/30' },
  dcim:      { bg: 'bg-purple-50', icon: 'text-purple-500', ring: 'ring-purple-400', darkBg: 'dark:bg-purple-950/30' },
  downloads: { bg: 'bg-amber-50', icon: 'text-amber-500', ring: 'ring-amber-400', darkBg: 'dark:bg-amber-950/30' },
  documents: { bg: 'bg-sky-50', icon: 'text-sky-500', ring: 'ring-sky-400', darkBg: 'dark:bg-sky-950/30' },
  apks:      { bg: 'bg-orange-50', icon: 'text-orange-500', ring: 'ring-orange-400', darkBg: 'dark:bg-orange-950/30' },
  'system-info': { bg: 'bg-slate-50', icon: 'text-slate-500', ring: 'ring-slate-400', darkBg: 'dark:bg-slate-900/30' },
};

export function BackupModule() {
  const [selected, setSelected] = useState(BACKUP_TARGETS.map(t => t.id));
  const [script, setScript] = useState('');
  const toast = useToastContext();

  const toggle = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const selectAll = () => setSelected(BACKUP_TARGETS.map(t => t.id));
  const deselectAll = () => setSelected([]);

  const generate = () => {
    const targets = BACKUP_TARGETS.filter(t => selected.includes(t.id));
    const s = generateScript([{ name: 'Backup Completo', type: 'backup', targets }]);
    setScript(s);
    toast?.success('Script de backup generado');
  };

  return (
    <div className="space-y-5">
      <AssistantGuide module="backup" />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-text-primary">Backup Completo a PC</h2>
          <p className="text-sm text-text-secondary mt-1">Seleccioná qué respaldar antes de hacer cualquier cambio</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold border border-blue-200 dark:bg-blue-950/40 dark:border-blue-800/40 dark:text-blue-400">
            FASE 1 — Obligatorio
          </span>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex gap-2">
        <button
          onClick={selectAll}
          className="text-xs font-medium text-brand-500 hover:text-brand-600 px-3 py-1.5 rounded-lg hover:bg-brand-500/5 transition-colors"
        >
          Seleccionar todo
        </button>
        <button
          onClick={deselectAll}
          className="text-xs font-medium text-text-muted hover:text-text-secondary px-3 py-1.5 rounded-lg hover:bg-surface-2 transition-colors"
        >
          Deseleccionar todo
        </button>
        <span className="text-xs text-text-muted px-2 py-1.5">
          {selected.length} de {BACKUP_TARGETS.length} seleccionados
        </span>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {BACKUP_TARGETS.map((target, i) => {
          const isSelected = selected.includes(target.id);
          const Icon = TARGET_ICONS[target.id] || HardDrive;
          const colors = TARGET_COLORS[target.id] || TARGET_COLORS['system-info'];

          return (
            <motion.button
              key={target.id}
              onClick={() => toggle(target.id)}
              className={`relative flex items-start gap-4 p-4 rounded-xl border text-left transition-all ${
                isSelected
                  ? `${colors.bg} ${colors.darkBg} border-${colors.ring}/40 shadow-md ring-1 ring-${colors.ring}/20`
                  : 'bg-surface-1 border-glass-border opacity-60 hover:opacity-80'
              }`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: isSelected ? 1 : 0.6, x: 0 }}
              transition={{ delay: 0.03 * i }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              {/* Icon */}
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                isSelected ? `${colors.bg} ${colors.darkBg}` : 'bg-surface-2'
              }`}>
                <Icon className={`w-5 h-5 ${isSelected ? colors.icon : 'text-text-muted'}`} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-text-primary">{target.name}</p>
                </div>
                <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{target.desc}</p>
              </div>

              {/* Check */}
              <CheckCircle2 className={`w-5 h-5 flex-shrink-0 mt-0.5 transition-colors ${
                isSelected ? 'text-brand-500' : 'text-surface-4'
              }`} />
            </motion.button>
          );
        })}
      </div>

      {/* Generate button */}
      <div className="flex items-center justify-between pt-2">
        <p className="text-sm text-text-secondary">
          {selected.length} items para respaldar
        </p>
        <motion.button
          onClick={generate}
          disabled={selected.length === 0}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-500 text-white font-semibold text-sm hover:bg-brand-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-brand-500/20"
          whileHover={{ scale: selected.length > 0 ? 1.03 : 1 }}
          whileTap={{ scale: 0.97 }}
        >
          <Download className="w-4 h-4" />
          Generar Script
        </motion.button>
      </div>

      {/* Script output */}
      {script && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="rounded-xl border border-glass-border bg-surface-1 p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-text-primary">Script generado</p>
            <div className="flex gap-2">
              <CopyButton text={script} />
              <button
                onClick={() => downloadScript(script, 'backup_redmi14c.sh')}
                className="text-xs font-semibold text-brand-500 hover:text-brand-600 px-3 py-1.5 rounded-lg hover:bg-brand-500/5 transition-colors"
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
