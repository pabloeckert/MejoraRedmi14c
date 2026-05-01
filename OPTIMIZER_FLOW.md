# OPTIMIZER_FLOW.md — Flujo de Optimización

## Modo Máxima (Primera Conexión)

```
┌─────────────────────────────────────────────────────────┐
│              OPTIMIZACIÓN MÁXIMA (7 pasos)              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. 📸 Snapshot pre-optimización                       │
│     └─ Apps, batería, temp, procesos, uso              │
│                                                         │
│  2. 🗑️ Eliminación de bloatware                       │
│     └─ ~35 apps preinstaladas (Xiaomi, Google, FB...)  │
│                                                         │
│  3. ⚙️ Desactivar servicios MIUI                       │
│     └─ Analytics, MSA, FindDevice, Daemon              │
│                                                         │
│  4. 🚀 Ajustes de rendimiento máximo                   │
│     └─ Animaciones off, GPU forzada, background limit  │
│                                                         │
│  5. 🔥 Activar modo Xiaomi 17 Ultra                    │
│     └─ Skiagl renderer, DNS 1.1.1.1, touch sampling   │
│                                                         │
│  6. 🧹 Limpieza profunda                               │
│     └─ Thumbnails, tombstones, anr, cache 512MB        │
│                                                         │
│  7. 🔋 Optimización de batería                          │
│     └─ Doze mode, background restrictions              │
│                                                         │
│  📸 Snapshot post-optimización                         │
│  📝 Log completo guardado                              │
│  🎨 UI refrescada                                      │
└─────────────────────────────────────────────────────────┘
```

## Modo Inteligente (Reconexiones)

```
┌─────────────────────────────────────────────────────────┐
│            OPTIMIZACIÓN INTELIGENTE (6 pasos)           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. 📸 Snapshot actual del dispositivo                 │
│                                                         │
│  2. 📊 Análisis de historial                           │
│     ├─ Último snapshot                                 │
│     ├─ Tendencias (ML)                                 │
│     └─ Historial de optimizaciones                     │
│                                                         │
│  3. 🔍 Detección de patrones                           │
│     ├─ Estado de batería                               │
│     ├─ Temperatura                                     │
│     ├─ Presión de memoria                              │
│     ├─ Top consumers                                   │
│     └─ Bloatware que reapareció                        │
│                                                         │
│  4. 📋 Generación de plan dinámico                     │
│     └─ Basado en análisis + ML + prioridades           │
│                                                         │
│  5. ⚡ Ejecución del plan                              │
│     ├─ Cache cleanup                                   │
│     ├─ Bloatware removal (si aplica)                   │
│     ├─ Process kill (si hay presión)                   │
│     ├─ Memory optimization                             │
│     ├─ Thermal throttle (si está caliente)             │
│     ├─ Battery saver (si es necesario)                 │
│     └─ Performance enforcement                         │
│                                                         │
│  6. 📝 Post-snapshot + logging + ML update             │
└─────────────────────────────────────────────────────────┘
```

## Decisión de Modo

```
¿Dispositivo conectado?
    ├─ No → Error: "Conectar teléfono"
    └─ Sí → ¿Existe perfil?
              ├─ No → MODO MÁXIMA (primera conexión)
              └─ Sí → MODO INTELIGENTE (reconexión)
```

## ML: Ciclo de Aprendizaje

```
Cada conexión:
  1. Capturar snapshot
  2. Comparar con snapshot anterior
  3. Actualizar modelo EMA (exponential moving average)
  4. Predecir necesidades para próxima conexión
  5. Ajustar plan de optimización
  6. Guardar modelo actualizado
```
