/**
 * Phone Optimizer — App Logic (v5.0)
 * Runs entirely in the browser via WebUSB ADB
 *
 * v2.1 — Based on Pablo's real-world scripts:
 * - Profiles: "Performance" (aggressive) / "Casual" (conservative)
 * - Emergency mode: restore everything to stock
 * - Maintenance reminder concept
 * - Animation presets (0 / 0.3 / 0.5 / 1x)
 * - Disable vs uninstall bloatware (reversible)
 * - Safe cache clearing (no data wipe)
 * - Confirmation dialogs for destructive ops
 * - Device auto-detection for brand
 */

// ─── PROFILES ───

const PROFILES = {
  performance: {
    name: '🚀 Rendimiento',
    desc: 'Máxima velocidad. Para quien quiere que el teléfono vuele.',
    icon: '🚀',
    animation: '0.3',
    gpu: true,
    safeOnly: false,
    killAll: true,
    cacheLevel: 'full',
    packages: [
      'com.miui.analytics', 'com.miui.msa.global', 'com.miui.ad',
      'com.miui.daemon', 'com.miui.bugreport', 'com.miui.compass',
      'com.miui.fm', 'com.miui.cleanmaster', 'com.miui.qrscanner',
      'com.miui.hybrid', 'com.xiaomi.glgm',
      'com.google.android.music', 'com.google.android.videos',
      'com.google.android.apps.googleassistant', 'com.google.ar.lens',
      'com.google.android.apps.turbo',
      'com.facebook.katana', 'com.facebook.system',
      'com.facebook.appmanager', 'com.facebook.services',
      'com.amazon.appmanager', 'com.netflix.partner.activation',
    ],
  },
  equilibrado: {
    name: '📱 Equilibrado',
    desc: 'Mejora el rendimiento sin perder funcionalidades.',
    icon: '📱',
    animation: '0.5',
    gpu: true,
    safeOnly: true,
    killAll: false,
    cacheLevel: 'safe',
    packages: [
      'com.miui.analytics', 'com.miui.msa.global',
      'com.xiaomi.glgm',
    ],
  },
  battery: {
    name: '🔋 Batería',
    desc: 'Prioriza duración de batería sobre rendimiento.',
    icon: '🔋',
    animation: '0.5',
    gpu: false,
    safeOnly: true,
    killAll: true,
    cacheLevel: 'safe',
    packages: [
      'com.miui.analytics', 'com.miui.msa.global',
      'com.facebook.katana', 'com.facebook.system',
      'com.facebook.appmanager', 'com.facebook.services',
    ],
  },
};

// ─── BLOATWARE ───

const BLOATWARE = {
  xiaomi: [
    { pkg: 'com.miui.analytics', name: 'MIUI Analytics', safe: true },
    { pkg: 'com.miui.msa.global', name: 'MSA (ads)', safe: true },
    { pkg: 'com.miui.ad', name: 'MIUI Ads', safe: true },
    { pkg: 'com.miui.daemon', name: 'MIUI Daemon', safe: true },
    { pkg: 'com.miui.bugreport', name: 'Bug Report', safe: true },
    { pkg: 'com.miui.compass', name: 'Compass', safe: true },
    { pkg: 'com.miui.fm', name: 'FM Radio', safe: true },
    { pkg: 'com.miui.mishare', name: 'Mi Share', safe: false },
    { pkg: 'com.miui.miwallpaper', name: 'Wallpapers', safe: false },
    { pkg: 'com.miui.cleanmaster', name: 'Clean Master', safe: true },
    { pkg: 'com.miui.qrscanner', name: 'QR Scanner', safe: true },
    { pkg: 'com.miui.hybrid', name: 'MIUI Hybrid', safe: true },
    { pkg: 'com.miui.cloudbackup', name: 'Cloud Backup', safe: false },
    { pkg: 'com.miui.cloudservice', name: 'Cloud Service', safe: false },
    { pkg: 'com.miui.micloudsync', name: 'Mi Cloud Sync', safe: false },
    { pkg: 'com.xiaomi.glgm', name: 'Xiaomi Games', safe: true },
    { pkg: 'com.miui.weather2', name: 'Weather', safe: true },
    { pkg: 'com.miui.player', name: 'MIUI Player', safe: false },
    { pkg: 'com.miui.video', name: 'MIUI Video', safe: false },
    { pkg: 'com.miui.notes', name: 'Notes', safe: false },
    { pkg: 'com.xiaomi.account', name: 'Xiaomi Account', safe: false },
    { pkg: 'com.google.android.music', name: 'Google Play Music', safe: true },
    { pkg: 'com.google.android.videos', name: 'Google Play Movies', safe: true },
    { pkg: 'com.google.android.googlequicksearchbox', name: 'Google Search', safe: false },
    { pkg: 'com.google.android.apps.googleassistant', name: 'Google Assistant', safe: true },
    { pkg: 'com.google.android.apps.docs', name: 'Google Docs', safe: false },
    { pkg: 'com.google.android.apps.photos', name: 'Google Photos', safe: false },
    { pkg: 'com.google.ar.lens', name: 'Google Lens', safe: true },
    { pkg: 'com.google.android.apps.turbo', name: 'Turbo (VPN)', safe: true },
    { pkg: 'com.facebook.katana', name: 'Facebook', safe: true },
    { pkg: 'com.facebook.system', name: 'Facebook System', safe: true },
    { pkg: 'com.facebook.appmanager', name: 'Facebook App Manager', safe: true },
    { pkg: 'com.facebook.services', name: 'Facebook Services', safe: true },
    { pkg: 'com.amazon.appmanager', name: 'Amazon App Manager', safe: true },
    { pkg: 'com.netflix.partner.activation', name: 'Netflix Activation', safe: true },
  ],
  samsung: [
    { pkg: 'com.samsung.android.game.gamehome', name: 'Game Home', safe: true },
    { pkg: 'com.samsung.android.app.tips', name: 'Samsung Tips', safe: true },
    { pkg: 'com.samsung.android.bixby.agent', name: 'Bixby Agent', safe: true },
    { pkg: 'com.samsung.android.bixby.service', name: 'Bixby Service', safe: true },
    { pkg: 'com.samsung.android.visionintelligence', name: 'Vision Intelligence', safe: true },
    { pkg: 'com.samsung.android.app.spage', name: 'Samsung Free', safe: true },
    { pkg: 'com.samsung.android.themestore', name: 'Theme Store', safe: false },
    { pkg: 'com.samsung.android.ardrawing', name: 'AR Drawing', safe: true },
    { pkg: 'com.samsung.android.arzone', name: 'AR Zone', safe: true },
    { pkg: 'com.samsung.android.app.routines', name: 'Bixby Routines', safe: false },
    { pkg: 'com.facebook.katana', name: 'Facebook', safe: true },
    { pkg: 'com.facebook.system', name: 'Facebook System', safe: true },
    { pkg: 'com.facebook.appmanager', name: 'Facebook App Manager', safe: true },
    { pkg: 'com.netflix.partner.activation', name: 'Netflix Activation', safe: true },
  ],
  generic: [
    { pkg: 'com.facebook.katana', name: 'Facebook', safe: true },
    { pkg: 'com.facebook.system', name: 'Facebook System', safe: true },
    { pkg: 'com.facebook.appmanager', name: 'Facebook App Manager', safe: true },
    { pkg: 'com.amazon.appmanager', name: 'Amazon App Manager', safe: true },
    { pkg: 'com.netflix.partner.activation', name: 'Netflix Activation', safe: true },
  ],
};

// ─── ANIMATION PRESETS ───

const ANIMATION_PRESETS = {
  '0':   { label: 'Sin animaciones', desc: 'Máxima velocidad, sin efectos', icon: '⚡' },
  '0.3': { label: 'Ultra rápido',    desc: 'Mínimo visual, sensación rápida', icon: '🚀' },
  '0.5': { label: 'Rápido',          desc: 'Equilibrio velocidad/fluidez', icon: '💨' },
  '1':   { label: 'Normal',          desc: 'Animaciones por defecto', icon: '🔄' },
};

