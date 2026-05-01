# ADB_SCRIPTS.md — Scripts ADB de Alto Nivel

## Bloatware Eliminado (Xiaomi/Redmi/POCO)

### Analytics & Tracking
| Paquete | Descripción |
|---------|-------------|
| `com.miui.analytics` | Telemetría MIUI |
| `com.xiaomi.account` | Cuenta Xiaomi (no esencial) |
| `com.miui.msa.global` | Mobile Security Alliance |
| `com.miui.ad` | Servicios de anuncios MIUI |
| `com.miui.daemon` | Daemon de servicios MIUI |

### Apps Preinstaladas
| Paquete | Descripción |
|---------|-------------|
| `com.miui.weather2` | Clima MIUI |
| `com.miui.player` | Reproductor MIUI |
| `com.miui.video` | Video MIUI |
| `com.miui.notes` | Notas MIUI |
| `com.miui.calculator` | Calculadora MIUI |
| `com.miui.compass` | Brújula MIUI |
| `com.miui.fm` | Radio FM |
| `com.miui.mishare` | Sharing MIUI |
| `com.miui.miwallpaper` | Fondos MIUI |
| `com.miui.gallery` | Galería MIUI |
| `com.miui.cleanmaster` | Limpiador MIUI |
| `com.miui.securitycenter` | Centro seguridad MIUI |
| `com.miui.bugreport` | Reporte bugs MIUI |
| `com.miui.qrscanner` | Escáner QR MIUI |

### Google (no esencial)
| Paquete | Descripción |
|---------|-------------|
| `com.google.android.music` | Google Play Music |
| `com.google.android.videos` | Google Play Películas |
| `com.google.android.youtube` | YouTube (reinstalable) |
| `com.google.android.googlequicksearchbox` | Google Search |
| `com.google.android.apps.googleassistant` | Google Assistant |
| `com.google.android.apps.docs` | Google Docs |
| `com.google.android.apps.photos` | Google Fotos |
| `com.google.ar.lens` | Google Lens |
| `com.google.android.apps.turbo` | Google Turbo |

### Redes Sociales Preinstaladas
| Paquete | Descripción |
|---------|-------------|
| `com.facebook.katana` | Facebook |
| `com.facebook.system` | Facebook System |
| `com.facebook.appmanager` | Facebook App Manager |
| `com.facebook.services` | Facebook Services |

### Otros
| Paquete | Descripción |
|---------|-------------|
| `com.amazon.appmanager` | Amazon App Manager |
| `com.netflix.partner.activation` | Netflix Partner |

## Ajustes de Rendimiento

```bash
# Sin animaciones (0 = off, 1 = on)
settings put global window_animation_scale 0
settings put global transition_animation_scale 0
settings put global animator_duration_scale 0

# GPU forzada
settings put global force_gpu_rendering 1
setprop debug.hwui.renderer skiagl

# Límite de background
settings put global background_limit 2

# Screen timeout (1 min)
settings put global screen_off_timeout 60000
```

## Modo Xiaomi 17 Ultra

```bash
# Rendering de alta calidad
setprop debug.hwui.renderer skiagl
setprop debug.hwui.use_gpu_pixel_buffers true
setprop debug.hwui.fbo_cache_size 48

# DNS rápido (Cloudflare)
setprop net.dns1 1.1.1.1
setprop net.dns2 1.0.0.1

# Touch más responsivo
setprop debug.touch.resampling true

# Optimización de memoria
settings put global config_activity_manager_constants \
  "max_cached_processes=16,background_settle_time=60000"
```

## Limpieza Profunda

```bash
# Temporales
rm -rf /data/local/tmp/*

# Thumbnails
rm -rf /sdcard/DCIM/.thumbnails/*

# Tombstones y ANR
rm -rf /data/tombstones/*
rm -rf /data/anr/*

# Cache general
pm trim-caches 512M
```

## Optimización de Batería

```bash
# Habilitar Doze
dumpsys deviceidle enable

# Restringir background
cmd appops set RUN_IN_BACKGROUND ignore default

# Desactivar low power (paradójico: lo controlamos nosotros)
settings put global low_power 0
```

## Notas

- Todos los comandos usan `--user 0` para no afectar el sistema raíz
- `pm uninstall -k` mantiene los datos por si se quiere reinstalar
- Los `setprop` se pierden al reiniciar → se refuerzan en cada conexión
- Los `settings put` persisten entre reinicios
