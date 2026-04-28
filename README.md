# 📱 MejoraRedmi14c

> Optimización avanzada para **Xiaomi Redmi 14C** vía ADB — Sin root, sin riesgo, todo reversible.

[![CI](https://github.com/pabloeckert/MejoraRedmi14c/actions/workflows/deploy.yml/badge.svg)](https://github.com/pabloeckert/MejoraRedmi14c/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-terracotta.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-83%20passing-brightgreen)](#testing)
[![React](https://img.shields.io/badge/React-19.2-61dafb.svg)](https://react.dev)
[![Electron](https://img.shields.io/badge/Electron-41.x-47848f.svg)](https://electronjs.org)

**🌐 [Try it live](https://pabloeckert.github.io/MejoraRedmi14c/)** · **⬇️ [Download Desktop App](https://github.com/pabloeckert/MejoraRedmi14c/releases)**

---

## ¿Qué hace?

| Módulo | Qué hace | Riesgo |
|--------|----------|--------|
| 🗄️ **Backup** | Respaldar contactos, WhatsApp, fotos, APKs, sistema a PC | Ninguno |
| 🧹 **Debloat** | Eliminar bloatware con 3 perfiles (Seguro / Equilibrado / Agresivo) | Bajo-Medio |
| ⚡ **Performance** | Animaciones 0.5x, GPU rendering, modo rendimiento, RAM virtual off | Bajo |
| 🎨 **Estética** | Blur nativo (glassmorphism), 90Hz forzado | Bajo |
| 🔄 **Rescate** | Restaurar apps eliminadas, fixes rápidos, restauración completa | Ninguno |
| 🔓 **Root** | Guía paso a paso con Magisk + protección anti-bootloop | Avanzado |

## ¿Por qué?

El Redmi 14C es un teléfono capaz con 4GB RAM y 256GB storage, pero viene con:
- **45+ apps de bloatware** que consumen RAM y batería
- **Animaciones lentas** que hacen que se sienta lento
- **RAM virtual activada** que ralentiza el almacenamiento

**Resultado:** Después de optimizar, el teléfono se siente como un dispositivo de gama alta.

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

## 📊 Antes / Después

| Métrica | Antes | Después |
|---------|-------|---------|
| Apps en segundo plano | ~15 | ~4 |
| RAM libre | ~1.2GB | ~2.1GB |
| Velocidad de animación | 1.0x | 0.5x |
| Refresh rate | 60Hz (auto) | 90Hz (forzado) |
| Bloatware activo | 45+ | ~10 |

---

## 🏗️ Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19 + Vite 8 + Tailwind CSS 4 |
| Animaciones | Framer Motion (spring physics) |
| Desktop | Electron 41 |
| Testing | Vitest (70 unit) + Playwright (13 E2E) |
| CI/CD | GitHub Actions → GitHub Pages |
| i18n | Español (voseo) + English |

---

## 📁 Arquitectura

```
src/
├── App.jsx              # Shell delgado
├── components/          # UI + lógica compartida
│   ├── ui/              # GlassCard, Badge, RiskBadge, ImpactBadge, CopyButton
│   ├── AssistantGuide   # Asistente contextual por módulo
│   ├── ErrorBoundary    # Error isolation por módulo
│   ├── Toast            # Notificaciones
│   ├── Onboarding       # Wizard de primera vez
│   └── SettingsPanel    # Tema, grain, animaciones, idioma
├── modules/             # 6 módulos independientes (code-split)
├── services/            # scriptGenerator (generación de scripts bash)
├── data/                # device.js (datos) + modules.js (navegación)
├── hooks/               # useLocalStorage, useI18n, useToast, useElectron
├── locales/             # es.json + en.json (130+ strings)
└── test/                # 70 unit tests
e2e/                     # 13 E2E tests (Playwright)
```

---

## 🧪 Testing

```bash
npm run test:run       # 70 unit tests (Vitest)
npm run test:e2e       # 13 E2E tests (Playwright)
npm run test:coverage  # Coverage report
```

**Cobertura:**
- Script generator: 18 tests (bash, módulos, errores, restore)
- Device data: 24 tests (configuración, bloatware, tweaks, backup)
- Components: 14 tests (GlassCard, Badge, RiskBadge, ImpactBadge, ErrorBoundary)
- Accessibility: 8 tests (ARIA attributes)
- LocalStorage: 6 tests (persistencia)
- E2E: 13 tests (navegación, módulos, configuración, descarga)

---

## 🌍 i18n

Soporte para **español** (voseo argentino) e **inglés**.
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
