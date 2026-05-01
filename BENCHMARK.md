# BENCHMARK.md — Benchmark de Rendimiento

## Visión General

Sistema de benchmarking que mide el rendimiento del dispositivo en 7 categorías y genera un score 0-100 comparado con el Xiaomi 17 Ultra como ideal.

## Módulo: `/src/core/benchmark.js`

## Pruebas

| Categoría | Peso | Qué mide | Método |
|-----------|------|----------|--------|
| **CPU** | 20% | Uso actual y frecuencia | Delta de `/proc/stat` en 1s |
| **RAM** | 20% | Capacidad y disponibilidad | `/proc/meminfo` |
| **IO** | 15% | Velocidad lectura/escritura | `dd` test (32MB) |
| **Latencia** | 10% | Tiempo de respuesta ADB | 5 muestras de `echo ok` |
| **Servicios** | 10% | Cantidad de servicios activos | `dumpsys activity services` |
| **Limpieza** | 15% | Zombies, tmp files, cache | `ps`, `ls`, `du` |
| **Térmica** | 10% | Temperatura actual | `dumpsys battery` |

## Score

```
Score final = Σ (score_categoria × peso_categoria)
```

### Interpretación

| Score | Nivel | Descripción |
|-------|-------|-------------|
| 90-100 | 🏆 Excepcional | Nivel Xiaomi 17 Ultra |
| 80-89 | 🟢 Excelente | Rendimiento óptimo |
| 60-79 | 🟡 Bueno | Rendimiento aceptable |
| 40-59 | 🟠 Mejorable | Necesita optimización |
| 0-39 | 🔴 Crítico | Optimización urgente |

## Valores Ideales (Xiaomi 17 Ultra)

```javascript
const IDEAL = {
  cpuSingleCore: 2200,
  ramTotalMb: 16384,       // 16GB
  ramFreePercent: 60,
  ioReadSpeed: 2000,       // MB/s
  processCount: 40,
  serviceCount: 15,
  tempIdle: 28,            // °C
};
```

## Comparación

El benchmark guarda resultados anteriores y permite comparar:
- Delta de score total
- Delta por categoría
- Indicador de mejora/empeoramiento

## UI: `/src/ui/components/BenchmarkPanel.jsx`

- Donut chart con score principal
- Bar chart con desglose por categoría
- Cards individuales por test con detalles
- Comparación con resultado anterior
- Botón "Ejecutar Benchmark"

## Consideraciones

- El test de IO escribe 32MB temporal en `/data/local/tmp/`
- La latencia mide 5 muestras y promedia
- Los servicios MIUI se cuentan por keyword matching
- El test de limpieza revisa zombies, /tmp y cache de apps
