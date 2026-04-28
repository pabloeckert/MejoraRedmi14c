import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download } from 'lucide-react';
import { DEVICE } from '../data/device';
import { downloadScript } from '../services/scriptGenerator';
import { AssistantGuide } from '../components/AssistantGuide';
import { GlassCard, Badge, CopyButton } from '../components/ui';

export function RescueModule() {
  const [packageName, setPackageName] = useState('');
  const [restoreCmd, setRestoreCmd] = useState('');

  const quickFixes = [
    {
      name: 'Restaurar Wallpapers',
      desc: 'Si los fondos de pantalla dejaron de funcionar',
      cmd: `adb shell pm install-existing --user 0 com.android.wallpaper.livepicker\nadb shell pm install-existing --user 0 com.android.wallpapercropper\nadb shell pm install-existing --user 0 com.miui.miwallpaper`,
    },
    {
      name: 'Restaurar Bluetooth',
      desc: 'Si el Bluetooth dejó de funcionar',
      cmd: `adb shell pm install-existing --user 0 com.miui.miservice\nadb shell pm install-existing --user 0 com.xiaomi.bluetooth`,
    },
    {
      name: 'Restaurar OTA Updates',
      desc: 'Si las actualizaciones OTA dejaron de funcionar',
      cmd: `adb shell pm install-existing --user 0 com.xiaomi.xmsf\nadb shell pm install-existing --user 0 com.xiaomi.xmsfkeeper\nadb shell pm install-existing --user 0 com.miui.cloudservice\nadb shell pm install-existing --user 0 com.miui.cloudservice.sysbase\nadb shell pm install-existing --user 0 com.xiaomi.micloud.sdk\nadb shell pm install-existing --user 0 com.miui.daemon\nadb shell pm install-existing --user 0 com.xiaomi.simactivate.service`,
    },
    {
      name: 'Restaurar Android Auto',
      desc: 'Si Android Auto dejó de funcionar',
      cmd: `adb shell pm install-existing --user 0 com.google.android.projection.gearhead`,
    },
    {
      name: 'Restaurar TODAS las apps desactivadas',
      desc: 'Reinstala todo lo que fue desinstalado con pm uninstall',
      cmd: `for pkg in $(adb shell pm list packages -d | sed 's/package://'); do\n  echo "Restaurando: $pkg"\n  adb shell pm install-existing --user 0 "$pkg"\ndone`,
    },
    {
      name: 'Restaurar Animaciones',
      desc: 'Vuelve las animaciones a su valor por defecto',
      cmd: `adb shell settings put global window_animation_scale 1.0\nadb shell settings put global transition_animation_scale 1.0\nadb shell settings put global animator_duration_scale 1.0`,
    },
    {
      name: 'Restaurar RAM Virtual',
      desc: 'Reactiva la expansión de RAM',
      cmd: `adb shell settings put global ram_expand_size 4096`,
    },
    {
      name: 'Restaurar Configuraciones de Sistema',
      desc: 'Revierte todos los tweaks de settings',
      cmd: `adb shell settings put global force_gpu_rendering 0\nadb shell settings put global background_process_limit -1\nadb shell settings put secure long_press_timeout 400\nadb shell settings put global wifi_scan_always_enabled 1\nadb shell settings put global ble_scan_always_enabled 1\nadb shell settings put global private_dns_mode opportunistic\nadb shell wm density reset`,
    },
  ];

  const restoreSingle = () => {
    if (packageName.trim()) {
      setRestoreCmd(`adb shell pm install-existing --user 0 ${packageName.trim()}`);
    }
  };

  return (
    <div className="space-y-4">
      <AssistantGuide module="rescue" />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-text-primary">Rescate — Restaurar y Reparar</h2>
          <p className="text-sm text-text-secondary mt-1 leading-relaxed">Restaura apps eliminadas y revierte configuraciones</p>
        </div>
        <Badge variant="danger">Emergencia</Badge>
      </div>

      {/* Single app restore */}
      <GlassCard>
        <p className="text-sm font-medium mb-2 text-text-primary">Restaurar app específica</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={packageName}
            onChange={(e) => setPackageName(e.target.value)}
            placeholder="com.package.name"
            className="flex-1 bg-surface-1 border border-surface-3 rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <motion.button
            onClick={restoreSingle}
            className="px-5 py-2.5 rounded-lg bg-brand-500 text-white text-sm font-semibold hover:bg-brand-400 transition-colors"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            Restaurar
          </motion.button>
        </div>
        {restoreCmd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-text-muted">Comando:</p>
              <CopyButton text={restoreCmd} />
            </div>
            <pre className="code-block text-xs">{restoreCmd}</pre>
          </motion.div>
        )}
      </GlassCard>

      {/* Quick fixes */}
      <p className="text-sm font-medium text-text-secondary">Fixes rápidos:</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {quickFixes.map((fix, i) => (
          <GlassCard key={i} className="relative group">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-sm font-medium text-text-primary">{fix.name}</p>
                <p className="text-xs text-text-muted">{fix.desc}</p>
              </div>
              <CopyButton text={fix.cmd} />
            </div>
            <pre className="code-block text-xs opacity-0 group-hover:opacity-100 transition-opacity max-h-20 overflow-y-auto">
              {fix.cmd}
            </pre>
          </GlassCard>
        ))}
      </div>

      {/* Full restore script */}
      <GlassCard>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-text-primary">Script de restauración completa</p>
            <p className="text-xs text-text-muted">Revierte todos los cambios realizados por los scripts de MejoraRedmi14c</p>
          </div>
          <motion.button
            onClick={() => {
              const s = `#!/bin/bash
# MejoraRedmi14c — Script de Restauración Completa
# Dispositivo: ${DEVICE.name}
# ⚠️ Esto revierte TODOS los cambios

echo "🔄 Restaurando ${DEVICE.name}..."

# Restaurar animaciones
echo "  ⏱️  Restaurando animaciones..."
adb shell settings put global window_animation_scale 1.0
adb shell settings put global transition_animation_scale 1.0
adb shell settings put global animator_duration_scale 1.0

# Restaurar configuraciones de sistema
echo "  ⚙️  Restaurando configuraciones..."
adb shell settings put global force_gpu_rendering 0
adb shell settings put global ram_expand_size 4096
adb shell settings put global background_process_limit -1
adb shell settings put secure long_press_timeout 400
adb shell settings put global wifi_scan_always_enabled 1
adb shell settings put global ble_scan_always_enabled 1
adb shell settings put global private_dns_mode opportunistic
adb shell settings put system background_blur_enable 0
adb shell settings put system peak_refresh_rate 60
adb shell settings put system min_refresh_rate 60
adb shell wm density reset

# Restaurar apps desinstaladas
echo "  📦 Restaurando apps desinstaladas..."
for pkg in $(adb shell pm list packages -d | sed 's/package://'); do
  echo "    Restaurando: $pkg"
  adb shell pm install-existing --user 0 "$pkg"
done

echo ""
echo "✅ Restauración completada."
echo "🔄 Reinicia el dispositivo: adb reboot"`;
              downloadScript(s, 'restore_redmi14c.sh');
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-danger/10 text-danger text-sm font-medium hover:bg-danger/20 transition-colors"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Download className="w-4 h-4" />
            Descargar Script de Restauración
          </motion.button>
        </div>
      </GlassCard>
    </div>
  );
}
