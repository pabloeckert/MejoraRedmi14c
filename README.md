# 🔧 Phone Optimizer

**Optimizador inteligente para Android** — Funciona directo en tu navegador.

🌐 **[pabloeckert.github.io/MejoraRedmi14c](https://pabloeckert.github.io/MejoraRedmi14c/)**

## Cómo Usar

1. Abrí **Chrome, Edge u Opera** (WebUSB no funciona en Firefox/Safari)
2. Activá **depuración USB** en tu teléfono Android
3. Conectá el teléfono por USB
4. Abrí la página y hacé clic en **"Conectar"**
5. Aceptá la autorización en el teléfono

### Correr Local (Recomendado)

```bash
git clone https://github.com/pabloeckert/MejoraRedmi14c.git
cd MejoraRedmi14c
adb kill-server
python3 -m http.server 8000
```

Abrir `http://localhost:8000` en Chrome.

> `adb kill-server` libera el USB para que el navegador pueda usarlo.

## Funcionalidades

- 🧹 **Limpieza de bloatware** — Xiaomi, Samsung, genérico
- ⚡ **Optimización de rendimiento** — Animaciones, GPU, cache
- 💀 **Kill apps pesadas** — Facebook, Instagram, TikTok, etc.
- 🚀 **Modo Turbo** — Todo en uno
- 📊 **Monitor en vivo** — CPU, RAM, temperatura, batería
- 🔍 **Diagnóstico** — Verificaciones del sistema
- 💻 **Terminal** — Comandos ADB shell
- 📋 **Log** — Registro de operaciones

## Requisitos

- Navegador Chromium (Chrome, Edge, Opera)
- Android 7.0+
- Cable USB con datos
- Depuración USB activada

## Licencia

MIT — Pablo & Sindy.
