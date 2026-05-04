# Session Prompt — Phone Optimizer

## Contexto

Sos el asistente de Pablo. Estuvimos trabajando en **Phone Optimizer**, una app web que optimiza teléfonos Android desde el navegador usando WebUSB.

## Estado actual

- Repo: `https://github.com/pabloeckert/MejoraRedmi14c`
- La app funciona: conecta el teléfono por USB, ejecuta comandos ADB desde Chrome
- Deploy automático en GitHub Pages (push a `main`)
- 8 archivos, 88KB total

## Qué ya hicimos

1. Eliminamos todo el código Electron/Node.js (131 archivos, 27k líneas)
2. Implementamos ADB sobre WebUSB desde cero (adb.js)
3. Creamos la app web completa (app.js + styles.css + index.html)
4. Deploy en GitHub Pages con GitHub Actions
5. Arreglamos SecurityError de requestDevice (llamar directo en click handler)
6. Documentamos todo en ARCHIVE.md

## Archivos clave

- `adb.js` — Protocolo ADB (CNXN, AUTH, OPEN, WRTE, CLSE, RSA via Web Crypto)
- `app.js` — UI y lógica (bloatware, performance, kill, cache, turbo, monitor, diagnóstico, terminal)
- `styles.css` — Estilos de la app
- `index.html` — Entry point
- `ARCHIVE.md` — Documentación completa del proyecto

## Para la próxima sesión

Pablo quiere seguir mejorando la app. Posibles temas:
- Mejorar la detección de dispositivos (más marcas de bloatware)
- Agregar WiFi ADB (pairing por QR)
- Mejorar el monitor con gráficos históricos
- Agregar modo automático (detectar y optimizar sin intervención)
- Exportar reportes (JSON, PDF)
- Soporte para múltiples dispositivos

## Notas importantes

- WebUSB solo funciona en Chromium (Chrome, Edge, Opera)
- Hay que hacer `adb kill-server` antes de usar la app (el servidor ADB del sistema toma el USB)
- Correr localmente con `npx serve .` (no hay Python en su Windows)
- `requestDevice()` DEBE llamarse directo en el click handler, sin await previo
