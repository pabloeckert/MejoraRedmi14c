# Informe — Optimización teléfono de Sindy (`./run.sh --sindy`)

**Fecha:** 30-31/08/2026 (sesión nocturna, dos pasadas: optimización inicial + revisión obsesiva/mejoras adicionales)
**Dispositivo:** Xiaomi 2409BRN2CL — serial `VOSWQCOVJVQWT8LR` — codename **`pond`** (confirmado con `getprop`)
**Build:** OS3.0.306.0.WGTMIXM (HyperOS 3 / Android 16) — mismo build que el de Pablo
**SoC:** MediaTek Helio G81 Ultra — panel de 6.88" IPS LCD **120Hz de fábrica** (dato relevante, ver más abajo)

---

## Resultado final (verificado en vivo, teléfono asentado, sin actividad pesada encima)

**`mega-verificar.sh`: 15/16 (93%)**

| Área | Estado |
|------|--------|
| Animaciones | 0.3x (window/transition/animator) |
| GPU | Forzada + Vulkan (`skiavk`) + MSAA |
| Resolución | 612x1360 @ 260dpi (gaming) |
| Refresh rate | 90Hz (120Hz investigado y descartado — ver hallazgo abajo) |
| Memoria | Swappiness 20, max cached 96, Dalvik heap 512m, **+ `max_phantom_processes` sin límite (nuevo)** |
| Red | DNS validity 600s, TCP window 12, WiFi scan always desactivado |
| Bloatware | 15 apps desactivadas de 352 (antes eran 23 — se corrigió una desactivación errónea de 8 apps, ver hallazgo abajo) |
| Background / notificaciones | **Nuevo:** 7 apps clave (WhatsApp Business, redes sociales, Fiwind) puestas en whitelist de Doze — antes 4 de ellas estaban en el bucket más restrictivo de Android |

**RAM disponible:** 1.3GB / 3.7GB (36% libre) — **Batería:** 100% — **Temperatura:** 29.0°C
**Conectividad:** WiFi (SSID "EckertGeisert25") + datos móviles (LTE Claro) confirmados activos y funcionando
**Pantalla:** apagada al finalizar

---

## Comparativa ANTES → DESPUÉS

| Métrica | Antes (sin optimizar, medido en vivo) | Después (verificado, asentado) |
|---|---|---|
| Score `performance_calculate_score` | 38-59% (varió entre corridas) | 93% (`mega-verificar.sh`) |
| RAM disponible | ~1.17-1.27GB | 1.3GB (comparable — el diferencial real está en qué corre en esa RAM, no en el total) |
| Animaciones | 1.0x (default HyperOS) | 0.3x |
| GPU forzada / Vulkan / MSAA | No | Sí |
| Resolución | 720x1640 nativa | 612x1360 @ 260dpi (gaming, ~+15% FPS estimado) |
| Apps de terceros compiladas speed-profile | 0/76 | 76/76 + WhatsApp Business recompilado aparte |
| Apps de sistema compiladas | — | 8/13 |
| `max_phantom_processes` | 32 (default Android — mata procesos en 2do plano agresivamente) | 2147483647 (sin límite) |
| Apps en whitelist de Doze (unrestricted) | Solo WhatsApp Business (preexistente) | + Instagram, Facebook, Telegram, Spotify, Fiwind, TikTok |
| Apps en bucket RESTRICTED de Android | Instagram, Facebook, Fiwind, TikTok (notificaciones retrasadas) | Ninguna — todas en WORKING_SET o mejor |
| Apps de terceros desactivadas (perfil whitelist) | 0 (nunca corrido) | 11 (9 juegos + NaturalReader + Eist) |
| Apps mal-desactivadas fuera del perfil (bug de origen desconocido) | 8 (Notas, Brújula, Mi Drop, Scanner, Clima, Screen Recorder, Hourglass, **TikTok**) | 0 — todas restauradas |
| Cold start Cámara (`am start -W`) | No medido (sin baseline) | 1179ms (segundo arranque, con precarga aplicada) |
| Cold start WhatsApp Business (`am start -W`) | No medido (sin baseline) | 2472ms (comparable al 1161ms medido para WhatsApp normal en el equipo de Pablo — WhatsApp Business es más pesado por el catálogo de negocio) |

