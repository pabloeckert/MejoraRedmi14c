/**
 * Phone Optimizer — App Logic
 * Runs entirely in the browser via WebUSB ADB
 */

const BLOATWARE = {
  xiaomi: [
    'com.miui.analytics', 'com.xiaomi.account', 'com.miui.msa.global', 'com.miui.ad',
    'com.miui.daemon', 'com.miui.weather2', 'com.miui.player', 'com.miui.video',
    'com.miui.notes', 'com.miui.compass', 'com.miui.fm', 'com.miui.mishare',
    'com.miui.miwallpaper', 'com.miui.cleanmaster', 'com.miui.bugreport', 'com.miui.qrscanner',
    'com.google.android.music', 'com.google.android.videos', 'com.google.android.googlequicksearchbox',
    'com.google.android.apps.googleassistant', 'com.google.android.apps.docs',
    'com.google.android.apps.photos', 'com.google.ar.lens', 'com.google.android.apps.turbo',
    'com.facebook.katana', 'com.facebook.system', 'com.facebook.appmanager', 'com.facebook.services',
    'com.amazon.appmanager', 'com.netflix.partner.activation',
  ],
  samsung: [
    'com.samsung.android.game.gamehome', 'com.samsung.android.app.tips',
    'com.samsung.android.bixby.agent', 'com.samsung.android.bixby.service',
    'com.samsung.android.visionintelligence', 'com.samsung.android.app.spage',
    'com.samsung.android.themestore', 'com.samsung.android.ardrawing',
    'com.samsung.android.arzone', 'com.samsung.android.app.routines',
    'com.facebook.katana', 'com.facebook.system', 'com.facebook.appmanager',
    'com.netflix.partner.activation',
  ],
  generic: [
    'com.facebook.katana', 'com.facebook.system', 'com.facebook.appmanager',
    'com.amazon.appmanager', 'com.netflix.partner.activation',
  ]
};

const PERF_SETTINGS = {
  'window_animation_scale': '0',
  'transition_animation_scale': '0',
  'animator_duration_scale': '0',
  'force_gpu_rendering': '1',
};

const HEAVY_APPS = [
  'com.facebook.katana', 'com.instagram.android', 'com.zhiliaoapp.musically',
  'com.google.android.youtube', 'com.snapchat.android', 'com.twitter.android',
  'com.whatsapp', 'com.spotify.music',
];

class PhoneOptimizerApp {
  constructor() {
    this.adb = new AdbClient();
    this.connected = false;
    this.deviceInfo = null;
    this.metrics = { cpu: 0, ram: 0, temp: 0, battery: 0 };
    this._metricsInterval = null;
    this._logEntries = [];
  }

  init() {
    this.renderApp();
    this.bindEvents();
    this.checkSupport();
  }

  checkSupport() {
    if (!this.adb.isSupported()) {
      document.getElementById('browser-warning').style.display = 'flex';
    }
  }

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
            <span>Phone Optimizer</span>
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

        <!-- DASHBOARD (hidden until connected) -->
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
            <button class="tab active" data-tab="optimize">🚀 Optimizar</button>
            <button class="tab" data-tab="monitor">📊 Monitor</button>
            <button class="tab" data-tab="diagnose">🔍 Diagnóstico</button>
            <button class="tab" data-tab="shell">💻 Terminal</button>
            <button class="tab" data-tab="log">📋 Log</button>
          </div>

          <!-- OPTIMIZE TAB -->
          <div id="tab-optimize" class="tab-content active">
            <div class="card-grid">
              <div class="card card-action">
                <div class="card-header">
                  <h3>🧹 Limpiar Bloatware</h3>
                  <span class="badge badge-blue">Recomendado</span>
                </div>
                <p>Elimina apps preinstaladas que no necesitás (Facebook, Google apps, analytics, etc.)</p>
                <div class="card-actions">
                  <select id="bloatware-brand" class="select-sm">
                    <option value="xiaomi">Xiaomi / Redmi / POCO</option>
                    <option value="samsung">Samsung</option>
                    <option value="generic">Genérico</option>
                  </select>
                  <button id="btn-bloatware" class="btn btn-primary btn-sm">Limpiar</button>
                </div>
                <div id="bloatware-result" class="card-result" style="display:none"></div>
              </div>

