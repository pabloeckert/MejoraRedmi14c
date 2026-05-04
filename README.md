# 🔧 Phone Optimizer

[![Build](https://github.com/pabloeckert/MejoraRedmi14c/actions/workflows/build.yml/badge.svg)](https://github.com/pabloeckert/MejoraRedmi14c/actions/workflows/build.yml)
[![Release](https://img.shields.io/github/v/release/pabloeckert/MejoraRedmi14c?label=Release)](https://github.com/pabloeckert/MejoraRedmi14c/releases/latest)

**Optimizador inteligente para Android** — App de escritorio Electron que optimiza dispositivos Android vía ADB.

## Requisitos

- Node.js 18+
- ADB en `PATH` (`adb version`)
- Android 7.0+ con depuración USB activada

## Instalación

```bash
git clone https://github.com/pabloeckert/MejoraRedmi14c.git
cd MejoraRedmi14c
npm install
```

## Desarrollo

```bash
npm run dev:electron   # Vite + Electron con hot-reload
```

## Build

```bash
npm run build          # Build completo (todas las plataformas)
npm run build:win      # Windows (.exe)
npm run build:linux    # Linux (.AppImage)
npm run build:mac      # macOS (.dmg)
```

## Release

Los releases se generan automáticamente con GitHub Actions:

```bash
git tag v1.1.0
git push origin v1.1.0
```

Esto crea un GitHub Release con los binarios para Windows, macOS y Linux.

## Licencia

MIT — Pablo & Sindy.
