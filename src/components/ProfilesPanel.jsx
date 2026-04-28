import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark, Download, Upload, Trash2, Plus } from 'lucide-react';
import { useProfiles } from '../hooks/useHistory';
import { useToastContext } from '../hooks/useToastContext';

export function ProfilesPanel({ currentConfig }) {
  const { profiles, saveProfile, deleteProfile, exportProfile, importProfile } = useProfiles();
  const toast = useToastContext();
  const [showSave, setShowSave] = useState(false);
  const [profileName, setProfileName] = useState('');

  const handleSave = () => {
    if (profileName.trim()) {
      saveProfile(profileName.trim(), currentConfig);
      toast?.success(`Perfil "${profileName.trim()}" guardado`);
      setProfileName('');
      setShowSave(false);
    }
  };

  const handleImport = async () => {
    const data = await importProfile();
    if (data) {
      toast?.success(`Perfil "${data.name}" importado`);
    } else {
      toast?.error('No se pudo importar el perfil');
    }
  };

  const profileNames = Object.keys(profiles);

  return (
    <motion.div
      className="glass-strong rounded-2xl p-6 mt-4"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bookmark className="w-4 h-4 text-text-muted" />
          <span className="text-sm font-semibold text-text-primary">
            Perfiles guardados ({profileNames.length})
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleImport}
            className="p-1.5 rounded hover:bg-surface-2 transition-colors"
            title="Importar perfil"
            aria-label="Importar perfil"
          >
            <Upload className="w-4 h-4 text-text-muted" />
          </button>
          <button
            onClick={() => setShowSave(!showSave)}
            className="p-1.5 rounded hover:bg-surface-2 transition-colors"
            title="Guardar perfil actual"
            aria-label="Guardar perfil actual"
          >
            <Plus className="w-4 h-4 text-text-muted" />
          </button>
        </div>
      </div>

      {/* Save form */}
      <AnimatePresence>
        {showSave && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="Nombre del perfil"
                className="flex-1 bg-surface-1 border border-surface-3 rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-500"
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                autoFocus
              />
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-semibold hover:bg-brand-400 transition-colors"
              >
                Guardar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile list */}
      {profileNames.length > 0 ? (
        <div className="space-y-2">
          {profileNames.map((name) => (
            <div
              key={name}
              className="flex items-center justify-between p-3 rounded-lg bg-surface-1 border border-glass-border"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">{name}</p>
                <p className="text-xs text-text-muted">
                  {profiles[name].savedAt && new Date(profiles[name].savedAt).toLocaleDateString('es-AR')}
                </p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => exportProfile(name)}
                  className="p-1.5 rounded hover:bg-surface-2 transition-colors"
                  title="Exportar"
                  aria-label={`Exportar perfil ${name}`}
                >
                  <Download className="w-3.5 h-3.5 text-text-muted" />
                </button>
                <button
                  onClick={() => {
                    deleteProfile(name);
                    toast?.info(`Perfil "${name}" eliminado`);
                  }}
                  className="p-1.5 rounded hover:bg-surface-2 transition-colors"
                  title="Eliminar"
                  aria-label={`Eliminar perfil ${name}`}
                >
                  <Trash2 className="w-3.5 h-3.5 text-text-muted" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-text-muted text-center py-4">
          No hay perfiles guardados. Guardá tu configuración actual con el botón +.
        </p>
      )}
    </motion.div>
  );
}