// ─── HEAVY APPS ───

const HEAVY_APPS = [
  { pkg: 'com.facebook.katana', name: 'Facebook' },
  { pkg: 'com.instagram.android', name: 'Instagram' },
  { pkg: 'com.zhiliaoapp.musically', name: 'TikTok' },
  { pkg: 'com.google.android.youtube', name: 'YouTube' },
  { pkg: 'com.snapchat.android', name: 'Snapchat' },
  { pkg: 'com.twitter.android', name: 'Twitter/X' },
  { pkg: 'com.spotify.music', name: 'Spotify' },
  { pkg: 'com.whatsapp', name: 'WhatsApp' },
];

// ─── SAFE SETTINGS ───

const PERF_SETTINGS_SAFE = {
  'force_gpu_rendering': '1',
  'force_msaa': '1',
};

// ─── CACHE COMMANDS ───

const CACHE_COMMANDS_SAFE = [
  { cmd: 'pm trim-caches 256M', desc: 'App cache general (256MB)' },
  { cmd: 'rm -rf /sdcard/DCIM/.thumbnails/* 2>/dev/null', desc: 'Thumbnails de fotos' },
];

const CACHE_COMMANDS_FULL = [
  ...CACHE_COMMANDS_SAFE,
  { cmd: 'rm -rf /data/local/tmp/* 2>/dev/null', desc: 'Archivos temporales del sistema' },
  { cmd: 'rm -rf /data/tombstones/* 2>/dev/null', desc: 'Crash dumps (tombstones)' },
  { cmd: 'rm -rf /data/anr/* 2>/dev/null', desc: 'ANR traces' },
  { cmd: 'pm trim-caches 512M', desc: 'Cache profunda (512MB)' },
];

// ─── SYSTEM APPS (for emergency restore) ───

const SYSTEM_APPS_XIAOMI = [
  'com.miui.analytics', 'com.miui.msa.global', 'com.miui.hybrid',
  'com.miui.bugreport', 'com.miui.cloudbackup', 'com.miui.cloudservice',
  'com.miui.micloudsync', 'com.xiaomi.glgm',
];

// ═══════════════════════════════════════════════════════
//  APP CLASS
// ═══════════════════════════════════════════════════════

class PhoneOptimizerApp {
  constructor() {
    this.adb = new AdbClient();
    this.connected = false;
    this.deviceInfo = null;
    this.metrics = { cpu: 0, ram: 0, temp: 0, battery: 0 };
    this._metricsInterval = null;
    this._logEntries = [];
    this._disabledApps = [];
    this._animationScale = '0.3';
    this._brand = 'xiaomi';
    this._currentProfile = null;
  }

  init() {
    this.renderApp();
    this.bindEvents();
    this.checkSupport();
    // Hide loading spinner
    const loading = document.getElementById('app-loading');
    if (loading) loading.style.display = 'none';
  }

  checkSupport() {
    if (!this.adb.isSupported()) {
      document.getElementById('browser-warning').style.display = 'flex';
    }
  }

  // ─── RENDER ───

