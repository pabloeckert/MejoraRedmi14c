# Expert Mode

## Descripción

Panel técnico profundo para usuarios avanzados. Expone logs crudos, telemetría, predicciones híbridas, estado interno de módulos, latencias y consumo de memoria.

## Componente

```
ExpertPanel.jsx
├── Header con tabs de secciones
├── SystemOverview (🖥️ Sistema)
│   ├── Info del sistema (versión, uptime, módulos)
│   ├── Estado de módulos (Guardian, Auto Mode, IA Híbrida, Telemetría, Plugins)
│   └── Memoria del renderer (usado, total, límite, barra de progreso)
├── TelemetryView (📊 Telemetría)
│   ├── Estadísticas (eventos, errores, predicciones, acciones)
│   ├── Tiempos de ejecución (total, promedio, máximo)
│   ├── Eventos por tipo
│   └── Últimos eventos (con filtro por tipo)
├── LogsView (📜 Logs)
│   ├── Filtro por tipo (todos, snapshot, optimization, guardian, auto_mode)
│   └── Logs crudos en formato JSON truncado
├── HybridAIView (🧠 IA Híbrida)
│   ├── Configuración (estado, endpoint, API key, timeout, umbral)
│   └── Métricas (llamadas locales/remotas, cache hits, fusiones, éxito remoto)
├── PluginsView (🔌 Plugins)
│   └── Lista de plugins con estado, permisos, ejecuciones, errores
└── PerformanceView (⚡ Rendimiento)
    ├── Memoria del renderer con barra de progreso
    ├── Latencias de operaciones (promedio, máximo)
    └── Uptime del sistema
```

## Secciones

### Sistema
- Versión del API interno
- Uptime formateado
- Número de módulos activos
- Estado detallado de cada módulo

### Telemetría
- Contadores por tipo de evento
- Estadísticas de timing (latencia promedio y máxima)
- Conteo de errores y predicciones
- Log de eventos recientes con badge de tipo

### Logs
- Vista de logs crudos en JSON
- Filtro por tipo: snapshot, optimization, guardian_check, auto_mode_prediction
- Últimos 50 logs con timestamp

### IA Híbrida
- Configuración del endpoint remoto
- Estado de la API key (sin exponerla)
- Métricas de uso: llamadas locales/remotas, cache hits, tasa de éxito

### Plugins
- Lista de plugins cargados
- Estado (activo/inactivo), tipo, permisos
- Conteo de ejecuciones y último error

### Rendimiento
- Memoria JS del renderer (Chrome DevTools compatible)
- Barra de progreso visual
- Latencias de operaciones de telemetría

## Controles

- **Auto-refresh**: Actualización automática cada 3 segundos
- **Botón refresh**: Actualización manual
- **Tabs de secciones**: Navegación rápida entre vistas

## Acceso

Disponible como pestaña "🔬 Experto" en la barra de navegación principal.
