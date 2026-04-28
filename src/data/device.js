// Device-specific constants for Redmi 14C
// Codename: airflow (MT6768 / Helio G81 Ultra)

export const DEVICE = {
  name: 'Redmi 14C',
  codename: 'airflow',
  model: '2409BRN2CA',
  soc: 'MediaTek Helio G81 Ultra',
  cpu: {
    cores: 8,
    big: { count: 2, maxFreq: '2.0 GHz', arch: 'Cortex-A75' },
    little: { count: 6, maxFreq: '1.8 GHz', arch: 'Cortex-A55' },
    governor: {
      default: 'schedutil',
      performance: 'performance',
      recommended: 'schedutil',
    },
  },
  ram: {
    physical: 4, // GB
    expandable: true,
    maxExpand: 8, // GB via virtual RAM
    recommendedExpand: 0, // Disable for performance
  },
  storage: {
    total: 256, // GB
    type: 'eMMC 5.1', // Not UFS
    readAhead: 256, // KB recommended
  },
  display: {
    size: '6.88"',
    resolution: '720 x 1640',
    refreshRate: 90, // Hz
    touchSampling: 180, // Hz
    type: 'IPS LCD',
  },
  battery: {
    capacity: 5160, // mAh
    charging: 18, // W
  },
  os: 'HyperOS 1.x (Android 14)',
  bootloader: 'Lockable',
  rootMethod: 'Magisk (via boot.img patch)',
};