  renderApp() {
    document.getElementById('app').innerHTML = `
      <!-- BROWSER WARNING -->
      <div id="browser-warning" class="alert alert-warn" style="display:none">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        <span>WebUSB solo funciona en <strong>Chrome, Edge u Opera</strong>. Firefox y Safari no son compatibles.</span>
      </div>

      <!-- HEADER -->
      <header class="app-header">
        <div class="header-left">
          <div class="logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12" y2="18.01"/></svg>
            <span>Phone Optimizer <span class="version-tag">v5.0</span></span>
          </div>
        </div>
        <div class="header-right">
          <div id="status-badge" class="status-badge disconnected">
            <span class="status-dot"></span>
            <span id="status-text">Desconectado</span>
          </div>
          <button id="btn-connect" class="btn btn-primary btn-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
            Conectar
          </button>
          <button id="btn-disconnect" class="btn btn-danger btn-sm" style="display:none">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            Desconectar
          </button>
        </div>
      </header>

      <!-- MAIN CONTENT -->
      <main class="app-main">
        <!-- EMPTY STATE -->
        <div id="empty-state" class="empty-state">
          <div class="empty-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
              <line x1="12" y1="18" x2="12" y2="18.01"/>
              <circle cx="12" cy="10" r="1"/>
            </svg>
          </div>
          <h2>Conectá tu teléfono</h2>
          <p>Activá la depuración USB en tu Android y conectalo por cable. Después hacé clic en "Conectar".</p>
          <div class="steps">
            <div class="step"><span class="step-num">1</span><span>Ajustes → Sobre del teléfono → Tocar "Número de compilación" 7 veces</span></div>
            <div class="step"><span class="step-num">2</span><span>Ajustes → Opciones de desarrollador → Activar "Depuración USB"</span></div>
            <div class="step"><span class="step-num">3</span><span>Conectar por USB y aceptar la autorización en el teléfono</span></div>
          </div>
        </div>

        <!-- DASHBOARD -->
        <div id="dashboard" style="display:none">
          <!-- DEVICE INFO BAR -->
          <div class="device-bar">
            <div class="device-bar-info">
              <span class="device-icon">📱</span>
              <div>
                <div id="device-model" class="device-model">—</div>
                <div id="device-android" class="device-android">Android —</div>
              </div>
            </div>
            <div class="device-bar-stats">
              <div class="stat-chip" id="chip-battery"><span class="stat-icon">🔋</span><span id="val-battery">—%</span></div>
              <div class="stat-chip" id="chip-temp"><span class="stat-icon">🌡️</span><span id="val-temp">—°C</span></div>
              <div class="stat-chip" id="chip-ram"><span class="stat-icon">💾</span><span id="val-ram">—%</span></div>
              <div class="stat-chip" id="chip-cpu"><span class="stat-icon">⚡</span><span id="val-cpu">—%</span></div>
            </div>
          </div>

          <!-- TABS -->
          <div class="tabs">
            <button class="tab active" data-tab="profiles">👤 Perfiles</button>
            <button class="tab" data-tab="optimize">🚀 Optimizar</button>
            <button class="tab" data-tab="monitor">📊 Monitor</button>
            <button class="tab" data-tab="diagnose">🔍 Diagnóstico</button>
            <button class="tab" data-tab="shell">💻 Terminal</button>
            <button class="tab" data-tab="log">📋 Log</button>
          </div>

          <!-- ═══ PROFILES TAB ═══ -->
          <div id="tab-profiles" class="tab-content active">
            <div class="profiles-header">
              <h2>Elegí un perfil</h2>
              <p>Cada perfil aplica una combinación de optimizaciones diseñada para un uso específico.</p>
            </div>
            <div class="profiles-grid">
              ${Object.entries(PROFILES).map(([key, profile]) => `
                <div class="profile-card" data-profile="${key}">
                  <div class="profile-icon">${profile.icon}</div>
                  <h3>${profile.name}</h3>
                  <p>${profile.desc}</p>
                  <div class="profile-details">
                    <span class="profile-tag">Anim: ${profile.animation}x</span>
                    <span class="profile-tag">GPU: ${profile.gpu ? 'Sí' : 'No'}</span>
                    <span class="profile-tag">${profile.packages.length} apps a desactivar</span>
                  </div>
                  <button class="btn btn-primary btn-sm btn-apply-profile" data-profile="${key}">Aplicar perfil</button>
                </div>
              `).join('')}
            </div>
            <div id="profile-result" class="card-result" style="display:none"></div>

            <!-- QUICK ACTIONS from profiles -->
            <div class="quick-actions">
              <h3>⚡ Acciones rápidas</h3>
              <div class="quick-actions-grid">
                <button id="btn-emergency" class="btn btn-danger btn-sm">
                  🚨 Modo Emergencia
                  <span class="btn-subtitle">Restaurar todo a fábrica</span>
                </button>
                <button id="btn-maintenance" class="btn btn-secondary btn-sm">
                  🔧 Mantenimiento
                  <span class="btn-subtitle">Limpieza periódica segura</span>
                </button>
              </div>
            </div>
          </div>

          <!-- ═══ OPTIMIZE TAB ═══ -->
          <div id="tab-optimize" class="tab-content">
            <div class="card-grid">

              <!-- ANIMATIONS -->
              <div class="card card-action">
                <div class="card-header">
                  <h3>🎬 Animaciones</h3>
                  <span class="badge badge-green">Seguro</span>
                </div>
                <p>Ajustá la velocidad de las animaciones. Más bajo = más rápido.</p>
                <div class="animation-slider-container">
                  <div class="animation-presets" id="anim-presets">
                    ${Object.entries(ANIMATION_PRESETS).map(([val, info]) => `
                      <button class="anim-preset ${val === '0.3' ? 'active' : ''}" data-value="${val}">
                        <span class="anim-icon">${info.icon}</span>
                        <span class="anim-label">${info.label}</span>
                        <span class="anim-desc">${info.desc}</span>
                      </button>
                    `).join('')}
                  </div>
                </div>
                <button id="btn-animations" class="btn btn-primary btn-sm" style="margin-top:12px">Aplicar Animaciones</button>
                <div id="anim-result" class="card-result" style="display:none"></div>
              </div>

              <!-- GPU -->
              <div class="card card-action">
                <div class="card-header">
                  <h3>⚡ GPU Rendering</h3>
                  <span class="badge badge-green">Seguro</span>
                </div>
                <p>Fuerza renderizado por GPU y activa MSAA para mejor rendimiento gráfico.</p>
                <button id="btn-gpu" class="btn btn-primary btn-sm">Activar GPU</button>
                <div id="gpu-result" class="card-result" style="display:none"></div>
              </div>

              <!-- BLOATWARE -->
              <div class="card card-action card-wide">
                <div class="card-header">
                  <h3>🧹 Limpiar Bloatware</h3>
                  <span class="badge badge-blue">Recomendado</span>
                </div>
                <p>Desactivá apps preinstaladas. Podés reactivarlas después.</p>
                <div class="card-actions">
                  <select id="bloatware-brand" class="select-sm">
                    <option value="xiaomi">Xiaomi / Redmi / POCO</option>
                    <option value="samsung">Samsung</option>
                    <option value="generic">Genérico</option>
                  </select>
                  <button id="btn-bloatware" class="btn btn-primary btn-sm">Desactivar</button>
                  <button id="btn-bloatware-uninstall" class="btn btn-danger btn-sm" title="Desinstalar (más agresivo)">Desinstalar</button>
                </div>
                <div class="bloatware-info">
                  <label class="checkbox-label">
                    <input type="checkbox" id="bloatware-safe-only" checked>
                    <span>Solo apps seguras (no afecta funcionalidades)</span>
                  </label>
                </div>
                <div id="bloatware-result" class="card-result" style="display:none"></div>
              </div>

              <!-- REVERT -->
              <div class="card card-action">
                <div class="card-header">
                  <h3>↩️ Reactivar Apps</h3>
                  <span class="badge badge-amber">Reversible</span>
                </div>
                <p>Reactivá apps desactivadas previamente.</p>
                <button id="btn-revert" class="btn btn-secondary btn-sm">Ver Apps Desactivadas</button>
                <div id="revert-result" class="card-result" style="display:none"></div>
              </div>

              <!-- CACHE -->
              <div class="card card-action">
                <div class="card-header">
                  <h3>🗑️ Limpiar Cache</h3>
                  <span class="badge badge-green">Seguro</span>
                </div>
                <p>Elimina thumbnails, temporales y cache. <strong>No borra tus datos.</strong></p>
                <button id="btn-cache" class="btn btn-primary btn-sm">Limpiar Cache</button>
                <div id="cache-result" class="card-result" style="display:none"></div>
              </div>

              <!-- KILL -->
              <div class="card card-action">
                <div class="card-header">
                  <h3>💀 Cerrar Apps Pesadas</h3>
                  <span class="badge badge-amber">Agresivo</span>
                </div>
                <p>Forzá el cierre de apps que consumen mucha RAM.</p>
                <div class="kill-apps-list" id="kill-apps-list">
                  ${HEAVY_APPS.map(app => `
                    <label class="checkbox-label">
                      <input type="checkbox" class="kill-app-check" value="${app.pkg}" checked>
                      <span>${app.name}</span>
                    </label>
                  `).join('')}
                </div>
                <button id="btn-kill" class="btn btn-warning btn-sm" style="margin-top:8px">Cerrar Seleccionadas</button>
                <div id="kill-result" class="card-result" style="display:none"></div>
              </div>

              <!-- TURBO -->
              <div class="card card-action card-wide">
                <div class="card-header">
                  <h3>🚀 Modo Turbo</h3>
                  <span class="badge badge-red">Extremo</span>
                </div>
                <p>Todo en un solo click. Elegí qué incluir:</p>
                <div class="turbo-options">
                  <label class="checkbox-label"><input type="checkbox" id="turbo-anim" checked><span>Animaciones ultra rápido</span></label>
                  <label class="checkbox-label"><input type="checkbox" id="turbo-gpu" checked><span>Forzar GPU</span></label>
                  <label class="checkbox-label"><input type="checkbox" id="turbo-bloat" checked><span>Desactivar bloatware seguro</span></label>
                  <label class="checkbox-label"><input type="checkbox" id="turbo-cache" checked><span>Limpiar cache</span></label>
                  <label class="checkbox-label"><input type="checkbox" id="turbo-kill" checked><span>Cerrar apps pesadas</span></label>
                </div>
                <button id="btn-turbo" class="btn btn-danger btn-sm" style="margin-top:12px">🚀 Activar Turbo</button>
                <div id="turbo-result" class="card-result" style="display:none"></div>
              </div>

              <!-- SYSTEM INFO -->
              <div class="card card-action">
                <div class="card-header">
                  <h3>📦 Info del Sistema</h3>
                </div>
                <p>Detalles completos del dispositivo.</p>
                <button id="btn-sysinfo" class="btn btn-secondary btn-sm">Ver Info</button>
                <div id="sysinfo-result" class="card-result" style="display:none"></div>
              </div>
            </div>
          </div>

          <!-- ═══ MONITOR TAB ═══ -->
          <div id="tab-monitor" class="tab-content">
            <div class="monitor-grid">
              <div class="metric-card">
                <div class="metric-label">CPU</div>
                <div class="metric-value" id="m-cpu">—</div>
                <div class="metric-bar"><div class="metric-fill" id="bar-cpu" style="width:0%"></div></div>
              </div>
              <div class="metric-card">
                <div class="metric-label">RAM</div>
                <div class="metric-value" id="m-ram">—</div>
                <div class="metric-bar"><div class="metric-fill" id="bar-ram" style="width:0%"></div></div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Temperatura</div>
                <div class="metric-value" id="m-temp">—</div>
                <div class="metric-bar"><div class="metric-fill temp" id="bar-temp" style="width:0%"></div></div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Batería</div>
                <div class="metric-value" id="m-battery">—</div>
                <div class="metric-bar"><div class="metric-fill battery" id="bar-battery" style="width:0%"></div></div>
              </div>
            </div>
            <div class="card" style="margin-top:16px">
              <h3>📱 Procesos en ejecución</h3>
              <div id="process-list" class="process-list">Conectá tu dispositivo para ver procesos...</div>
            </div>
          </div>

          <!-- ═══ DIAGNOSE TAB ═══ -->
          <div id="tab-diagnose" class="tab-content">
            <div class="card">
              <h3>🔍 Diagnóstico del dispositivo</h3>
              <button id="btn-diag" class="btn btn-primary btn-sm" style="margin-bottom:16px">Ejecutar Diagnóstico</button>
              <div id="diag-result" class="diag-result">Hacé clic en "Ejecutar Diagnóstico" para analizar tu dispositivo.</div>
            </div>
          </div>

          <!-- ═══ SHELL TAB ═══ -->
          <div id="tab-shell" class="tab-content">
            <div class="terminal-container">
              <div id="terminal-output" class="terminal-output">Phone Optimizer Terminal v5.0\nEscribí comandos ADB shell.\nEj: dumpsys battery, getprop ro.product.model\n\n</div>
              <div class="terminal-input-row">
                <span class="terminal-prompt">$</span>
                <input id="terminal-input" type="text" class="terminal-input" placeholder="shell command..." autocomplete="off">
                <button id="btn-shell-run" class="btn btn-primary btn-sm">Ejecutar</button>
              </div>
            </div>
          </div>

          <!-- ═══ LOG TAB ═══ -->
          <div id="tab-log" class="tab-content">
            <div class="card">
              <div class="log-header">
                <h3>📋 Registro de operaciones</h3>
                <button id="btn-clear-log" class="btn btn-secondary btn-xs">Limpiar</button>
              </div>
              <div id="log-list" class="log-list"></div>
            </div>
          </div>
        </div>
      </main>

      <!-- CONFIRM MODAL -->
      <div id="confirm-modal" class="modal-overlay" style="display:none">
        <div class="modal">
          <div class="modal-header">
            <h3 id="modal-title">Confirmar</h3>
            <button id="modal-close" class="modal-close-btn">&times;</button>
          </div>
          <div id="modal-body" class="modal-body"></div>
          <div class="modal-actions">
            <button id="modal-cancel" class="btn btn-secondary btn-sm">Cancelar</button>
            <button id="modal-confirm" class="btn btn-danger btn-sm">Confirmar</button>
          </div>
        </div>
      </div>
    `;
  }

