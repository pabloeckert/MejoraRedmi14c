/**
 * ADB Scripts - Scripts de optimización de alto nivel
 * Paquetes de bloatware conocidos por fabricante
 */

// ─── Bloatware Xiaomi / Redmi / POCO ──────────────────
const XIAOMI_BLOATWARE = [
  // Analytics & Tracking
  'com.miui.analytics',
  'com.xiaomi.account',
  'com.miui.msa.global',
  'com.miui.ad',
  'com.miui.daemon',

  // Apps preinstaladas innecesarias
  'com.miui.weather2',
  'com.miui.player',
  'com.miui.video',
  'com.miui.notes',
  'com.miui.calculator',
  'com.miui.compass',
  'com.miui.fm',
  'com.miui.mishare',
  'com.miui.miwallpaper',
  'com.miui.gallery',
  'com.miui.cleanmaster',
  'com.miui.securitycenter',
  'com.miui.bugreport',
  'com.miui.qrscanner',

  // Google bloatware (lo esencial se mantiene)
  'com.google.android.music',
  'com.google.android.videos',
  'com.google.android.youtube',  // Se puede reinstalar si se necesita
  'com.google.android.googlequicksearchbox',
  'com.google.android.apps.googleassistant',
  'com.google.android.apps.docs',
  'com.google.android.apps.photos',
  'com.google.ar.lens',
  'com.google.android.apps.turbo',

  // Facebook preinstalado
  'com.facebook.katana',
  'com.facebook.system',
  'com.facebook.appmanager',
  'com.facebook.services',

  // Otros comunes
  'com.amazon.appmanager',
  'com.netflix.partner.activation',
  'com.booking',
  'com.tripadvisor.tripadvisor',
  'com.agoda.mobile.consumer',
];

// ─── Servicios en background a desactivar ──────────────
const BACKGROUND_SERVICES_TO_DISABLE = [
  'development_settings_enabled',
  'adb_enabled',               // Se reactiva al reconectar
  'install_non_market_apps',
  'auto_time',                 // Ahorra batería si no se necesita
  'wifi_scan_always_enabled',
  'bluetooth_scan_always_enabled',
  'nfc_on',
  'location_mode',             // Se reactiva por app si se necesita
  'hotspot_enabled',
];

// ─── Servicios de MIUI a deshabilitar ──────────────────
const MIUI_SERVICES_TO_DISABLE = [
  'com.miui.analytics/.service.AnalyticsService',
  'com.miui.daemon/.service.MiuiDaemonService',
  'com.xiaomi.finddevice/.service.FindDeviceService',
  'com.miui.msa/.service.MSAService',
];

// ─── Ajustes de rendimiento ────────────────────────────
const PERFORMANCE_SETTINGS = {
  // Escalas de animación (0 = sin animación)
  'window_animation_scale': '0',
  'transition_animation_scale': '0',
  'animator_duration_scale': '0',

  // GPU
  'force_gpu_rendering': '1',
  'force_gpu_rendering_for_all': '1',

  // Background limits
  'background_limit': '2',  // máximo 2 procesos en background

  // Display
  'screen_off_timeout': '60000',  // 1 minuto

  // Network
  'wifi_suspend_optimizations_enabled': '1',

  // Audio
  'audio_safe_volume_state': '1',

  // Input
  'pointer_speed': '7',
};

// ─── Modo Xiaomi 17 Ultra ──────────────────────────────
const ULTRA_MODE_SETTINGS = {
  // Rendering
  'debug.hwui.renderer': 'skiagl',
  'debug.hwui.use_gpu_pixel_buffers': 'true',
  'debug.hwui.fbo_cache_size': '48',

  // Memory
  'config_activity_manager_constants': 'max_cached_processes=16,background_settle_time=60000,fgservice_start_timeout=10000,proctolimit_explicit=4,proctolimit_cached=8',

  // Touch responsiveness
  'debug.touch.resampling': 'true',

  // Network optimization
  'net.dns1': '1.1.1.1',
  'net.dns2': '1.0.0.1',

  // Battery optimization (paradójico pero eficiente)
  'battery_saver_constants': 'vibrate_input_disabled=true,soundtrigger_off=false,advertise_is_enabled=false,animation_disabled=true',
};

/**
 * Genera el script completo de bloatware removal
 */
function generateBloatwareRemovalScript(deviceId) {
  const commands = [];
  for (const pkg of XIAOMI_BLOATWARE) {
    commands.push({
      action: 'uninstall',
      package: pkg,
      command: `pm uninstall -k --user 0 ${pkg}`,
    });
  }
  return commands;
}

/**
 * Genera script de optimización de rendimiento
 */
function generatePerformanceScript() {
  const commands = [];
  for (const [key, value] of Object.entries(PERFORMANCE_SETTINGS)) {
    commands.push({
      action: 'settings',
      key,
      value,
      command: `settings put global ${key} ${value}`,
    });
  }
  return commands;
}

/**
 * Genera script del modo Ultra
 */
function generateUltraModeScript() {
  const commands = [];
  for (const [key, value] of Object.entries(ULTRA_MODE_SETTINGS)) {
    if (key.includes('.')) {
      commands.push({
        action: 'setprop',
        key,
        value,
        command: `setprop ${key} ${value}`,
      });
    } else {
      commands.push({
        action: 'settings',
        key,
        value,
        command: `settings put global ${key} ${value}`,
      });
    }
  }
  return commands;
}

/**
 * Genera script de limieza profunda de cache
 */
function generateDeepCleanScript() {
  return [
    { action: 'shell', command: 'rm -rf /data/local/tmp/*' },
    { action: 'shell', command: 'rm -rf /sdcard/DCIM/.thumbnails/*' },
    { action: 'shell', command: 'rm -rf /sdcard/DCIM/.thumbnails' },
    { action: 'shell', command: 'find /sdcard -name ".nomedia" -delete' },
    { action: 'shell', command: 'rm -rf /data/tombstones/*' },
    { action: 'shell', command: 'rm -rf /data/anr/*' },
    { action: 'shell', command: 'pm trim-caches 512M' },
  ];
}

module.exports = {
  XIAOMI_BLOATWARE,
  BACKGROUND_SERVICES_TO_DISABLE,
  MIUI_SERVICES_TO_DISABLE,
  PERFORMANCE_SETTINGS,
  ULTRA_MODE_SETTINGS,
  generateBloatwareRemovalScript,
  generatePerformanceScript,
  generateUltraModeScript,
  generateDeepCleanScript,
};