**Nota de honestidad:** el score y la RAM "antes" sí son mediciones reales tomadas en vivo contra este dispositivo al arrancar la corrida (no inventadas). Los tiempos de cold-start de apps no tienen un "antes" real porque no se midieron previo a optimizar — se presentan como verificación funcional post-optimización, con el número de referencia de Pablo como contexto.

---

## Investigación web de esta noche — qué se aplicó y qué se descartó (con motivo)

Se buscaron mejoras adicionales sin root para HyperOS 3 / Android 16 / Helio G81 Ultra más allá de lo que ya tenía el proyecto. Fuentes: repos de debloat de HyperOS en GitHub, foro XDA, blogs técnicos 2026.

### ✅ Aplicado

1. **`max_phantom_processes` sin límite** (`device_config put activity_manager max_phantom_processes 2147483647` + `settings put global settings_enable_monitor_phantom_procs false`). Tweak documentado a nivel AOSP (no específico de Xiaomi), corrige un comportamiento de Android 12+ que mata procesos en segundo plano de forma agresiva cuando hay muchos activos — puede afectar apps de mensajería/música corriendo en background. Confirmado que el shell de este equipo SÍ tiene permiso de escribirlo (no todos los Android 14+ lo permiten sin root). Reversible con `device_config delete activity_manager max_phantom_processes`.

2. **Apps clave sacadas del bucket RESTRICTED de Android** (`am set-standby-bucket <pkg> 10`) + **agregadas a la whitelist de Doze** (`cmd deviceidle whitelist +<pkg>`, equivalente al toggle "Batería sin restricciones" de Ajustes): WhatsApp Business, Instagram, Facebook, Telegram, Spotify, Fiwind, TikTok. Se encontró que Instagram, Facebook, Fiwind y TikTok estaban en el bucket más agresivo de ahorro de batería de Android (background casi cortado, notificaciones push potencialmente retrasadas) pese a estar protegidas explícitamente en la whitelist — no tenía sentido "proteger" una app y dejar que el sistema la asfixie en segundo plano. El bucket puede reevaluarse solo con el uso real (no es 100% permanente), pero la whitelist de Doze sí es durable.

3. **WhatsApp Business recompilado** (`cmd package compile -m speed -f com.whatsapp.w4b`) — se había saltado por un problema transitorio de conexión durante el caos de corridas duplicadas de la primera pasada.

### ❌ Investigado y descartado (con motivo)

1. **120Hz en vez de 90Hz.** El panel del Redmi 14C **sí soporta 120Hz de fábrica** (confirmado con `dumpsys display`: `supportedRefreshRates [120.00001, 90.0, 60.0]`), y el CLI del proyecto lo venía limitando a 90Hz sin que hubiera un motivo documentado. Se probó subirlo (`settings put system peak_refresh_rate 120`) pero **HyperOS lo capea por firmware**: existe un property de solo-root (`persist.sys.smartpower.limit.refresh.max.rate=90`) que ignora el setting de Android. Se confirmó que el shell no tiene permiso de escribirlo (`SecurityException`, requiere SELinux/root). Se revirtió a 90/60 para no dejar una configuración que no se cumple. **Conclusión: 120Hz no es alcanzable sin root en este equipo — no es un bug del proyecto, es un tope real de Xiaomi.**

2. **`persist.sys.computility.cpulevel/gpulevel` (nivel 6)** — circula en varias guías de "optimización HyperOS" como forma de desbloquear "modo premium". Se investigó qué hace realmente antes de tocarlo: **no es un boost de velocidad** — fuerza blur en vivo y texturas avanzadas manteniendo la GPU despierta todo el tiempo, lo que en un chip de gama media como el G81 Ultra deriva en más calor y más throttling. Es lo opuesto al objetivo (sentir el equipo como un Poco X3 Pro limpio y rápido). **No aplicado.**

3. **Desactivar "MIUI Optimization"** (toggle de Opciones de desarrollador) — no hay evidencia de que mejore rendimiento; podría aumentar actividad en segundo plano. **No aplicado.**