// Bloatware packages specific to Redmi 14C / HyperOS
export const BLOATWARE = {
  safe: [
    { pkg: 'com.miui.analytics', name: 'MIUI Analytics', risk: 'low', desc: 'Telemetría y analíticas de uso' },
    { pkg: 'com.miui.msa.global', name: 'MSA (Ads)', risk: 'low', desc: 'Servicio de anuncios de Xiaomi' },
    { pkg: 'com.xiaomi.payment', name: 'Mi Payment', risk: 'low', desc: 'Sistema de pagos Xiaomi (no disponible globalmente)' },
    { pkg: 'com.xiaomi.shop', name: 'Mi Store', risk: 'low', desc: 'Tienda de Xiaomi' },
    { pkg: 'com.miui.videoplayer', name: 'Mi Video', risk: 'low', desc: 'Reproductor de video Xiaomi' },
    { pkg: 'com.miui.player', name: 'Mi Music', risk: 'low', desc: 'Reproductor de música Xiaomi' },
    { pkg: 'com.miui.weather2', name: 'Mi Weather', risk: 'low', desc: 'Aplicación del clima Xiaomi' },
    { pkg: 'com.miui.notes', name: 'Mi Notes', risk: 'low', desc: 'Notas de Xiaomi' },
    { pkg: 'com.miui.compass', name: 'Mi Compass', risk: 'low', desc: 'Brújula de Xiaomi' },
    { pkg: 'com.miui.calculator', name: 'Mi Calculator', risk: 'low', desc: 'Calculadora de Xiaomi' },
    { pkg: 'com.miui.cleanmaster', name: 'Clean Master', risk: 'low', desc: 'Limpiador de Xiaomi' },
    { pkg: 'com.miui.guardprovider', name: 'Guard Provider', risk: 'low', desc: 'Proveedor de seguridad Xiaomi' },
    { pkg: 'com.xiaomi.midrop', name: 'Mi Drop', risk: 'low', desc: 'Transferencia de archivos Xiaomi' },
    { pkg: 'com.xiaomi.finddevice', name: 'Find Device', risk: 'low', desc: 'Encontrar dispositivo Xiaomi' },
    { pkg: 'com.miui.mishare.connectivity', name: 'Mi Share', risk: 'low', desc: 'Compartición de archivos Xiaomi' },
    { pkg: 'com.miui.personalassistant', name: 'App Vault', risk: 'low', desc: 'Asistente personal / widgets' },
    { pkg: 'com.miui.gallery', name: 'Mi Gallery', risk: 'low', desc: 'Galería de fotos Xiaomi' },
    { pkg: 'com.miui.screenrecorder', name: 'Screen Recorder', risk: 'low', desc: 'Grabador de pantalla' },
    { pkg: 'com.miui.weather', name: 'Weather', risk: 'low', desc: 'Clima alternativo' },
    { pkg: 'com.xiaomi.scanner', name: 'Mi Scanner', risk: 'low', desc: 'Escáner QR de Xiaomi' },
    { pkg: 'com.google.android.youtube', name: 'YouTube', risk: 'low', desc: 'YouTube (reemplazable con Revanced/NewPipe)' },
    { pkg: 'com.google.android.music', name: 'Google Play Music', risk: 'low', desc: 'Música de Google (obsoleto)' },
    { pkg: 'com.google.android.videos', name: 'Google Play Movies', risk: 'low', desc: 'Películas de Google' },
    { pkg: 'com.google.android.apps.photos', name: 'Google Photos', risk: 'low', desc: 'Fotos de Google (opcional)' },
    { pkg: 'com.google.android.apps.docs', name: 'Google Docs', risk: 'low', desc: 'Documentos de Google' },
    { pkg: 'com.google.android.apps.tachyon', name: 'Google Duo', risk: 'low', desc: 'Videollamadas Google (obsoleto)' },
    { pkg: 'com.google.android.googlequicksearchbox', name: 'Google App', risk: 'low', desc: 'Búsqueda Google / Discover' },
  ],
  balanced: [
    // All safe packages PLUS:
    { pkg: 'com.miui.home', name: 'MIUI Launcher', risk: 'medium', desc: 'Launcher de Xiaomi (necesita alternativa)' },
    { pkg: 'com.miui.securitycenter', name: 'Security Center', risk: 'medium', desc: 'Centro de seguridad Xiaomi' },
    { pkg: 'com.miui.securityadd', name: 'Security Add-on', risk: 'medium', desc: 'Complemento de seguridad' },
    { pkg: 'com.xiaomi.account', name: 'Mi Account', risk: 'medium', desc: 'Cuenta Xiaomi' },
    { pkg: 'com.miui.cloudservice', name: 'Mi Cloud', risk: 'medium', desc: 'Servicio en la nube Xiaomi' },
    { pkg: 'com.xiaomi.xmsf', name: 'XMSF', risk: 'medium', desc: 'Servicio de mensajes Xiaomi' },
    { pkg: 'com.xiaomi.xmsfkeeper', name: 'XMSF Keeper', risk: 'medium', desc: 'Keeper del servicio de mensajes' },
    { pkg: 'com.miui.daemon', name: 'MIUI Daemon', risk: 'medium', desc: 'Daemon de MIUI' },
    { pkg: 'com.miui.bugreport', name: 'Bug Report', risk: 'medium', desc: 'Reporte de errores Xiaomi' },
    { pkg: 'com.xiaomi.micloud.sdk', name: 'Mi Cloud SDK', risk: 'medium', desc: 'SDK de nube Xiaomi' },
    { pkg: 'com.miui.antispam', name: 'Anti-Spam', risk: 'medium', desc: 'Anti-spam de llamadas' },
    { pkg: 'com.miui.backup', name: 'Mi Backup', risk: 'medium', desc: 'Backup de Xiaomi' },
  ],
  aggressive: [
    // All balanced packages PLUS:
    { pkg: 'com.android.wallpaper.livepicker', name: 'Live Wallpaper Picker', risk: 'high', desc: 'Selector de fondos animados' },
    { pkg: 'com.android.wallpapercropper', name: 'Wallpaper Cropper', risk: 'high', desc: 'Recortador de fondos' },
    { pkg: 'com.miui.miwallpaper', name: 'Mi Wallpaper', risk: 'high', desc: 'Fondos de pantalla Xiaomi' },
    { pkg: 'com.miui.miservice', name: 'Mi Service', risk: 'high', desc: 'Servicio MIUI (puede afectar Bluetooth)' },
    { pkg: 'com.xiaomi.bluetooth', name: 'Xiaomi Bluetooth', risk: 'high', desc: 'Bluetooth Xiaomi (puede romper BT)' },
    { pkg: 'com.android.bluetooth', name: 'Android Bluetooth', risk: 'critical', desc: 'Bluetooth del sistema (NO eliminar)' },
    { pkg: 'com.google.android.gms', name: 'Google Play Services', risk: 'critical', desc: 'Servicios de Google (ROMPE todo)' },
    { pkg: 'com.android.vending', name: 'Google Play Store', risk: 'critical', desc: 'Tienda de Google (ROMPE instalaciones)' },
  ],
};

