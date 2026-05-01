# TRENDS.md — Gráficos de Tendencias

## Visión General

Los gráficos de tendencias muestran la evolución histórica de las métricas del dispositivo a lo largo de múltiples conexiones.

## Implementación

### Motor de Gráficos (SVG puro)

Los gráficos se implementan como componentes SVG puros en React, sin dependencias externas. Esto garantiza:
- Cero overhead de bundle
- Renderizado inmediato
- Control total sobre estilos y animaciones

### Componentes Disponibles

| Componente | Uso |
|-----------|-----|
| `LineChart` | Series temporales (batería, temperatura, procesos) |
| `BarChart` | Comparaciones categóricas (apps más usadas) |
| `DonutChart` | Porcentajes (CPU, RAM) |
| `SparkLine` | Mini gráficos inline en metric cards |

### Gráficos Implementados

#### 1. Tendencia de Batería
- **Datos**: `% de carga` por conexión
- **Fuente**: `logs/{deviceId}.json` → snapshots → `battery.level`
- **Color**: Verde (#10b981)

#### 2. Tendencia de Temperatura
- **Datos**: `°C` por conexión
- **Fuente**: `logs/{deviceId}.json` → snapshots → `temperature`
- **Color**: Naranja (#f59e0b)
- **Alerta**: > 40°C = zona roja

#### 3. Procesos por Conexión
- **Datos**: Cantidad de procesos activos
- **Fuente**: `logs/{deviceId}.json` → snapshots → `processes.length`
- **Color**: Azul (#3b82f6)

#### 4. Apps Más Usadas
- **Datos**: Minutos de uso acumulado
- **Fuente**: `logs/{deviceId}.json` → snapshots → `usageStats`
- **Color**: Púrpura (#8b5cf6)
- **Agrupación**: Por package name, último segmento

#### 5. Rendimiento de Optimización
- **Datos**: Duración en segundos por optimización
- **Fuente**: `logs/{deviceId}.json` → optimizations → `durationMs`
- **Color**: Rosa (#ec4899)

### Stats Resumidas

- Total de optimizaciones
- Tasa de éxito (%)
- Duración promedio
- Bloatware total eliminado

## Datos Requeridos

Los gráficos requieren al menos 2 snapshots en los logs. Con 1 o 0 se muestra "Datos insuficientes".

```
/logs/{deviceId}.json
├── { type: "snapshot", timestamp, battery, temperature, processes, usageStats }
├── { type: "optimization", timestamp, mode, success, durationMs, bloatwareRemoved }
├── { type: "snapshot", ... }
└── ...
```