              <div class="card card-action">
                <div class="card-header">
                  <h3>⚡ Optimización Rendimiento</h3>
                  <span class="badge badge-green">Seguro</span>
                </div>
                <p>Desactiva animaciones, fuerza renderizado GPU y limpia cache del sistema.</p>
                <button id="btn-perf" class="btn btn-primary btn-sm">Optimizar</button>
                <div id="perf-result" class="card-result" style="display:none"></div>
              </div>

              <div class="card card-action">
                <div class="card-header">
                  <h3>💀 Kill Apps Pesadas</h3>
                  <span class="badge badge-amber">Agresivo</span>
                </div>
                <p>Forzá el cierre de apps que consumen mucha RAM: Facebook, Instagram, TikTok, etc.</p>
                <button id="btn-kill" class="btn btn-warning btn-sm">Kill All</button>
                <div id="kill-result" class="card-result" style="display:none"></div>
              </div>

              <div class="card card-action">
                <div class="card-header">
                  <h3>🗑️ Limpiar Cache</h3>
                  <span class="badge badge-green">Seguro</span>
                </div>
                <p>Elimina thumbnails, archivos temporales y cache de apps acumulada.</p>
                <button id="btn-cache" class="btn btn-primary btn-sm">Limpiar</button>
                <div id="cache-result" class="card-result" style="display:none"></div>
              </div>

              <div class="card card-action">
                <div class="card-header">
                  <h3>🚀 Modo Turbo</h3>
                  <span class="badge badge-red">Extremo</span>
                </div>
                <p>Optimización completa: bloatware + rendimiento + kill + cache. Todo en uno.</p>
                <button id="btn-turbo" class="btn btn-danger btn-sm">Activar Turbo</button>
                <div id="turbo-result" class="card-result" style="display:none"></div>
              </div>

              <div class="card card-action">
                <div class="card-header">
                  <h3>📦 Info del Sistema</h3>
                </div>
                <p>Ver detalles completos del dispositivo: modelo, Android, kernel, almacenamiento.</p>
                <button id="btn-sysinfo" class="btn btn-secondary btn-sm">Ver Info</button>
                <div id="sysinfo-result" class="card-result" style="display:none"></div>
              </div>
            </div>
          </div>

          <!-- MONITOR TAB -->
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

          <!-- DIAGNOSE TAB -->
          <div id="tab-diagnose" class="tab-content">
            <div class="card">
              <h3>🔍 Diagnóstico del dispositivo</h3>
              <button id="btn-diag" class="btn btn-primary btn-sm" style="margin-bottom:16px">Ejecutar Diagnóstico</button>
              <div id="diag-result" class="diag-result">Hacé clic en "Ejecutar Diagnóstico" para analizar tu dispositivo.</div>
            </div>
          </div>

          <!-- SHELL TAB -->
          <div id="tab-shell" class="tab-content">
            <div class="terminal-container">
              <div id="terminal-output" class="terminal-output">Phone Optimizer Terminal v1.0\nEscribí comandos ADB shell. Ej: dumpsys battery, getprop ro.product.model\n\n</div>
              <div class="terminal-input-row">
                <span class="terminal-prompt">$</span>
                <input id="terminal-input" type="text" class="terminal-input" placeholder="shell command..." autocomplete="off">
                <button id="btn-shell-run" class="btn btn-primary btn-sm">Ejecutar</button>
              </div>
            </div>
          </div>

