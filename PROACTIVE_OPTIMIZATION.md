# Proactive Optimization

## Descripción

El módulo `proactiveOptimizer.js` ejecuta optimizaciones **antes** de que los problemas aparezcan, basándose en predicciones del FailurePredictor y análisis de tendencias.

## Arquitectura

```
proactiveOptimizer.js
├── analyze()                    → Análisis proactivo completo
├── executeSpecific()            → Ejecutar acción específica
├── _analyzeCurrentTrends()      → Análisis de tendencias actuales
├── _generateProactiveActions()  → Generación de acciones
├── _shouldAutoExecute()         → Decisión de auto-ejecución
├── _executeProactiveActions()   → Ejecución masiva
└── _executeSingleAction()       → Ejecución individual
```

## Flujo de Trabajo

```
1. Verificar cooldown (30 min)
2. Obtener predicciones del FailurePredictor
3. Analizar tendencias actuales del dispositivo
4. Generar acciones proactivas basadas en ambos análisis
5. Determinar si se debe ejecutar automáticamente
6. Ejecutar acciones (si aplica)
7. Retornar resultados detallados
```

## Tipos de Acciones Proactivas

| Tipo | Trigger | Acción | Impacto |
|---|---|---|---|
| `battery_protection` | Predicción de batería crítica | Activar ahorro, limpiar cache | +15-30% vida |
| `thermal_prevention` | Predicción de sobrecalentamiento | Desactivar animaciones, cerrar apps pesadas | -3-5°C |
| `storage_cleanup` | Predicción de almacenamiento lleno | Limpiar cache, eliminar tmp | 200MB-1GB |
| `process_prevention` | Predicción de explosión de procesos | Matar procesos en background | Control |
| `memory_prevention` | Predicción de agotamiento de memoria | Drop caches, limpiar | +10-30% |
| `battery_recalibration` | Degradación de batería | Informativo (no auto-ejecutable) | - |

## Ejecución Automática

Las acciones se ejecutan automáticamente **solo** cuando:
- Hay acciones con urgencia `critical`
- Las acciones son `preventable: true`
- El cooldown de 30 minutos ha expirado

```javascript
const { ProactiveOptimizer } = require('./core/proactiveOptimizer');

const optimizer = new ProactiveOptimizer(deviceId);
const result = await optimizer.analyze();

// Resultado:
{
  predictions: [...],
  proactiveActions: [
    {
      type: 'thermal_prevention',
      label: 'Prevención térmica',
      urgency: 'critical',
      preventable: true,
      commands: ['settings put global animation_scale 0'],
      heavyApps: ['com.facebook.katana', ...],
      impact: 'Reduce temperatura ~3-5°C',
    }
  ],
  executed: true,
  executionResults: [...],
  summary: '2 acciones proactivas identificadas (1 críticas, 1 prevenibles)',
}
```

## Ejecución Manual

```javascript
// Ejecutar solo una acción específica
const result = await optimizer.executeSpecific('thermal_prevention');
```

## Cooldown

El sistema tiene un cooldown de 30 minutos entre ejecuciones proactivas para evitar:
- Sobreoptimización
- Consumo excesivo de recursos ADB
- Interferencia con el uso normal del dispositivo

## Integración con UI

Las acciones proactivas aparecen en SmartInsights con:
- Icono de escudo 🛡️
- Badge de urgencia
- Estado de ejecución (ejecutado/pendiente)
- Impacto estimado
