# 📱 MejoraRedmi14c

> Optimización avanzada para **Xiaomi Redmi 14C** vía ADB — Sin root, sin riesgo, todo reversible.

[![CI](https://github.com/pabloeckert/MejoraRedmi14c/actions/workflows/deploy.yml/badge.svg)](https://github.com/pabloeckert/MejoraRedmi14c/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-terracotta.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-116%20passing-brightgreen)](#testing)
[![React](https://img.shields.io/badge/React-19.2-61dafb.svg)](https://react.dev)
[![Electron](https://img.shields.io/badge/Electron-41.x-47848f.svg)](https://electronjs.org)

**🌐 [Try it live](https://pabloeckert.github.io/MejoraRedmi14c/)** · **⬇️ [Download Desktop App](https://github.com/pabloeckert/MejoraRedmi14c/releases)**

---

## ¿Qué hace?

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────────┐
│  Seleccioná │ ──▶ │  Genera un   │ ──▶ │  Conectá el │ ──▶ │  Tu teléfono │
│  los módulos│     │  script .sh  │     │  teléfono   │     │  como nuevo  │
└─────────────┘     └──────────────┘     └─────────────┘     └──────────────┘
```

| Módulo | Qué hace | Riesgo |
|--------|----------|--------|
| 🗄️ **Backup** | Respaldar contactos, WhatsApp, fotos, APKs, sistema a PC | Ninguno |
| 🧹 **Debloat** | Eliminar bloatware con 3 perfiles (Seguro / Equilibrado / Agresivo) | Bajo-Medio |
| ⚡ **Performance** | Animaciones 0.5x, GPU rendering, modo rendimiento, RAM virtual off | Bajo |
| 🎨 **Estética** | Blur nativo (glassmorphism), 90Hz forzado | Bajo |
| 🔄 **Rescate** | Restaurar apps eliminadas, fixes rápidos, restauración completa | Ninguno |
| 🔓 **Root** | Guía paso a paso con Magisk + protección anti-bootloop | Avanzado |

---

## 📊 Antes / Después

| Métrica | Antes | Después |
|---------|-------|---------|
| Apps en segundo plano | ~15 | ~4 |
| RAM libre | ~1.2GB | ~2.1GB |
| Velocidad de animación | 1.0x | 0.5x |
| Refresh rate | 60Hz (auto) | 90Hz (forzado) |
| Bloatware activo | 45+ | ~10 |

---

## 🚀 Uso rápido

### Web (instantáneo)
```
https://pabloeckert.github.io/MejoraRedmi14c/
```

### Desktop (Electron)
```bash
git clone https://github.com/pabloeckert/MejoraRedmi14c.git
cd MejoraRedmi14c
npm install
npm run electron:dev
```

### Desarrollo
```bash
npm install
npm run dev          # localhost:5173
npm run test         # tests en watch mode
npm run test:e2e     # E2E con Playwright
npm run build        # build de producción
```

---

## 🏗️ Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19 + Vite 8 + Tailwind CSS 4 |
| Animaciones | Framer Motion (spring physics) |
| Desktop | Electron 41 |
| Testing | Vitest (70 unit) + Playwright (18 E2E) |
| Component Docs | Storybook 8 |
| CI/CD | GitHub Actions → GitHub Pages |
| i18n | Español + English + Português + Français |

---

## 📁 Arquitectura

```
src/
├── App.jsx              # Shell delgado
├── components/          # UI + lógica compartida
│   ├── ui/              # GlassCard, Badge, RiskBadge, ImpactBadge, CopyButton
│   ├── AssistantGuide   # Asistente contextual por módulo
│   ├── Disclaimer       # Aviso legal (primera visita)
│   ├── ErrorBoundary    # Error isolation por módulo
│   ├── Toast            # Notificaciones
│   ├── Onboarding       # Wizard de primera vez
│   └── SettingsPanel    # Tema, grain, animaciones, idioma
├── modules/             # 6 módulos independientes (code-split)
├── services/            # scriptGenerator (generación de scripts bash)
├── data/                # device.js (datos) + modules.js (navegación) + bloatware.json
├── hooks/               # useLocalStorage, useI18n, useToast, useElectron, useAnalytics
├── locales/             # es.json + en.json (130+ strings)
└── test/                # 70 unit tests
e2e/                     # 13 E2E tests (Playwright)
```

---

## 🧪 Testing

```bash
npm run test:run       # 70 unit tests (Vitest)
npm run test:e2e       # 37 E2E tests (Playwright + modules + accessibility + visual regression)
npm run test:coverage  # Coverage report
```

**Cobertura:**
- Script generator: 18 tests (bash, módulos, errores, restore)
- Device data: 24 tests (configuración, bloatware, tweaks, backup)
- Components: 14 tests (GlassCard, Badge, RiskBadge, ImpactBadge, ErrorBoundary)
- Accessibility: 8 tests (ARIA attributes)
- LocalStorage: 6 tests (persistencia)
- E2E App: 13 tests (navegación, configuración, descarga)
- E2E Modules: 7 tests (backup, debloat, performance, aesthetics, rescue, root)
- E2E Accessibility: 12 tests (ARIA, landmarks, keyboard nav, focus)
- Visual Regression: 5 tests (homepage, módulos, dark mode)

---

## 🔒 Seguridad

- **Sin ejecución directa** — genera scripts, no ejecuta ADB automáticamente
- **CSP configurado** — Content Security Policy en Electron
- **Context isolation** — Electron contextBridge seguro
- **Sin backend** — todo es client-side, no hay datos que interceptar
- **Sin telemetría** — analytics local only (localStorage, cero PII)
- **Disclaimer legal** — aviso de riesgos en primera visita
- **npm audit limpio** — 0 vulnerabilidades

---

## 🌍 i18n

Soporte para **español** (voseo argentino), **inglés**, **portugués** y **francés**.
Cambio de idioma desde Configuración → Idioma.

---

## 🤝 Contribuir

Ver [CONTRIBUTING.md](CONTRIBUTING.md).

---

## 📄 Licencia

MIT — ver [LICENSE](LICENSE).

---

## Agradecimientos

- [Universal Android Debloater Next Generation](https://github.com/Universal-Debloater-Alliance/universal-android-debloater-next-generation)
- [debloat-hyperos-adb](https://github.com/matthieu-pierson/debloat-hyperos-adb)
- [adb-turbo](https://github.com/f959/adb-turbo)
- [Shizuku](https://github.com/RikkaApps/Shizuku)