// Performance tweaks
export const TWEAKS = {
  performance: [
    {
      id: 'fixed-perf-mode',
      name: 'Modo Rendimiento Fijo',
      desc: 'Activa el modo de rendimiento fijo del sistema. Reduce lag pero aumenta consumo.',
      cmd: 'adb shell cmd power set-fixed-performance-mode-enabled true',
      revert: 'adb shell cmd power set-fixed-performance-mode-enabled false',
      risk: 'low',
      impact: 'high',
    },
    {
      id: 'anim-scale-05',
      name: 'Animaciones 0.5x',
      desc: 'Hace las animaciones 2x más rápidas. El teléfono se siente instantáneo.',
      cmd: `adb shell settings put global window_animation_scale 0.5
adb shell settings put global transition_animation_scale 0.5
adb shell settings put global animator_duration_scale 0.5`,
      revert: `adb shell settings put global window_animation_scale 1.0
adb shell settings put global transition_animation_scale 1.0
adb shell settings put global animator_duration_scale 1.0`,
      risk: 'none',
      impact: 'high',
    },
    {
      id: 'force-gpu',
      name: 'Renderizado GPU Forzado',
      desc: 'Fuerza el renderizado de UI por GPU. Mejora fluidez en interfaces complejas.',
      cmd: 'adb shell settings put global force_gpu_rendering 1',
      revert: 'adb shell settings put global force_gpu_rendering 0',
      risk: 'low',
      impact: 'medium',
    },
    {
      id: 'disable-ram-expand',
      name: 'Desactivar RAM Virtual',
      desc: 'La RAM virtual usa almacenamiento como RAM — es mucho más lento. Con 4GB físicos, es mejor desactivarla.',
      cmd: 'adb shell settings put global ram_expand_size 0',
      revert: 'adb shell settings put global ram_expand_size 4096',
      risk: 'low',
      impact: 'high',
    },
    {
      id: 'bg-process-limit',
      name: 'Limitar Procesos en Background',
      desc: 'Reduce el número de apps en segundo plano. Libera RAM para la app activa.',
      cmd: 'adb shell settings put global background_process_limit 4',
      revert: 'adb shell settings put global background_process_limit -1',
      risk: 'low',
      impact: 'medium',
    },
    {
      id: 'long-press-timeout',
      name: 'Long Press Rápido (200ms)',
      desc: 'Reduce el tiempo de pulsación larga de 400ms a 200ms. Respuesta táctil más inmediata.',
      cmd: 'adb shell settings put secure long_press_timeout 200',
      revert: 'adb shell settings put secure long_press_timeout 400',
      risk: 'none',
      impact: 'medium',
    },
    {
      id: 'disable-wifi-scan',
      name: 'Desactivar WiFi Scanning',
      desc: 'Desactiva el escaneo continuo de WiFi. Ahorra batería y reduce overhead.',
      cmd: 'adb shell settings put global wifi_scan_always_enabled 0',
      revert: 'adb shell settings put global wifi_scan_always_enabled 1',
      risk: 'low',
      impact: 'low',
    },
    {
      id: 'disable-ble-scan',
      name: 'Desactivar BLE Scanning',
      desc: 'Desactiva el escaneo continuo de Bluetooth Low Energy. Ahorra batería.',
      cmd: 'adb shell settings put global ble_scan_always_enabled 0',
      revert: 'adb shell settings put global ble_scan_always_enabled 1',
      risk: 'low',
      impact: 'low',
    },
    {
      id: 'private-dns',
      name: 'DNS Privado (Google)',
      desc: 'Configura DNS privado con dns.google. Más rápido y seguro.',
      cmd: `adb shell settings put global private_dns_mode hostname
adb shell settings put global private_dns_specifier dns.google`,
      revert: 'adb shell settings put global private_dns_mode opportunistic',
      risk: 'none',
      impact: 'low',
    },
    {
      id: 'trim-caches',
      name: 'Limpiar Cachés',
      desc: 'Limpia todas las cachés de apps. Libera espacio y puede mejorar rendimiento.',
      cmd: 'adb shell pm trim-caches 99999999999',
      revert: null,
      risk: 'none',
      impact: 'low',
    },
  ],
  aesthetics: [
    {
      id: 'blur-native',
      name: 'Blur Nativo (Glassmorphism)',
      desc: 'Activa el efecto blur nativo de HyperOS. Hace que la UI se vea premium.',
      cmd: 'adb shell settings put system deviceLevelList v:1,c:3,g:3',
      revert: 'adb shell settings put system deviceLevelList v:1,c:1,g:1',
      risk: 'none',
      impact: 'visual',
    },
    {
      id: 'blur-enable',
      name: 'Habilitar Background Blur',
      desc: 'Activa el blur de fondo en HyperOS. Elimina el overlay gris.',
      cmd: 'adb shell settings put system background_blur_enable 1',
      revert: 'adb shell settings put system background_blur_enable 0',
      risk: 'none',
      impact: 'visual',
    },
    {
      id: 'refresh-rate',
      name: 'Forzar 90Hz',
      desc: 'Fuerza el refresh rate máximo (90Hz). Más suave pero consume más batería.',
      cmd: `adb shell settings put system peak_refresh_rate 90
adb shell settings put system min_refresh_rate 90`,
      revert: `adb shell settings put system peak_refresh_rate 60
adb shell settings put system min_refresh_rate 60`,
      risk: 'low',
      impact: 'high',
    },
  ],
  kernel: [
    {
      id: 'cpu-governor',
      name: 'CPU Governor: Performance',
      desc: 'Mantiene la CPU a máxima frecuencia. Máximo rendimiento, más calor y batería.',
      cmd: 'echo "performance" > /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor',
      revert: 'echo "schedutil" > /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor',
      risk: 'medium',
      impact: 'high',
      requiresRoot: true,
    },
    {
      id: 'io-scheduler',
      name: 'I/O Scheduler: BFQ',
      desc: 'Cambia el scheduler de E/S a BFQ. Mejor para flash storage.',
      cmd: 'echo "bfq" > /sys/block/mmcblk0/queue/scheduler',
      revert: 'echo "cfq" > /sys/block/mmcblk0/queue/scheduler',
      risk: 'low',
      impact: 'medium',
      requiresRoot: true,
    },
    {
      id: 'swappiness',
      name: 'Reducir Swappiness',
      desc: 'Reduce el uso de swap. Más RAM real disponible.',
      cmd: 'echo 60 > /proc/sys/vm/swappiness',
      revert: 'echo 100 > /proc/sys/vm/swappiness',
      risk: 'low',
      impact: 'medium',
      requiresRoot: true,
    },
    {
      id: 'tcp-bbr',
      name: 'TCP BBR Congestion Control',
      desc: 'Algoritmo de congestión de Google. Mejor throughput de red.',
      cmd: 'echo "bbr" > /proc/sys/net/ipv4/tcp_congestion_control',
      revert: 'echo "cubic" > /proc/sys/net/ipv4/tcp_congestion_control',
      risk: 'none',
      impact: 'medium',
      requiresRoot: true,
    },
    {
      id: 'readahead',
      name: 'Read-Ahead Buffer (256KB)',
      desc: 'Aumenta el buffer de lectura secuencial. Mejora carga de archivos grandes.',
      cmd: 'echo 256 > /sys/block/mmcblk0/queue/read_ahead_kb',
      revert: 'echo 128 > /sys/block/mmcblk0/queue/read_ahead_kb',
      risk: 'none',
      impact: 'low',
      requiresRoot: true,
    },
  ],
};

