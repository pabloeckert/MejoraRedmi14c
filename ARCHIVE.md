# Phone Optimizer — Documentación del Proyecto

## Historia

Este proyecto empezó como una app de escritorio **Electron** para optimizar teléfonos Android vía ADB. El 5 de mayo de 2026, se reconvirtió completamente a una **aplicación web** que corre directo en el navegador usando **WebUSB**.

### Qué se hizo (5 mayo 2026)

1. **Eliminé todo el código Electron/Node.js** — 131 archivos, ~27,000 líneas de código eliminadas:
   - `src/` (40+ archivos: ADB client, core engine, ML, UI React, extensions, logs)
   - `build/` (iconos, configs de electron-builder)
   - `installer/` (exe, scripts de instalación, docs)
   - `plugins/`, `extensions/`, `devices/`, `logs/`, `ml/`
   - `main.js`, `preload.js`, `package.json`, `package-lock.json`
   - `vite.config.js`, `tailwind.config.js`, `postcss.config.js`, `electron-builder.yml`
   - 25+ archivos markdown de documentación
   - `analisis-total.bat`, `Resumen_Integrado_del_Proyecto_MejoraRedmi14c.docx`

2. **Implementé ADB sobre WebUSB** — Protocolo ADB completo desde cero:
   - `adb.js` — Implementación del protocolo ADB (CNXN, AUTH, OPEN, WRTE, CLSE)
   - RSA key generation via Web Crypto API (RSASSA-PKCS1-v1_5, 2048-bit)
   - USB bulk transfers con message framing de 24 bytes
   - Sin dependencias externas

3. **Creé la app web** — `app.js` + `styles.css` + `index.html`:
   - Conexión USB con picker nativo del navegador
   - Limpieza de bloatware (Xiaomi, Samsung, genérico)
   - Optimización de rendimiento (animaciones, GPU)
   - Kill apps pesadas (Facebook, Instagram, TikTok, etc.)
   - Limpieza de cache
   - Modo Turbo (todo en uno)
   - Monitor en vivo (CPU, RAM, temperatura, batería)
   - Diagnóstico del sistema
   - Terminal ADB shell
   - Log de operaciones

4. **Deploy en GitHub Pages** — Workflow automático en push a `main`

### Problemas resueltos

| Problema | Causa | Solución |
|---|---|---|
| 404 en GitHub Pages | Deploy no había terminado | Esperar ~30 seg después del push |
| `SecurityError: requestDevice` | `await` antes de `requestDevice()` pierde el user gesture context | Llamar `requestDevice()` directamente en el click handler |
| Teléfono no aparece en picker USB | Servidor ADB del sistema toma el USB | `adb kill-server` antes de usar la app |
| `python3` no encontrado en Windows | Python no instalado | Usar `npx serve .` (Node.js) |

### Estructura final del repo

```
MejoraRedmi14c/
├── index.html          ← Página principal (carga adb.js + app.js)
├── adb.js              ← Protocolo ADB via WebUSB (~300 líneas)
├── app.js              ← Lógica de la app (~600 líneas)
├── styles.css          ← Estilos CSS (~350 líneas)
├── favicon.svg         ← Ícono del celular
├── README.md           ← Guía de uso
├── .gitignore
└── .github/workflows/deploy.yml  ← GitHub Pages deploy
```

**Total: 8 archivos, ~88KB**

### Cómo correr localmente

```bash
# Clonar
git clone https://github.com/pabloeckert/MejoraRedmi14c.git
cd MejoraRedmi14c

# Liberar USB (importante)
adb kill-server

# Levantar server
npx serve .

# Abrir en Chrome
# http://localhost:3000
```

### Limitaciones conocidas

- **Solo funciona en Chromium** (Chrome, Edge, Opera) — WebUSB no soportado en Firefox/Safari
- **No puede acceder a CPU real** — usa `/proc/loadavg` como proxy
- **No puede listar procesos** — `ps` en Android es limitado sin root
- **No puede desinstalar apps del sistema** — solo para usuario (`--user 0`)
- **ADB y WebUSB no pueden compartir USB** — hay que matar el servidor ADB primero

### Decisiones técnicas

- **WebUSB en vez de WebSocket proxy** — No requiere servidor intermedio, todo es client-side
- **Implementación ADB propia en vez de librería** — Evita dependencias CDN, más control, más educativo
- **HTML/CSS/JS vanilla en vez de React** — Cero build step, deploy directo a GitHub Pages
- **GitHub Pages en vez de Vercel/Netlify** — Simple, gratis, ya tenían el repo en GitHub