          <!-- LOG TAB -->
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
    `;
  }

  bindEvents() {
    // Connect/Disconnect
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

    // Actions
    document.getElementById('btn-bloatware').addEventListener('click', () => this.cleanBloatware());
    document.getElementById('btn-perf').addEventListener('click', () => this.optimizePerformance());
    document.getElementById('btn-kill').addEventListener('click', () => this.killHeavyApps());
    document.getElementById('btn-cache').addEventListener('click', () => this.cleanCache());
    document.getElementById('btn-turbo').addEventListener('click', () => this.turboMode());
    document.getElementById('btn-sysinfo').addEventListener('click', () => this.showSystemInfo());
    document.getElementById('btn-diag').addEventListener('click', () => this.runDiagnostics());

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
  }

  async connect() {
    const btn = document.getElementById('btn-connect');
    btn.disabled = true;
    btn.textContent = 'Conectando...';

    try {
      // requestDevice MUST be called directly in user gesture handler (no await before it)
      let device = null;
      try {
        device = await navigator.usb.requestDevice({ filters: [] });
      } catch (e) {
        // User cancelled — try already-authorized devices
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

      // Get device properties
      const model = await this.adb.shell('getprop ro.product.model');
      const android = await this.adb.shell('getprop ro.build.version.release');
      const manufacturer = await this.adb.shell('getprop ro.product.manufacturer');

      document.getElementById('device-model').textContent = `${manufacturer.trim()} ${model.trim()}`;
      document.getElementById('device-android').textContent = `Android ${android.trim()}`;

      // Update UI
      document.getElementById('status-badge').className = 'status-badge connected';
      document.getElementById('status-text').textContent = 'Conectado';
      document.getElementById('btn-connect').style.display = 'none';
      document.getElementById('btn-disconnect').style.display = 'inline-flex';
      document.getElementById('empty-state').style.display = 'none';
      document.getElementById('dashboard').style.display = 'block';

      this.log('success', `Conectado: ${manufacturer.trim()} ${model.trim()} (Android ${android.trim()})`);

      // Start metrics
      this.startMetrics();

    } catch (err) {
      this.log('error', `Error de conexión: ${err.message}`);
      alert(`Error: ${err.message}`);
    } finally {
      btn.disabled = false;
      btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg> Conectar`;
    }
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

  startMetrics() {
    this.updateMetrics();
    this._metricsInterval = setInterval(() => this.updateMetrics(), 3000);
  }

  stopMetrics() {
    if (this._metricsInterval) clearInterval(this._metricsInterval);
  }

  async updateMetrics() {
    if (!this.connected) return;
    try {
      // Battery
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

      // RAM
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

      // CPU (simplified — load average)
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
      // Device may have disconnected
    }
  }

  async cleanBloatware() {
    const brand = document.getElementById('bloatware-brand').value;
    const packages = BLOATWARE[brand] || BLOATWARE.generic;
    const resultEl = document.getElementById('bloatware-result');
    resultEl.style.display = 'block';
    resultEl.innerHTML = '<span class="spinner"></span> Limpiando...';

    let removed = 0;
    let failed = 0;
    const errors = [];

    for (const pkg of packages) {
      try {
        const out = await this.adb.shell(`pm uninstall -k --user 0 ${pkg}`);
        if (out.includes('Success')) {
          removed++;
        } else {
          failed++;
        }
      } catch (e) {
        failed++;
        errors.push(`${pkg}: ${e.message}`);
      }
    }

    resultEl.innerHTML = `<strong>✅ ${removed} apps eliminadas</strong>${failed > 0 ? ` · ⚠️ ${failed} no encontradas` : ''}`;
    resultEl.className = 'card-result success';
    this.log('success', `Bloatware: ${removed} eliminadas, ${failed} no encontradas`);
  }

  async optimizePerformance() {
    const resultEl = document.getElementById('perf-result');
    resultEl.style.display = 'block';
    resultEl.innerHTML = '<span class="spinner"></span> Optimizando...';

    let applied = 0;
    for (const [key, value] of Object.entries(PERF_SETTINGS)) {
      try {
        await this.adb.shell(`settings put global ${key} ${value}`);
        applied++;
      } catch (e) {}
    }

    resultEl.innerHTML = `<strong>✅ ${applied} ajustes aplicados</strong> · Animaciones desactivadas, GPU forzada`;
    resultEl.className = 'card-result success';
    this.log('success', `Performance: ${applied} settings aplicados`);
  }

  async killHeavyApps() {
    const resultEl = document.getElementById('kill-result');
    resultEl.style.display = 'block';
    resultEl.innerHTML = '<span class="spinner"></span> Cerrando apps...';

    let killed = 0;
    for (const pkg of HEAVY_APPS) {
      try {
        await this.adb.shell(`am force-stop ${pkg}`);
        killed++;
      } catch (e) {}
    }

    resultEl.innerHTML = `<strong>✅ ${killed} apps cerradas</strong>`;
    resultEl.className = 'card-result success';
    this.log('success', `Kill: ${killed} apps forzadas a cerrar`);
  }

  async cleanCache() {
    const resultEl = document.getElementById('cache-result');
    resultEl.style.display = 'block';
    resultEl.innerHTML = '<span class="spinner"></span> Limpiando cache...';

    const commands = [
      'rm -rf /sdcard/DCIM/.thumbnails/* 2>/dev/null',
      'rm -rf /data/local/tmp/* 2>/dev/null',
      'rm -rf /data/tombstones/* 2>/dev/null',
      'rm -rf /data/anr/* 2>/dev/null',
      'pm trim-caches 512M',
    ];

    let done = 0;
    for (const cmd of commands) {
      try {
        await this.adb.shell(cmd);
        done++;
      } catch (e) {}
    }

    resultEl.innerHTML = `<strong>✅ Cache limpiada</strong> · ${done} operaciones completadas`;
    resultEl.className = 'card-result success';
    this.log('success', `Cache: ${done} operaciones de limpieza`);
  }

  async turboMode() {
    const resultEl = document.getElementById('turbo-result');
    resultEl.style.display = 'block';
    resultEl.innerHTML = '<span class="spinner"></span> 🚀 Modo Turbo activado...';

    this.log('info', '🚀 TURBO: Iniciando optimización completa...');

    // Step 1: Bloatware
    resultEl.innerHTML = '<span class="spinner"></span> 🚀 Fase 1/4: Bloatware...';
    const brand = document.getElementById('bloatware-brand').value;
    const packages = BLOATWARE[brand] || BLOATWARE.generic;
    for (const pkg of packages) {
      try { await this.adb.shell(`pm uninstall -k --user 0 ${pkg}`); } catch (e) {}
    }

    // Step 2: Performance
    resultEl.innerHTML = '<span class="spinner"></span> 🚀 Fase 2/4: Rendimiento...';
    for (const [key, value] of Object.entries(PERF_SETTINGS)) {
      try { await this.adb.shell(`settings put global ${key} ${value}`); } catch (e) {}
    }

    // Step 3: Kill
    resultEl.innerHTML = '<span class="spinner"></span> 🚀 Fase 3/4: Kill apps...';
    for (const pkg of HEAVY_APPS) {
      try { await this.adb.shell(`am force-stop ${pkg}`); } catch (e) {}
    }

    // Step 4: Cache
    resultEl.innerHTML = '<span class="spinner"></span> 🚀 Fase 4/4: Cache...';
    const cacheCmds = [
      'rm -rf /sdcard/DCIM/.thumbnails/* 2>/dev/null',
      'rm -rf /data/local/tmp/* 2>/dev/null',
      'rm -rf /data/tombstones/* 2>/dev/null',
      'pm trim-caches 512M',
    ];
    for (const cmd of cacheCmds) {
      try { await this.adb.shell(cmd); } catch (e) {}
    }

    resultEl.innerHTML = '<strong>🚀 ¡TURBO COMPLETADO!</strong> · Bloatware + Rendimiento + Kill + Cache';
    resultEl.className = 'card-result success turbo';
    this.log('success', '🚀 TURBO: Optimización completa finalizada');
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

      // Storage
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
        const ok = checkFn(out);
        checks.push({ name, ok, detail: ok ? 'OK' : out.trim().slice(0, 100) });
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

    // Build HTML
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
  window.app = new PhoneOptimizerApp();
  window.app.init();
});