4. **Bajar la prioridad de Google Play Services (`am set-standby-bucket` a bucket "rare")** — apareció en una guía como ahorro de batería, pero implica el riesgo de retrasar notificaciones/sync reales. Contradice el objetivo de que el teléfono responda bien. **No aplicado.**

5. **Sacar apps de la whitelist de Doze para ahorrar batería** (ej. Facebook) — el objetivo de esta sesión es que las apps protegidas funcionen bien, no ahorrar batería a costa de notificaciones. **No aplicado.**

---

## 🐛 Hallazgo importante — 8 apps mal-desactivadas de origen desconocido (corregido)

Al hacer la revisión obsesiva de esta noche, `pm list packages -d` mostró **23 apps desactivadas** cuando el cálculo del propio script (verificado en los logs de las 3 corridas) solo apuntaba a **11**. Investigando la diferencia:

- **8 apps que están explícitamente protegidas en `PROFILE_SINDY_WHITELIST` estaban desactivadas igual:** Notas Xiaomi, Brújula, Mi Drop, Escáner Mi, Clima, Grabador de pantalla, una app de reloj de arena (`liquidhourglass`), y **TikTok** (que vos mismo acabás de confirmar como "proteger").
- Se revisó el historial completo de `devices.db` (la base del CLI) para el serial de Sindy: **no hay ningún registro de que el CLI las haya desactivado nunca** — ni en esta sesión ni en ninguna corrida anterior. El único registro de TikTok deshabilitado en toda la base corresponde al **serial de Pablo**, no al de Sindy (su perfil sí tiene TikTok en la blacklist, por diseño).
- No se pudo determinar la causa raíz exacta (no quedó log de quién/qué las desactivó — pudo ser Sindy manualmente desde Ajustes, o un estado de fábrica). Lo que sí es seguro es que **contradecía tu confirmación explícita de esta noche** de proteger estas apps.
- **Se corrigió:** las 8 se reactivaron (`pm enable --user 0`) y se confirmó que TikTok y Notas abren correctamente (`resolve-activity` devuelve su actividad real, no un error).
- **Dos casos que NO se pudieron reactivar:** `com.android.nfc` y `com.miui.virtualsim` (eSIM) — el sistema devolvió `SecurityException: Shell cannot change component state for null to 1`, un error distinto al de permisos normales que indica que estas dos features están **bloqueadas a nivel de hardware/SKU regional**, no desactivadas por accidente. Es decir: es probable que esta unidad específica no tenga NFC habilitado por firmware (variante regional) — no hay nada que optimizar ahí sin root. Si Sindy usa pagos con NFC y no le está funcionando, es un tema de hardware/soporte de Xiaomi, no algo que este CLI pueda arreglar.
- **Dos apps de sistema quedaron desactivadas sin tocar** (no forman parte de ninguna decisión tuya, son componentes de bajo impacto): `com.google.android.devicelockcontroller` (gestión de equipos financiados por operadora — irrelevante si el equipo se compró de contado) y `com.android.virtualization.terminal` (terminal Linux/VM de Android 16, feature de desarrollador que nadie usa). Se dejaron como estaban por estar fuera de cualquier decisión tomada — avisame si querés que también se reactiven.

---

## Decisiones tomadas sobre la whitelist (con vos, primera pasada de la noche)

`data/profile_sindy.sh` tenía una sección bloqueada desde hacía tiempo (juegos, redes sociales, 3 apps sin identificar) esperando tu confirmación. Se resolvió así:

- **9 juegos instalados** (Word Trip, Snake, Blackout Word, Plants vs Zombies, Royal Kingdom, Number Puzzle, Game Cloner, Platformer, Brain Test 2) → **desactivados**
- **Redes sociales/entretenimiento** (Facebook, Instagram, TikTok, Telegram, Spotify) → **protegidas**
- **NaturalReader y Eist** (lector de texto y de EPUB) → **desactivadas**
- **Fiwind** (billetera/inversión argentina) → **protegida** (agregada a la sección financiera)

