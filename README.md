# PhoneOptimizer Pro v6.0 — Redmi 14C / HyperOS 3

Toolkit de optimización Android para **Redmi 14C (HyperOS 3 / Android 16 / Helio G81 Ultra)**. Un solo comando para transformar el teléfono en modo Poco.

## Requisitos

- ADB instalado (`android-tools-adb` / `android-platform-tools`)
- SQLite3 instalado (`sqlite3`)
- bash 4+ (en macOS: `brew install bash`)
- Cable USB datos + Depuración USB activada en el teléfono

## Uso — Una sola línea

```bash
chmod +x src/cli/run.sh && ./src/cli/run.sh
```

El script detecta automáticamente:
- **Primera vez** → Optimización completa (Poco Mode)
- **Cada 7 días** → Mantenimiento semanal (regresiones OTA + cache)
- **Siempre** → Muestra menú si no corresponde ninguna de las anteriores

## Modos disponibles

| Flag | Modo | Duración aprox. |
|---|---|---|
| `./src/cli/run.sh` | Auto-detección | variable |
| `./src/cli/run.sh --full` / `-f` | Optimización completa | 15-30 min |
| `./src/cli/run.sh --maintenance` / `-s` | Mantenimiento semanal | < 5 min |
| `./src/cli/run.sh --monitor` / `-m` | Monitoreo en tiempo real | continuo |
| `./src/cli/run.sh --emergency` / `-e` | Restaurar todo a fábrica | 2-3 min |

## Qué hace el Poco Mode

El Poco Mode equipara el rendimiento del Redmi 14C al 85% de un Poco X7 Pro mediante:

- **~80+ apps de bloatware desactivadas** (telemetría, ads, apps Xiaomi/Google/Facebook no usadas)
- **GPU forzada** con Vulkan + MSAA + sin draw defer
- **Animaciones 0.3x** (instantáneas, mínimo para HyperOS 3)
- **Resolución 612x1360 @ 260dpi** (+15% FPS sin diferencia visual notable)
- **Cámara y WhatsApp compilados en speed mode** + pre-calentados en memoria
- **Memory Extension HyperOS 3** activada (4GB → 8GB virtual)
- **Swappiness 20**, LMK agresivo, HWUI cache XL

## Soporte para 2 dispositivos

Si conectás los dos Redmi 14C a la vez, el script muestra un menú de selección con el modelo y un apodo automático ("Redmi-1", "Redmi-2"). Cada dispositivo tiene su propio historial en `tools/data/devices.db`.

## Ciclo de 7 días

El script detecta automáticamente si han pasado 7+ días desde el último run y lanza el mantenimiento semanal. El mantenimiento corrige regresiones OTA (apps que HyperOS reactiva tras actualizar) y limpia cache.

## Seguridad

- `com.xiaomi.joyose` **NUNCA se toca** — es el gestor térmico del Helio G81 Ultra. Desactivarlo causa sobrecalentamiento.
- Temperatura bloqueante: si el teléfono supera 42°C, el script aborta.
- Backup automático completo antes de cada optimización (`tools/backups/`).
- Restauración completa: `./src/cli/run.sh --emergency`

## Herramientas adicionales (scripts legados, siguen funcionando)

| Script | Función |
|---|---|
| `src/cli/benchmark.sh` | Mide CPU, RAM y red — comparar antes/después |
| `src/cli/diagnostico.sh` | Lee métricas del sistema |
| `src/cli/optimize-boot.sh` | Optimiza receivers de arranque |
| `src/cli/measure-boot.sh` | Mide tiempo real de encendido |
| `src/cli/mega-verificar.sh` | Verifica si los tweaks se aplicaron |

## Web App alternativa

Si preferís no usar la terminal, abrí `src/web/index.html` en Chrome/Edge/Opera:

```bash
adb kill-server
python3 -m http.server 8000
# → http://localhost:8000
```

---

Para entender la arquitectura del código, leé [CLAUDE.md](CLAUDE.md).
Para el tutorial de configuración de ADB, leé [TUTORIAL.md](TUTORIAL.md).
