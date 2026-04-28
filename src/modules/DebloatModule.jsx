import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, CheckCircle2, Shield, ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react';
import { BLOATWARE } from '../data/device';
import { generateScript, downloadScript } from '../services/scriptGenerator';
import { AssistantGuide } from '../components/AssistantGuide';
import { RiskBadge, CopyButton } from '../components/ui';
import { useToastContext } from '../hooks/useToastContext';

const PROFILES = [
  { id: 'safe', name: 'Seguro', desc: 'Solo bloatware no esencial', icon: ShieldCheck, color: 'emerald' },
  { id: 'balanced', name: 'Equilibrado', desc: 'Balance limpieza/funcionalidad', icon: Shield, color: 'amber' },
  { id: 'aggressive', name: 'Agresivo', desc: 'Mínimo sistema. Alto riesgo', icon: ShieldAlert, color: 'rose' },
];

const PROFILE_STYLES = {
  safe:      { bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-700', icon: 'text-emerald-500', darkBg: 'dark:bg-emerald-950/30', darkBorder: 'dark:border-emerald-700/40' },
  balanced:  { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-700', icon: 'text-amber-500', darkBg: 'dark:bg-amber-950/30', darkBorder: 'dark:border-amber-700/40' },
  aggressive:{ bg: 'bg-rose-50', border: 'border-rose-300', text: 'text-rose-700', icon: 'text-rose-500', darkBg: 'dark:bg-rose-950/30', darkBorder: 'dark:border-rose-700/40' },
};

export function DebloatModule() {
  const [profile, setProfile] = useState('safe');
  const [selected, setSelected] = useState(new Set(BLOATWARE.safe.map(p => p.pkg)));
  const [script, setScript] = useState('');
  const toast = useToastContext();

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

  const currentProfile = PROFILES.find(p => p.id === profile);
  const ps = PROFILE_STYLES[profile];

  return (
    <div className="space-y-5">
      <AssistantGuide module="debloat" />

      <div>
        <h2 className="text-xl font-bold text-text-primary">Debloat — Eliminar Bloatware</h2>
        <p className="text-sm text-text-secondary mt-1">Elegí un perfil y personalizá qué eliminar</p>
      </div>

      {/* Profile selector — cards */}
      <div className="grid grid-cols-3 gap-3">
        {PROFILES.map((p) => {
          const isActive = profile === p.id;
          const s = PROFILE_STYLES[p.id];
          return (
            <motion.button
              key={p.id}
              onClick={() => switchProfile(p.id)}
              className={`relative p-4 rounded-xl border text-left transition-all ${
                isActive
                  ? `${s.bg} ${s.darkBg} ${s.border} ${s.darkBorder} shadow-md`
                  : 'bg-surface-1 border-glass-border hover:shadow-md'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <p.icon className={`w-5 h-5 mb-2 ${isActive ? s.icon : 'text-text-muted'}`} />
              <p className={`text-sm font-semibold ${isActive ? s.text : 'text-text-primary'}`}>{p.name}</p>
              <p className={`text-xs mt-0.5 ${isActive ? 'opacity-70' : 'text-text-muted'}`}>{p.desc}</p>
            </motion.button>
          );
        })}
      </div>

      {/* Warning for aggressive */}
      {profile === 'aggressive' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="flex items-start gap-3 p-4 rounded-xl bg-rose-50 border border-rose-200 dark:bg-rose-950/20 dark:border-rose-800/30"
        >
          <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-rose-700 dark:text-rose-400">Perfil agresivo</p>
            <p className="text-xs text-rose-600/80 dark:text-rose-400/70 mt-0.5">
              Incluye paquetes críticos como Google Play Services. Solo usalo si sabés lo que hacés.
            </p>
          </div>
        </motion.div>
      )}

      {/* Package list */}
      <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
        {BLOATWARE[profile].map((pkg, i) => {
          const isSelected = selected.has(pkg.pkg);
          return (
            <motion.button
              key={pkg.pkg}
              onClick={() => togglePkg(pkg.pkg)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'bg-surface-1 border-brand-400/30 shadow-sm'
                  : 'bg-surface-0 border-glass-border opacity-50 hover:opacity-70'
              }`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: isSelected ? 1 : 0.5, x: 0 }}
              transition={{ delay: 0.015 * i }}
            >
              <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-brand-500' : 'text-surface-4'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary">{pkg.name}</p>
                <p className="text-xs text-text-muted truncate">{pkg.pkg}</p>
              </div>
              <RiskBadge risk={pkg.risk} />
            </motion.button>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <p className="text-sm text-text-secondary">
          {selected.size} paquetes seleccionados
        </p>
        <motion.button
          onClick={generate}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-500 text-white font-semibold text-sm hover:bg-brand-600 transition-colors shadow-lg shadow-brand-500/20"
          whileHover={{ scale: 1.03 }}
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
                onClick={() => downloadScript(script, `debloat_${profile}_redmi14c.sh`)}
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
