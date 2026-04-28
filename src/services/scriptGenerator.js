import { DEVICE } from '../data/device';

/**
 * Script Generator Service
 * Genera scripts bash ejecutables para optimizar el Redmi 14C vía ADB.
 * Separado de device.js para facilitar testing y reutilización.
 */

// Validate module structure
function validateModule(mod) {
  if (!mod.name || !mod.type) {
    throw new Error(`Módulo inválido: falta nombre o tipo`);
  }
  const validTypes = ['backup', 'debloat', 'tweak'];
  if (!validTypes.includes(mod.type)) {
    throw new Error(`Tipo de módulo inválido: "${mod.type}". Válidos: ${validTypes.join(', ')}`);
  }
  if (mod.type === 'backup' && (!mod.targets || mod.targets.length === 0)) {
    throw new Error(`Módulo backup requiere targets`);
  }
  if (mod.type === 'debloat' && (!mod.packages || mod.packages.length === 0)) {
    throw new Error(`Módulo debloat requiere packages`);
  }
  if (mod.type === 'tweak' && (!mod.tweaks || mod.tweaks.length === 0)) {
    throw new Error(`Módulo tweak requiere tweaks`);
  }
  return true;
}

// Generate header lines
function generateHeader() {
  return [
    '#!/bin/bash',
    `# MejoraRedmi14c — Script generado automáticamente`,
    `# Dispositivo: ${DEVICE.name} (${DEVICE.codename})`,
    `# RAM: ${DEVICE.ram.physical}GB (expandible a ${DEVICE.ram.maxExpand}GB) | Almacenamiento: ${DEVICE.storage.total}GB`,
    `# Fecha: ${new Date().toISOString()}`,
    '#',
    '# ⚠️ USO BAJO TU PROPIO RIESGO',
    '# Asegúrate de tener ADB instalado y el dispositivo conectado',
    '',
    'set -e',
    '',
    '# Verificar conexión ADB',
    'if ! adb devices | grep -q "device$"; then',
    '  echo "❌ No se detectó dispositivo. Verifica USB Debugging."',
    '  exit 1',
    'fi',
    '',
    `echo "📱 Dispositivo detectado: $(adb shell getprop ro.product.model)"`,
    '',
  ];
}

// Generate backup section
function generateBackupSection(mod, deviceName) {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const lines = [];
  lines.push(`BACKUP_DIR="./${deviceName}_Backup_${date}"`);
  lines.push(`mkdir -p "$BACKUP_DIR"`);
  for (const target of mod.targets) {
    lines.push(`echo "  📦 ${target.name}..."`);
    lines.push(target.cmd);
  }
  return lines;
}

// Generate debloat section
function generateDebloatSection(mod) {
  const lines = [];
  for (const pkg of mod.packages) {
    lines.push(`echo "  🗑️  ${pkg.name} (${pkg.pkg})"`);
    lines.push(`adb shell pm uninstall -k --user 0 ${pkg.pkg} || echo "  ⚠️  ${pkg.pkg} no se pudo desinstalar"`);
  }
  return lines;
}

// Generate tweak section
function generateTweakSection(mod) {
  const lines = [];
  for (const tweak of mod.tweaks) {
    lines.push(`echo "  ⚡ ${tweak.name}"`);
    lines.push(tweak.cmd);
  }
  return lines;
}

/**
 * Generate a bash script from selected modules
 * @param {Array} modules - Array of module objects with { name, type, targets|packages|tweaks }
 * @param {string} deviceName - Device name for backup directory
 * @returns {string} Bash script content
 */
export function generateScript(modules, deviceName = 'Redmi14C') {
  if (!modules || !Array.isArray(modules) || modules.length === 0) {
    throw new Error('Se requiere al menos un módulo');
  }

  // Validate all modules
  modules.forEach(validateModule);

  // Filter out empty modules
  const validModules = modules.filter(mod => {
    if (mod.type === 'backup') return mod.targets && mod.targets.length > 0;
    if (mod.type === 'debloat') return mod.packages && mod.packages.length > 0;
    if (mod.type === 'tweak') return mod.tweaks && mod.tweaks.length > 0;
    return false;
  });

  if (validModules.length === 0) {
    throw new Error('Ningún módulo tiene contenido seleccionado');
  }

  const lines = generateHeader(deviceName);

  for (const mod of validModules) {
    lines.push(`# ${'='.repeat(50)}`);
    lines.push(`# ${mod.name}`);
    lines.push(`# ${'='.repeat(50)}`);
    lines.push(`echo ""`);
    lines.push(`echo "🔄 ${mod.name}..."`);

    if (mod.type === 'backup') {
      lines.push(...generateBackupSection(mod, deviceName));
    } else if (mod.type === 'debloat') {
      lines.push(...generateDebloatSection(mod));
    } else if (mod.type === 'tweak') {
      lines.push(...generateTweakSection(mod));
    }

    lines.push('');
  }

  lines.push('echo ""');
  lines.push('echo "✅ Script completado."');
  lines.push('echo "🔄 Reinicia el dispositivo para aplicar todos los cambios: adb reboot"');

  return lines.join('\n');
}

/**
 * Generate a full restore script
 * @returns {string} Bash script content for full restoration
 */
export function generateRestoreScript() {
  return `#!/bin/bash
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
}

/**
 * Download a script as a .sh file
 * @param {string} content - Script content
 * @param {string} filename - Filename (default: timestamp-based)
 */
export function downloadScript(content, filename) {
  const blob = new Blob([content], { type: 'text/x-shellscript' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `mejora_redmi14c_${Date.now()}.sh`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>}
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    return true;
  }
}
