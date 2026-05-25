# Baseline de métricas — NB5XWCLZSGB6J74D

**Dispositivo:** Redmi 14C (24117RK2CG)  
**SoC:** Helio G81 Ultra (MediaTek MT6769H)  
**OS:** HyperOS 3 / Android 16  
**Fecha:** 24/05/2026  
**Contexto:** Medición post-limpieza (75 apps eliminadas, animaciones 0.3x, 90Hz, DEXOPT completo)

---

## RAM

| Métrica | Valor |
|---------|-------|
| Total | 3.56 GB |
| Disponible (free + cache reclaimable) | 1.29 GB |
| En uso real | ~2.27 GB |
| zRAM total | 4.00 GB |
| zRAM usado | ~1.00 GB |
| zRAM libre | 3.10 GB |

## CPU

| Métrica | Valor |
|---------|-------|
| Cluster little cpu0 — frecuencia actual | 1.275 GHz |
| Cluster big cpu4 — frecuencia actual | 1.700 GHz |
| Frecuencia máxima reportada | 1.700 GHz |
| Governor | No legible sin root (Android 16) |

## Temperatura

| Fuente | Valor |
|--------|-------|
| Batería | 34.0°C |
| Zonas térmicas SoC | No legibles sin root (Android 16) |

## Almacenamiento

| Partición | Total | Usado | Libre |
|-----------|-------|-------|-------|
| /data | 223 GB | 26 GB | 197 GB (88% libre) |

## Sistema

| Métrica | Valor |
|---------|-------|
| Uptime al momento de medición | ~57 min desde último reboot |
| Batería | 95% (cargando por USB) |

## Top procesos por RAM

| # | Proceso | RAM |
|---|---------|-----|
| 1 | com.whatsapp | 322 MB |
| 2 | system | 265 MB |
| 3 | com.android.systemui | 202 MB |
| 4 | com.google.android.googlequicksearchbox (3 procesos) | ~186 MB |
| 5 | com.miui.home | 118 MB |
| 6 | com.google.android.inputmethod.latin | 103 MB |
| 7 | surfaceflinger | 82 MB |
| 8 | com.google.android.gms (2 procesos) | ~148 MB |
| 9 | com.miui.securitycenter.remote | 61 MB |
| 10 | camerahalserver | 52 MB |

## Notas

- **Governor bloqueado:** Android 16 restringe lectura de `/sys/devices/system/cpu/.../scaling_governor` sin root. Los tweaks del CLI Bash v6.0 siguen aplicando porque corren desde el lado del dispositivo.
- **Quick Search Box:** Mayor consumidor después de WhatsApp con ~186 MB en 3 procesos paralelos. Candidato a eliminar si se quiere liberar RAM adicional.
- **Temperatura:** 34°C en reposo — 8°C por debajo del umbral de aborto (42°C).
- **zRAM:** Solo 25% usado, margen amplio.

## Comparación futura

Esta tabla se actualiza con cada medición post-tweak:

| Fecha | Contexto | RAM disponible | Temp reposo | Notas |
|-------|----------|----------------|-------------|-------|
| 24/05/2026 | Post-limpieza 75 apps | 1.29 GB | 34.0°C | Baseline inicial |
| — | — | — | — | — |