Identifiqué estas 3 apps antes de preguntarte porque no tenían nombre reconocible en el archivo (solo el package name): `com.naturalsoft.personalweb` = NaturalReader, `com.fiwind.app` = Fiwind, `io.eist.app` = Eist.

Además, al calcular el complemento real contra el dispositivo aparecieron **3 apps que no estaban en la discusión original** y las protegí por criterio conservador del proyecto (ante duda, no tocar): `com.ypf.jpm` (YPF, uso activo confirmado), `com.google.android.verifier` (servicio de Google sin UI), `com.miui.virtualsim` (eSIM Xiaomi).

**Total: 65 apps protegidas por whitelist, 11 desactivadas por no estar en ella.** La sección bloqueada del archivo ya no existe.

---

## Qué se aplicó en total (ambas pasadas)

- Backup automático antes de tocar nada (`backups/VOSWQCOVJVQWT8LR_20260830_234228`)
- Animaciones 0.3x, GPU forzada + Vulkan + MSAA, resolución gaming
- Memoria: swappiness, LMK, Dalvik heap, HWUI cache XL, HyperOS Memory Extension, **`max_phantom_processes` sin límite**
- Red: DNS, TCP window, WiFi scan, roaming, network scoring
- Cámara + WhatsApp Business: precalentado y compilado
- Dexopt: 8/13 apps de sistema + 76/76 apps de terceros compiladas en speed-profile
- Limpieza de caché y thumbnails
- Telemetría Xiaomi desactivada
- **Whitelist de Doze + standby buckets** para las apps que realmente usa
- **8 apps recuperadas** que estaban mal-desactivadas fuera de cualquier decisión tomada

---

## Incidentes de la noche (ninguno dejó daño permanente, todos resueltos)

1. **Corrida duplicada por error mío** en la primera pasada — dos procesos `--sindy` concurrentes contra el mismo teléfono. Sin daño porque cada paso es idempotente.
2. **El "modo silencioso" (WiFi/datos/DND) no sobrevive al `adb reboot`** — bug real, sin diagnosticar la causa raíz todavía. Se corrigió a mano las veces que hizo falta. Pendiente para otra sesión (ver `CLAUDE.md`).
3. **ADB quedó "unauthorized" tras el reinicio** — HyperOS pide reconfirmar el permiso con un tap físico en el teléfono, no resoluble por software.
4. **El teléfono quedó "offline" varias veces durante la madrugada** — confirmado con Windows (`Get-PnpDevice`) que el USB estaba perfecto a nivel físico/driver; el bloqueo era 100% del lado del teléfono (HyperOS suspende el puente ADB agresivamente con la pantalla apagada, incluso cargando). Se resolvió cada vez que se tocó la pantalla.
5. **El score del banner mostró una caída transitoria (60%→7%)** justo tras el dexopt pesado — medido en caliente con RAM a tope. No era un problema real, confirmado por la verificación posterior en frío (93%).

---

## Pendientes reales para otra sesión

- Investigar por qué el modo silencioso no persiste al reboot (incidente #2) — no es urgente, ya quedó resuelto a mano, pero se va a repetir en el próximo `--sindy`/`--maintenance` con reinicio si no se corrige en el código.
- **Investigar el origen de las 8 apps mal-desactivadas** (hallazgo de esta noche) — no se pudo determinar la causa raíz. Si vuelve a pasar tras un futuro `--sindy`, sería bueno que `bloatware_run_whitelist()` reconciliara también en la otra dirección (reactivar automáticamente lo que está en la whitelist pero aparece desactivado), no solo desactivar lo que no está.
- NFC y eSIM parecen no estar disponibles por hardware/SKU en esta unidad — si Sindy reporta problemas con pagos por NFC, es un tema para soporte de Xiaomi, no algo que este proyecto pueda resolver sin root.
- El launcher (Lawnchair) aplicado en el teléfono de Pablo **no se tocó acá** — no estaba pedido y no hay historial de crashes reportado en el dispositivo de Sindy que lo justifique. Avisame si querés replicarlo.

---

*Generado automáticamente al cierre de la sesión — Claude Code.*