// Backup targets
export const BACKUP_TARGETS = [
  {
    id: 'contacts',
    name: 'Contactos',
    icon: 'Users',
    desc: 'Lista de contactos del dispositivo',
    cmd: 'adb shell content query --uri content://com.android.contacts/contacts --projection display_name > contacts_backup.txt',
    type: 'command',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    icon: 'MessageCircle',
    desc: 'Chats, medios y bases de datos de WhatsApp',
    cmd: 'adb pull /sdcard/WhatsApp/ ./backup_whatsapp/',
    type: 'pull',
    path: '/sdcard/WhatsApp/',
  },
  {
    id: 'dcim',
    name: 'Fotos y Videos',
    icon: 'Camera',
    desc: 'DCIM, Pictures, Screenshots',
    cmd: 'adb pull /sdcard/DCIM/ ./backup_dcim/',
    type: 'pull',
    path: '/sdcard/DCIM/',
  },
  {
    id: 'downloads',
    name: 'Descargas',
    icon: 'Download',
    desc: 'Carpeta de descargas del dispositivo',
    cmd: 'adb pull /sdcard/Download/ ./backup_downloads/',
    type: 'pull',
    path: '/sdcard/Download/',
  },
  {
    id: 'documents',
    name: 'Documentos',
    icon: 'FileText',
    desc: 'Carpeta de documentos',
    cmd: 'adb pull /sdcard/Documents/ ./backup_documents/',
    type: 'pull',
    path: '/sdcard/Documents/',
  },
  {
    id: 'apks',
    name: 'APKs de Terceros',
    icon: 'Package',
    desc: 'Aplicaciones instaladas por el usuario',
    cmd: `adb shell pm list packages -3 | sed 's/package://' > third_party_packages.txt
while read pkg; do
  apk_path=$(adb shell pm path "$pkg" | sed 's/package://')
  [ -n "$apk_path" ] && adb pull "$apk_path" "./backup_apks/\${pkg}.apk"
done < third_party_packages.txt`,
    type: 'script',
  },
  {
    id: 'system-info',
    name: 'Info del Sistema',
    icon: 'Info',
    desc: 'Propiedades, paquetes y configuraciones del sistema',
    cmd: `adb shell getprop > device_properties.txt
adb shell pm list packages > all_packages.txt
adb shell settings list system > settings_system.txt
adb shell settings list secure > settings_secure.txt
adb shell settings list global > settings_global.txt`,
    type: 'command',
  },
];

// NOTE: generateScript, downloadScript, copyToClipboard → src/services/scriptGenerator.js