  // ─── EVENTS ───

  bindEvents() {
    document.getElementById('btn-connect').addEventListener('click', () => this.connect());
    document.getElementById('btn-disconnect').addEventListener('click', () => this.disconnect());

    // Tabs
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('tab')) {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        document.getElementById(`tab-${e.target.dataset.tab}`).classList.add('active');
      }
    });

    // Profile cards
    document.querySelectorAll('.btn-apply-profile').forEach(btn => {
      btn.addEventListener('click', (e) => this.applyProfile(e.currentTarget.dataset.profile));
    });

    // Animation presets
    document.querySelectorAll('.anim-preset').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.anim-preset').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this._animationScale = e.currentTarget.dataset.value;
      });
    });

    // Actions
    document.getElementById('btn-animations').addEventListener('click', () => this.applyAnimations());
    document.getElementById('btn-gpu').addEventListener('click', () => this.enableGPU());
    document.getElementById('btn-bloatware').addEventListener('click', () => this.cleanBloatware('disable'));
    document.getElementById('btn-bloatware-uninstall').addEventListener('click', () => this.cleanBloatware('uninstall'));
    document.getElementById('btn-revert').addEventListener('click', () => this.showDisabledApps());
    document.getElementById('btn-cache').addEventListener('click', () => this.cleanCache());
    document.getElementById('btn-kill').addEventListener('click', () => this.killHeavyApps());
    document.getElementById('btn-turbo').addEventListener('click', () => this.turboMode());
    document.getElementById('btn-sysinfo').addEventListener('click', () => this.showSystemInfo());
    document.getElementById('btn-diag').addEventListener('click', () => this.runDiagnostics());

    // Emergency & Maintenance
    document.getElementById('btn-emergency').addEventListener('click', () => this.emergencyMode());
    document.getElementById('btn-maintenance').addEventListener('click', () => this.maintenanceMode());

    // Brand change
    document.getElementById('bloatware-brand').addEventListener('change', (e) => {
      this._brand = e.target.value;
    });

    // Terminal
    document.getElementById('terminal-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.runShellCommand();
    });
    document.getElementById('btn-shell-run').addEventListener('click', () => this.runShellCommand());

    // Log
    document.getElementById('btn-clear-log').addEventListener('click', () => {
      this._logEntries = [];
      document.getElementById('log-list').innerHTML = '<div class="log-empty">Log limpio</div>';
    });

    // Modal
    document.getElementById('modal-close').addEventListener('click', () => this.hideModal());
    document.getElementById('modal-cancel').addEventListener('click', () => this.hideModal());
  }

  // ─── MODAL ───

  showModal(title, bodyHtml, onConfirm, confirmText = 'Confirmar', confirmClass = 'btn-danger') {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = bodyHtml;
    const confirmBtn = document.getElementById('modal-confirm');
    confirmBtn.textContent = confirmText;
    confirmBtn.className = `btn ${confirmClass} btn-sm`;
    document.getElementById('confirm-modal').style.display = 'flex';

    const handler = () => {
      this.hideModal();
      onConfirm();
      confirmBtn.removeEventListener('click', handler);
    };
    confirmBtn.addEventListener('click', handler);
  }

  hideModal() {
    document.getElementById('confirm-modal').style.display = 'none';
  }

  // ─── CONNECTION ───

  async connect() {
    const btn = document.getElementById('btn-connect');
    btn.disabled = true;
    btn.textContent = 'Conectando...';

    try {
      let device = null;
      try {
        device = await navigator.usb.requestDevice({ filters: [] });
      } catch (e) {
        if (e.name === 'NotFoundError') {
          const devices = await navigator.usb.getDevices();
          const adb = devices.filter(d =>
            d.configurations.some(c =>
              c.interfaces.some(i =>
                i.alternates.some(a =>
                  a.interfaceClass === 0xFF &&
                  a.interfaceSubclass === 0x42 &&
                  a.interfaceProtocol === 0x01
                )
              )
            )
          );
          if (adb.length > 0) device = adb[0];
          else throw new Error('No se encontró ningún dispositivo. Conectá tu teléfono por USB y activá la depuración USB.');
        } else {
          throw e;
        }
      }

      this.deviceInfo = await this.adb.connect(device);
      this.connected = true;

      const model = (await this.adb.shell('getprop ro.product.model')).trim();
      const android = (await this.adb.shell('getprop ro.build.version.release')).trim();
      const manufacturer = (await this.adb.shell('getprop ro.product.manufacturer')).trim();

      document.getElementById('device-model').textContent = `${manufacturer} ${model}`;
      document.getElementById('device-android').textContent = `Android ${android}`;

      this._brand = this.detectBrand(manufacturer.toLowerCase());
      document.getElementById('bloatware-brand').value = this._brand;

      document.getElementById('status-badge').className = 'status-badge connected';
      document.getElementById('status-text').textContent = 'Conectado';
      document.getElementById('btn-connect').style.display = 'none';
      document.getElementById('btn-disconnect').style.display = 'inline-flex';
      document.getElementById('empty-state').style.display = 'none';
      document.getElementById('dashboard').style.display = 'block';

      this.log('success', `Conectado: ${manufacturer} ${model} (Android ${android})`);
      this.startMetrics();

    } catch (err) {
      this.log('error', `Error de conexión: ${err.message}`);
      alert(`Error: ${err.message}`);
    } finally {
      btn.disabled = false;
      btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg> Conectar`;
    }
  }

  detectBrand(mfr) {
    if (mfr.includes('xiaomi') || mfr.includes('redmi') || mfr.includes('poco')) return 'xiaomi';
    if (mfr.includes('samsung')) return 'samsung';
    return 'generic';
  }

  async disconnect() {
    await this.adb.disconnect();
    this.connected = false;
    this.stopMetrics();

    document.getElementById('status-badge').className = 'status-badge disconnected';
    document.getElementById('status-text').textContent = 'Desconectado';
    document.getElementById('btn-connect').style.display = 'inline-flex';
    document.getElementById('btn-disconnect').style.display = 'none';
    document.getElementById('empty-state').style.display = 'block';
    document.getElementById('dashboard').style.display = 'none';

    this.log('info', 'Dispositivo desconectado');
  }

  // ─── METRICS ───

  startMetrics() {
    this.updateMetrics();
    this._metricsInterval = setInterval(() => this.updateMetrics(), 5000);
  }

  stopMetrics() {
    if (this._metricsInterval) clearInterval(this._metricsInterval);
  }

  async updateMetrics() {
    if (!this.connected) return;
    try {
      const batteryOut = await this.adb.shell('dumpsys battery');
      const levelMatch = batteryOut.match(/level:\s*(\d+)/);
      const tempMatch = batteryOut.match(/temperature:\s*(\d+)/);
      if (levelMatch) {
        const level = parseInt(levelMatch[1]);
        document.getElementById('val-battery').textContent = `${level}%`;
        document.getElementById('m-battery').textContent = `${level}%`;
        document.getElementById('bar-battery').style.width = `${level}%`;
      }
      if (tempMatch) {
        const temp = parseInt(tempMatch[1]) / 10;
        document.getElementById('val-temp').textContent = `${temp}°C`;
        document.getElementById('m-temp').textContent = `${temp}°C`;
        document.getElementById('bar-temp').style.width = `${Math.min(temp / 50 * 100, 100)}%`;
      }

      const memOut = await this.adb.shell('cat /proc/meminfo');
      const totalMatch = memOut.match(/MemTotal:\s*(\d+)/);
      const availMatch = memOut.match(/MemAvailable:\s*(\d+)/);
      if (totalMatch && availMatch) {
        const total = parseInt(totalMatch[1]);
        const avail = parseInt(availMatch[1]);
        const usedPct = Math.round((1 - avail / total) * 100);
        const totalGB = (total / 1024 / 1024).toFixed(1);
        const usedGB = ((total - avail) / 1024 / 1024).toFixed(1);
        document.getElementById('val-ram').textContent = `${usedPct}%`;
        document.getElementById('m-ram').textContent = `${usedGB}/${totalGB} GB (${usedPct}%)`;
        document.getElementById('bar-ram').style.width = `${usedPct}%`;
      }

      const cpuOut = await this.adb.shell('cat /proc/loadavg');
      const loadMatch = cpuOut.match(/^([\d.]+)/);
      if (loadMatch) {
        const cores = parseInt(await this.adb.shell('nproc')) || 4;
        const load = parseFloat(loadMatch[1]);
        const cpuPct = Math.min(Math.round(load / cores * 100), 100);
        document.getElementById('val-cpu').textContent = `${cpuPct}%`;
        document.getElementById('m-cpu').textContent = `${cpuPct}% (${load} load)`;
        document.getElementById('bar-cpu').style.width = `${cpuPct}%`;
      }
    } catch (e) {
      this.log('error', `Metrics update failed: ${e.message}`);
    }
  }

  // ═══════════════════════════════════════════════════════
  //  PROFILES — based on Pablo's real scripts
  // ═══════════════════════════════════════════════════════

  async applyProfile(profileKey) {
    const profile = PROFILES[profileKey];
    if (!profile) return;

    const resultEl = document.getElementById('profile-result');
    const listHtml = profile.packages.map(pkg => {
      const allKnown = Object.values(BLOATWARE).flat();
      const known = allKnown.find(b => b.pkg === pkg);
      return `<li>${known ? known.name : pkg} <code>${pkg}</code></li>`;
    }).join('');

    this.showModal(
      `${profile.icon} Aplicar perfil: ${profile.name}`,
      `<p>${profile.desc}</p>
       <div class="profile-summary">
         <div class="profile-summary-row"><strong>Animaciones:</strong> ${profile.animation}x</div>
         <div class="profile-summary-row"><strong>GPU:</strong> ${profile.gpu ? 'Forzada' : 'Sin cambios'}</div>
         <div class="profile-summary-row"><strong>Cache:</strong> ${profile.cacheLevel === 'full' ? 'Profunda' : 'Segura'}</div>
         <div class="profile-summary-row"><strong>Apps a desactivar:</strong> ${profile.packages.length}</div>
       </div>
       <ul class="modal-list">${listHtml}</ul>
       <div class="modal-info">💡 Podés revertir todo con "Modo Emergencia".</div>`,
      async () => {
        await this._executeProfile(profile);
      },
      'Aplicar perfil',
      'btn-primary'
    );
  }

  async _executeProfile(profile) {
    const resultEl = document.getElementById('profile-result');
    resultEl.style.display = 'block';
    resultEl.innerHTML = '<span class="spinner"></span> Aplicando perfil...';
    this._currentProfile = profile;

    // Thermal safety check
    try {
      const batteryOut = await this.adb.shell('dumpsys battery');
      const tempMatch = batteryOut.match(/temperature:\s*(\d+)/);
      if (tempMatch) {
        const tempC = parseInt(tempMatch[1]) / 10;
        if (tempC > 40) {
          resultEl.innerHTML = `<strong>⚠️ Dispositivo a ${tempC}°C (>40°C)</strong><br>Esperá a que se enfríe antes de aplicar un perfil.`;
          resultEl.className = 'card-result error';
          this.log('error', `Temperatura alta (${tempC}°C) — perfil cancelado`);
          return;
        }
      }
    } catch (e) { /* continue if can't check temp */ }

    let step = 0;
    const total = 3 + (profile.gpu ? 1 : 0) + (profile.killAll ? 1 : 0);
    this.log('info', `👤 Perfil "${profile.name}": iniciando...`);

    // 1. Animations
    step++;
    resultEl.innerHTML = `<span class="spinner"></span> Fase ${step}/${total}: Animaciones...`;
    for (const key of ['window_animation_scale', 'transition_animation_scale', 'animator_duration_scale']) {
      try { await this.adb.shell(`settings put global ${key} ${profile.animation}`); } catch (e) {}
    }

    // 2. GPU
    if (profile.gpu) {
      step++;
      resultEl.innerHTML = `<span class="spinner"></span> Fase ${step}/${total}: GPU...`;
      for (const [key, value] of Object.entries(PERF_SETTINGS_SAFE)) {
        try { await this.adb.shell(`settings put global ${key} ${value}`); } catch (e) {}
      }
    }

    // 3. Bloatware
    step++;
    resultEl.innerHTML = `<span class="spinner"></span> Fase ${step}/${total}: Bloatware...`;
    let disabled = 0;
    for (const pkg of profile.packages) {
      try {
        await this.adb.shell(`pm disable-user --user 0 ${pkg}`);
        disabled++;
      } catch (e) {}
    }

    // 4. Kill heavy apps
    if (profile.killAll) {
      step++;
      resultEl.innerHTML = `<span class="spinner"></span> Fase ${step}/${total}: Cerrando apps...`;
      for (const app of HEAVY_APPS) {
        try { await this.adb.shell(`am force-stop ${app.pkg}`); } catch (e) {}
      }
    }

    // 5. Cache
    step++;
    resultEl.innerHTML = `<span class="spinner"></span> Fase ${step}/${total}: Cache...`;
    const cacheCmds = profile.cacheLevel === 'full' ? CACHE_COMMANDS_FULL : CACHE_COMMANDS_SAFE;
    for (const { cmd } of cacheCmds) {
      try { await this.adb.shell(cmd); } catch (e) {}
    }

    resultEl.innerHTML = `<strong>✅ Perfil "${profile.name}" aplicado</strong> · Animaciones ${profile.animation}x · ${disabled} apps desactivadas`;
    resultEl.className = 'card-result success';
    this.log('success', `👤 Perfil "${profile.name}" completado`);
  }

  // ═══════════════════════════════════════════════════════
  //  EMERGENCY MODE — restore everything
  // ═══════════════════════════════════════════════════════

  emergencyMode() {
    this.showModal(
      '🚨 Modo Emergencia',
      `<p>Esto va a <strong>restaurar todo</strong> a los valores de fábrica:</p>
       <ul class="modal-list">
         <li>🔄 Reactivar TODAS las apps del sistema</li>
         <li>🎬 Restaurar animaciones a 1x (normal)</li>
         <li>🎨 Desactivar GPU forzada</li>
         <li>🔧 Reparar permisos de SystemUI</li>
       </ul>
       <div class="modal-warning">⚠️ Esto revierte TODAS las optimizaciones que hayas aplicado.</div>`,
      async () => {
        await this._executeEmergency();
      },
      '🚨 Restaurar todo',
      'btn-danger'
    );
  }

  async _executeEmergency() {
    const resultEl = document.getElementById('profile-result');
    resultEl.style.display = 'block';
    resultEl.innerHTML = '<span class="spinner"></span> 🚨 Modo Emergencia...';
    this.log('info', '🚨 EMERGENCIA: Restaurando sistema...');

    const steps = [];

    // 1. Restore all system apps
    resultEl.innerHTML = '<span class="spinner"></span> 🚨 Reactivando apps del sistema...';
    let restored = 0;
    for (const pkg of SYSTEM_APPS_XIAOMI) {
      try {
        await this.adb.shell(`pm enable ${pkg}`);
        restored++;
      } catch (e) {}
    }
    steps.push(`✅ ${restored} apps del sistema reactivadas`);

    // 2. Also restore any disabled packages we can find
    try {
      const disabledOutput = await this.adb.shell('pm list packages -d');
      const disabledPkgs = disabledOutput.split('\n')
        .filter(l => l.startsWith('package:'))
        .map(l => l.replace('package:', '').trim());

      let extra = 0;
      for (const pkg of disabledPkgs) {
        try {
          await this.adb.shell(`pm enable ${pkg}`);
          extra++;
        } catch (e) {}
      }
      if (extra > 0) steps.push(`✅ ${extra} apps adicionales reactivadas`);
    } catch (e) {}

    // 3. Restore animations
    resultEl.innerHTML = '<span class="spinner"></span> 🚨 Restaurando animaciones...';
    for (const key of ['window_animation_scale', 'transition_animation_scale', 'animator_duration_scale']) {
      try { await this.adb.shell(`settings put global ${key} 1`); } catch (e) {}
    }
    steps.push('✅ Animaciones restauradas a 1x');

    // 4. Reset GPU settings
    resultEl.innerHTML = '<span class="spinner"></span> 🚨 Restaurando GPU...';
    try {
      await this.adb.shell('settings delete global force_gpu_rendering');
      await this.adb.shell('settings delete global force_msaa');
    } catch (e) {}
    steps.push('✅ GPU restaurada a valores por defecto');

    // 5. Repair SystemUI permissions
    resultEl.innerHTML = '<span class="spinner"></span> 🚨 Reparando permisos...';
    try {
      await this.adb.shell('pm grant com.android.systemui android.permission.SYSTEM_ALERT_WINDOW');
      steps.push('✅ Permisos de SystemUI reparados');
    } catch (e) {
      steps.push('⚠️ Permisos de SystemUI (no se pudo reparar)');
    }

    this._currentProfile = null;

    resultEl.innerHTML = `<strong>🚨 ¡SISTEMA RESTAURADO!</strong><br>${steps.join('<br>')}`;
    resultEl.className = 'card-result success turbo';
    this.log('success', '🚨 EMERGENCIA: Sistema restaurado completamente');
  }

  // ═══════════════════════════════════════════════════════
  //  MAINTENANCE MODE — periodic safe cleanup
  // ═══════════════════════════════════════════════════════

  maintenanceMode() {
    this.showModal(
      '🔧 Mantenimiento',
      `<p>Limpieza segura periódica. No desactiva ni desinstala nada.</p>
       <ul class="modal-list">
         <li>🗑️ Limpiar cache acumulada</li>
         <li>💀 Cerrar apps en segundo plano</li>
         <li>📊 Verificar estado del sistema</li>
       </ul>
       <div class="modal-info">💡 Ejecutá esto una vez al mes para mantener el teléfono fluido.</div>`,
      async () => {
        await this._executeMaintenance();
      },
      '🔧 Ejecutar mantenimiento',
      'btn-primary'
    );
  }

  async _executeMaintenance() {
    const resultEl = document.getElementById('profile-result');
    resultEl.style.display = 'block';
    resultEl.innerHTML = '<span class="spinner"></span> 🔧 Mantenimiento...';
    this.log('info', '🔧 MANTENIMIENTO: Iniciando limpieza...');

    const results = [];

    // 1. Safe cache cleanup
    resultEl.innerHTML = '<span class="spinner"></span> 🔧 Limpiando cache...';
    let cacheDone = 0;
    for (const { cmd, desc } of CACHE_COMMANDS_SAFE) {
      try {
        await this.adb.shell(cmd);
        cacheDone++;
        results.push(`✅ ${desc}`);
      } catch (e) {
        results.push(`⚠️ ${desc}`);
      }
    }

    // 2. Close background apps
    resultEl.innerHTML = '<span class="spinner"></span; Cerrando apps en segundo plano...';
    let killed = 0;
    for (const app of HEAVY_APPS) {
      try {
        await this.adb.shell(`am force-stop ${app.pkg}`);
        killed++;
      } catch (e) {}
    }
    results.push(`✅ ${killed} apps cerradas`);

    // 3. System check
    resultEl.innerHTML = '<span class="spinner"></span> 🔧 Verificando sistema...';
    try {
      const battery = await this.adb.shell('dumpsys battery');
      const level = battery.match(/level:\s*(\d+)/);
      if (level) results.push(`🔋 Batería: ${level[1]}%`);

      const mem = await this.adb.shell('cat /proc/meminfo');
      const total = mem.match(/MemTotal:\s*(\d+)/);
      const avail = mem.match(/MemAvailable:\s*(\d+)/);
      if (total && avail) {
        const usedPct = Math.round((1 - parseInt(avail[1]) / parseInt(total[1])) * 100);
        results.push(`💾 RAM: ${usedPct}% en uso`);
      }
    } catch (e) {}

    resultEl.innerHTML = `<strong>🔧 Mantenimiento completado</strong><br>${results.join('<br>')}`;
    resultEl.className = 'card-result success';
    this.log('success', '🔧 MANTENIMIENTO: Completado');
  }

  // ═══════════════════════════════════════════════════════
  //  INDIVIDUAL ACTIONS
  // ═══════════════════════════════════════════════════════

  async applyAnimations() {
    const resultEl = document.getElementById('anim-result');
    resultEl.style.display = 'block';
    resultEl.innerHTML = '<span class="spinner"></span> Aplicando...';

    const scale = this._animationScale;
    let applied = 0;
    for (const key of ['window_animation_scale', 'transition_animation_scale', 'animator_duration_scale']) {
      try {
        await this.adb.shell(`settings put global ${key} ${scale}`);
        applied++;
      } catch (e) {}
    }

    const preset = ANIMATION_PRESETS[scale];
    resultEl.innerHTML = `<strong>✅ ${preset.icon} ${preset.label}</strong> · Animaciones a ${scale}x`;
    resultEl.className = 'card-result success';
    this.log('success', `Animaciones: ${preset.label} (${scale}x)`);
  }

  async enableGPU() {
    const resultEl = document.getElementById('gpu-result');
    resultEl.style.display = 'block';
    resultEl.innerHTML = '<span class="spinner"></span> Activando GPU...';

    let applied = 0;
    for (const [key, value] of Object.entries(PERF_SETTINGS_SAFE)) {
      try {
        await this.adb.shell(`settings put global ${key} ${value}`);
        applied++;
      } catch (e) {}
    }

    resultEl.innerHTML = `<strong>✅ GPU Rendering activado</strong> · ${applied} ajustes`;
    resultEl.className = 'card-result success';
    this.log('success', `GPU: ${applied} settings aplicados`);
  }

  async cleanBloatware(mode = 'disable') {
    const brand = document.getElementById('bloatware-brand').value;
    const safeOnly = document.getElementById('bloatware-safe-only').checked;
    let packages = BLOATWARE[brand] || BLOATWARE.generic;
    if (safeOnly) packages = packages.filter(p => p.safe);

    const actionLabel = mode === 'disable' ? 'desactivar' : 'desinstalar';
    const actionLabelCap = mode === 'disable' ? 'Desactivar' : 'Desinstalar';

    const listHtml = packages.map(p => `<li>${p.name} <code>${p.pkg}</code>${!p.safe ? ' ⚠️' : ''}</li>`).join('');
    const warningHtml = mode === 'uninstall'
      ? '<div class="modal-warning">⚠️ Desinstalar es agresivo. Para revertir necesitarás factory reset.</div>'
      : '<div class="modal-info">💡 Podés reactivar después desde "Reactivar Apps" o "Modo Emergencia".</div>';

    this.showModal(
      `${actionLabelCap} ${packages.length} apps`,
      `<p>Se van a ${actionLabel}:</p>
       <ul class="modal-list">${listHtml}</ul>
       ${warningHtml}`,
      async () => { await this._executeBloatware(packages, mode); },
      actionLabelCap,
      mode === 'disable' ? 'btn-primary' : 'btn-danger'
    );
  }

  async _executeBloatware(packages, mode) {
    const resultEl = document.getElementById('bloatware-result');
    resultEl.style.display = 'block';
    resultEl.innerHTML = '<span class="spinner"></span> Procesando...';

    let success = 0;
    let failed = 0;

    for (const pkg of packages) {
      try {
        let out;
        if (mode === 'disable') {
          out = await this.adb.shell(`pm disable-user --user 0 ${pkg.pkg}`);
        } else {
          out = await this.adb.shell(`pm uninstall -k --user 0 ${pkg.pkg}`);
        }
        if (out.includes('Success') || out.includes('disabled')) {
          success++;
          this._disabledApps.push(pkg);
        } else {
          failed++;
        }
      } catch (e) { failed++; }
    }

    const verb = mode === 'disable' ? 'desactivadas' : 'desinstaladas';
    resultEl.innerHTML = `<strong>✅ ${success} apps ${verb}</strong>${failed > 0 ? ` · ⚠️ ${failed} no encontradas` : ''}`;
    resultEl.className = 'card-result success';
    this.log('success', `Bloatware (${mode}): ${success} ${verb}, ${failed} fallidas`);
  }

  async showDisabledApps() {
    const resultEl = document.getElementById('revert-result');
    resultEl.style.display = 'block';
    resultEl.innerHTML = '<span class="spinner"></span> Buscando apps desactivadas...';

    try {
      const output = await this.adb.shell('pm list packages -d');
      const disabledPkgs = output.split('\n')
        .filter(line => line.startsWith('package:'))
        .map(line => line.replace('package:', '').trim());

      if (disabledPkgs.length === 0) {
        resultEl.innerHTML = '✅ No hay apps desactivadas';
        resultEl.className = 'card-result';
        return;
      }

      const allKnown = Object.values(BLOATWARE).flat();
      const items = disabledPkgs.map(pkg => {
        const known = allKnown.find(b => b.pkg === pkg);
        return { pkg, name: known ? known.name : pkg };
      });

      const listHtml = items.map(item => `
        <label class="checkbox-label">
          <input type="checkbox" class="revert-check" value="${item.pkg}" checked>
          <span>${item.name} <code>${item.pkg}</code></span>
        </label>
      `).join('');

      this.showModal(
        `Reactivar Apps (${items.length} desactivadas)`,
        `<p>Seleccioná las apps a reactivar:</p>
         <div class="revert-list">${listHtml}</div>`,
        async () => {
          const checked = document.querySelectorAll('.revert-check:checked');
          const toRestore = Array.from(checked).map(c => c.value);
          await this._restoreApps(toRestore);
        },
        'Reactivar',
        'btn-primary'
      );

      resultEl.style.display = 'none';
    } catch (e) {
      resultEl.innerHTML = `Error: ${e.message}`;
      resultEl.className = 'card-result error';
    }
  }

  async _restoreApps(packages) {
    const resultEl = document.getElementById('revert-result');
    resultEl.style.display = 'block';
    resultEl.innerHTML = '<span class="spinner"></span> Reactivando...';

    let restored = 0;
    for (const pkg of packages) {
      try {
        await this.adb.shell(`pm enable ${pkg}`);
        restored++;
      } catch (e) {}
    }

    resultEl.innerHTML = `<strong>✅ ${restored} apps reactivadas</strong>`;
    resultEl.className = 'card-result success';
    this.log('success', `Revert: ${restored} apps reactivadas`);
  }

  async cleanCache() {
    const resultEl = document.getElementById('cache-result');
    resultEl.style.display = 'block';
    resultEl.innerHTML = '<span class="spinner"></span> Limpiando cache...';

    let done = 0;
    const details = [];
    for (const { cmd, desc } of CACHE_COMMANDS_FULL) {
      try {
        await this.adb.shell(cmd);
        done++;
        details.push(`✅ ${desc}`);
      } catch (e) {
        details.push(`⚠️ ${desc}`);
      }
    }

    resultEl.innerHTML = `<strong>✅ Cache limpiada</strong> · ${done}/${CACHE_COMMANDS_FULL.length} ops
      <div class="cache-details">${details.join('<br>')}</div>`;
    resultEl.className = 'card-result success';
    this.log('success', `Cache: ${done}/${CACHE_COMMANDS_FULL.length} operaciones`);
  }

  async killHeavyApps() {
    const resultEl = document.getElementById('kill-result');
    resultEl.style.display = 'block';
    resultEl.innerHTML = '<span class="spinner"></span> Cerrando apps...';

    const checked = document.querySelectorAll('.kill-app-check:checked');
    const selectedPkgs = Array.from(checked).map(c => c.value);

    if (selectedPkgs.length === 0) {
      resultEl.innerHTML = '⚠️ No seleccionaste ninguna app';
      resultEl.className = 'card-result error';
      return;
    }

    let killed = 0;
    for (const pkg of selectedPkgs) {
      try {
        await this.adb.shell(`am force-stop ${pkg}`);
        killed++;
      } catch (e) {}
    }

    resultEl.innerHTML = `<strong>✅ ${killed} apps cerradas</strong>`;
    resultEl.className = 'card-result success';
    this.log('success', `Kill: ${killed} apps cerradas`);
  }

  async turboMode() {
    const doAnim = document.getElementById('turbo-anim').checked;
    const doGpu = document.getElementById('turbo-gpu').checked;
    const doBloat = document.getElementById('turbo-bloat').checked;
    const doCache = document.getElementById('turbo-cache').checked;
    const doKill = document.getElementById('turbo-kill').checked;
    const total = [doAnim, doGpu, doBloat, doCache, doKill].filter(Boolean).length;
    if (total === 0) return;

    this.showModal(
      '🚀 Activar Modo Turbo',
      `<p>${total} optimizaciones en secuencia.</p>
       <ul class="modal-list">
         ${doAnim ? '<li>⚡ Animaciones ultra rápido (0.3x)</li>' : ''}
         ${doGpu ? '<li>🎨 Forzar GPU rendering</li>' : ''}
         ${doBloat ? '<li>🧹 Desactivar bloatware seguro</li>' : ''}
         ${doCache ? '<li>🗑️ Limpiar cache profunda</li>' : ''}
         ${doKill ? '<li>💀 Cerrar apps pesadas</li>' : ''}
       </ul>`,
      async () => { await this._executeTurbo(doAnim, doGpu, doBloat, doCache, doKill); },
      '🚀 Activar Turbo',
      'btn-danger'
    );
  }

  async _executeTurbo(doAnim, doGpu, doBloat, doCache, doKill) {
    const resultEl = document.getElementById('turbo-result');
    resultEl.style.display = 'block';
    let step = 0;
    const total = [doAnim, doGpu, doBloat, doCache, doKill].filter(Boolean).length;
    this.log('info', '🚀 TURBO: Iniciando...');

    if (doAnim) {
      step++;
      resultEl.innerHTML = `<span class="spinner"></span> 🚀 ${step}/${total}: Animaciones...`;
      for (const key of ['window_animation_scale', 'transition_animation_scale', 'animator_duration_scale']) {
        try { await this.adb.shell(`settings put global ${key} 0.3`); } catch (e) {}
      }
    }
    if (doGpu) {
      step++;
      resultEl.innerHTML = `<span class="spinner"></span> 🚀 ${step}/${total}: GPU...`;
      for (const [key, value] of Object.entries(PERF_SETTINGS_SAFE)) {
        try { await this.adb.shell(`settings put global ${key} ${value}`); } catch (e) {}
      }
    }
    if (doBloat) {
      step++;
      resultEl.innerHTML = `<span class="spinner"></span> 🚀 ${step}/${total}: Bloatware...`;
      const brand = document.getElementById('bloatware-brand').value;
      const packages = (BLOATWARE[brand] || BLOATWARE.generic).filter(p => p.safe);
      for (const pkg of packages) {
        try { await this.adb.shell(`pm disable-user --user 0 ${pkg.pkg}`); } catch (e) {}
      }
    }
    if (doCache) {
      step++;
      resultEl.innerHTML = `<span class="spinner"></span> 🚀 ${step}/${total}: Cache...`;
      for (const { cmd } of CACHE_COMMANDS_FULL) {
        try { await this.adb.shell(cmd); } catch (e) {}
      }
    }
    if (doKill) {
      step++;
      resultEl.innerHTML = `<span class="spinner"></span> 🚀 ${step}/${total}: Kill...`;
      for (const app of HEAVY_APPS) {
        try { await this.adb.shell(`am force-stop ${app.pkg}`); } catch (e) {}
      }
    }

    resultEl.innerHTML = `<strong>🚀 ¡TURBO COMPLETADO!</strong> · ${total} optimizaciones`;
    resultEl.className = 'card-result success turbo';
    this.log('success', `🚀 TURBO: ${total} optimizaciones completadas`);
  }

  async showSystemInfo() {
    const resultEl = document.getElementById('sysinfo-result');
    resultEl.style.display = 'block';
    resultEl.innerHTML = '<span class="spinner"></span> Cargando info...';

    try {
      const props = [
        ['Modelo', 'ro.product.model'],
        ['Fabricante', 'ro.product.manufacturer'],
        ['Android', 'ro.build.version.release'],
        ['SDK', 'ro.build.version.sdk'],
        ['Kernel', 'ro.kernel.version'],
        ['Build', 'ro.build.display.id'],
        ['ABI', 'ro.product.cpu.abi'],
        ['Serial', 'ro.serialno'],
      ];

      let html = '<div class="sysinfo-grid">';
      for (const [label, prop] of props) {
        try {
          const val = (await this.adb.shell(`getprop ${prop}`)).trim();
          html += `<div class="sysinfo-row"><span class="sysinfo-label">${label}</span><span class="sysinfo-value">${val || '—'}</span></div>`;
        } catch (e) {}
      }

      const storage = await this.adb.shell('df /data');
      const storageMatch = storage.match(/\s(\d+)\s+(\d+)\s+(\d+)/);
      if (storageMatch) {
        const totalGB = (parseInt(storageMatch[1]) / 1024 / 1024).toFixed(1);
        const usedGB = (parseInt(storageMatch[2]) / 1024 / 1024).toFixed(1);
        html += `<div class="sysinfo-row"><span class="sysinfo-label">Almacenamiento</span><span class="sysinfo-value">${usedGB} / ${totalGB} GB</span></div>`;
      }

      html += '</div>';
      resultEl.innerHTML = html;
      resultEl.className = 'card-result';
      this.log('info', 'System info cargada');
    } catch (e) {
      resultEl.innerHTML = `Error: ${e.message}`;
      resultEl.className = 'card-result error';
    }
  }

  async runDiagnostics() {
    const resultEl = document.getElementById('diag-result');
    resultEl.innerHTML = '<span class="spinner"></span> Diagnosticando...';

    const checks = [];
    const runCheck = async (name, cmd, checkFn) => {
      try {
        const out = await this.adb.shell(cmd);
        checks.push({ name, ok: checkFn(out), detail: checkFn(out) ? 'OK' : out.trim().slice(0, 100) });
      } catch (e) {
        checks.push({ name, ok: false, detail: e.message });
      }
    };

    await runCheck('Depuración USB', 'settings get global adb_enabled', o => o.trim() === '1');
    await runCheck('GPU Rendering', 'settings get global force_gpu_rendering', o => o.trim() === '1');
    await runCheck('Batería', 'dumpsys battery', o => o.includes('level:'));
    await runCheck('WiFi', 'dumpsys wifi', o => o.includes('Wi-Fi'));
    await runCheck('Almacenamiento', 'df /data', o => !o.includes('No such'));
    await runCheck('Google Play', 'pm list packages com.android.vending', o => o.includes('com.android.vending'));
    await runCheck('SELinux', 'getenforce', o => o.trim() === 'Enforcing');
    await runCheck('Animaciones', 'settings get global window_animation_scale', o => {
      const val = parseFloat(o.trim());
      return !isNaN(val) && val >= 0 && val <= 1;
    });

    let html = '<div class="diag-grid">';
    const allOk = checks.every(c => c.ok);
    html += `<div class="diag-header ${allOk ? 'ok' : 'warn'}">${allOk ? '✅ Todo OK' : '⚠️ Se encontraron problemas'}</div>`;
    for (const check of checks) {
      html += `<div class="diag-row ${check.ok ? 'ok' : 'fail'}">
        <span class="diag-icon">${check.ok ? '✅' : '❌'}</span>
        <span class="diag-name">${check.name}</span>
        <span class="diag-detail">${check.detail}</span>
      </div>`;
    }
    html += '</div>';
    resultEl.innerHTML = html;
    this.log('info', `Diagnóstico: ${checks.filter(c => c.ok).length}/${checks.length} OK`);
  }

  async runShellCommand() {
    const input = document.getElementById('terminal-input');
    const cmd = input.value.trim();
    if (!cmd) return;

    const output = document.getElementById('terminal-output');
    output.textContent += `$ ${cmd}\n`;
    input.value = '';

    try {
      const result = await this.adb.shell(cmd);
      output.textContent += result + '\n';
    } catch (e) {
      output.textContent += `ERROR: ${e.message}\n`;
    }

    output.scrollTop = output.scrollHeight;
    this.log('shell', cmd);
  }

  log(type, message) {
    const time = new Date().toLocaleTimeString();
    this._logEntries.push({ type, message, time });
    const logList = document.getElementById('log-list');
    if (logList) {
      const colors = { success: '#22c55e', error: '#ef4444', info: '#3b82f6', shell: '#a855f7' };
      const entry = document.createElement('div');
      entry.className = 'log-entry';
      entry.innerHTML = `<span class="log-time">${time}</span><span class="log-type" style="color:${colors[type] || '#6b7280'}">${type}</span><span class="log-msg">${message}</span>`;
      logList.appendChild(entry);
      logList.scrollTop = logList.scrollHeight;
    }
  }
}

// Boot
document.addEventListener('DOMContentLoaded', () => {
  try {
    window.app = new PhoneOptimizerApp();
    window.app.init();
  } catch (err) {
    const appEl = document.getElementById('app');
    if (appEl) {
      const loading = document.getElementById('app-loading');
      if (loading) loading.style.display = 'none';
      appEl.innerHTML += `<div style="padding:24px;color:#ef4444;font-family:Inter,sans-serif">
        <h2>⚠️ Error al cargar</h2>
        <p>${err.message}</p>
        <p>Recargá la página o usá los scripts de terminal.</p>
      </div>`;
    }
    console.error('App init error:', err);
  }
});
