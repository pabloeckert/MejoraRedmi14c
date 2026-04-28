import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, CheckCircle2 } from 'lucide-react';
import { BLOATWARE } from '../data/device';
import { generateScript, downloadScript } from '../services/scriptGenerator';
import { AssistantGuide } from '../components/AssistantGuide';
import { RiskBadge, CopyButton } from '../components/ui';
import { useToastContext } from '../hooks/useToastContext';

export function DebloatModule() {
  const [profile, setProfile] = useState('safe');
  const [selected, setSelected] = useState(new Set(BLOATWARE.safe.map(p => p.pkg)));
  const [script, setScript] = useState('');
  const toast = useToastContext();

  const profiles = [
    { id: 'safe', name: 'Seguro', desc: 'Solo bloatware no esencial. Bajo riesgo.', ring: 'border-success/30 bg-success/5' },
    { id: 'balanced', name: 'Equilibrado', desc: 'Balance entre limpieza y funcionalidad.', ring: 'border-warning/30 bg-warning/5' },
    { id: 'aggressive', name: 'Agresivo', desc: 'Mínimo sistema. Alto riesgo.', ring: 'border-danger/30 bg-danger/5' },
  ];

  const switchProfile = (p) => {
    setProfile(p);
    setSelected(new Set(BLOATWARE[p].map(x => x.pkg)));
  };

  const togglePkg = (pkg) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(pkg)) next.delete(pkg);
      else next.add(pkg);
      return next;
    });
  };

  const generate = () => {
    const packages = BLOATWARE[profile].filter(p => selected.has(p.pkg));
    const s = generateScript([{ name: `Debloat (${profile})`, type: 'debloat', packages }]);
    setScript(s);
    toast?.success(`Script de debloat (${profile}) generado`);
  };

  return (
    <div className="space-y-4">
      <AssistantGuide module="debloat" />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-text-primary">Debloat — Eliminar Bloatware</h2>
          <p className="text-sm text-text-secondary mt-1 leading-relaxed">Seleccioná el perfil y personalizá qué eliminar</p>
        </div>
      </div>

      {/* Profile selector */}
      <div className="grid grid-cols-3 gap-2">
        {profiles.map((p) => (
          <motion.button
            key={p.id}
            onClick={() => switchProfile(p.id)}
            className={`glass rounded-xl p-3 text-left ${profile === p.id ? `border ${p.ring}` : ''}`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <p className="text-sm font-medium text-text-primary">{p.name}</p>
            <p className="text-xs text-text-muted mt-0.5">{p.desc}</p>
          </motion.button>
        ))}
      </div>

      {/* Package list */}
      <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
        {BLOATWARE[profile].map((pkg, i) => (
          <motion.div
            key={pkg.pkg}
            className={`glass rounded-lg p-3 cursor-pointer transition-all ${
              selected.has(pkg.pkg) ? 'ring-1 ring-brand-400/40' : 'opacity-60'
            }`}
            onClick={() => togglePkg(pkg.pkg)}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: selected.has(pkg.pkg) ? 1 : 0.6, x: 0 }}
            transition={{ delay: 0.02 * i }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2
                  className={`w-4 h-4 ${selected.has(pkg.pkg) ? 'text-brand-500' : 'text-surface-4'}`}
                />
                <div>
                  <p className="text-sm font-medium text-text-primary">{pkg.name}</p>
                  <p className="text-xs text-text-muted">{pkg.pkg}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <RiskBadge risk={pkg.risk} />
              </div>
            </div>
            <p className="text-xs text-text-muted mt-1 ml-7">{pkg.desc}</p>
          </motion.div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">
          {selected.size} paquetes seleccionados
        </p>
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
      </div>

      {script && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-text-secondary">Script generado:</p>
            <div className="flex gap-2">
              <CopyButton text={script} />
              <button
                onClick={() => downloadScript(script, `debloat_${profile}_redmi14c.sh`)}
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
