# SCHEDULER.md — Programación de Optimizaciones

## Visión General

Permite programar optimizaciones automáticas basadas en tiempo o condiciones del dispositivo.

## Módulo: `/src/core/scheduler.js`

## Tipos de Jobs

### 1. Intervalo (`interval`)
Optimiza cada X días.

```javascript
{
  type: 'interval',
  days: 1,      // cada N días
  deviceId: 'xxx'
}
```

### 2. Batería (`battery`)
Optimiza cuando la batería cae por debajo de un umbral.

```javascript
{
  type: 'battery',
  threshold: 40,    // porcentaje
  comparator: 'lt', // 'lt' = menor que, 'gt' = mayor que
  deviceId: 'xxx'
}
```

### 3. Temperatura (`temperature`)
Optimiza cuando la temperatura supera un umbral.

```javascript
{
  type: 'temperature',
  threshold: 42,    // grados Celsius
  comparator: 'gt', // 'gt' = mayor que, 'lt' = menor que
  deviceId: 'xxx'
}
```

## API

### `addJob(config)`
Crea un nuevo job. Retorna el job con `id`.

### `removeJob(jobId)`
Elimina un job.

### `toggleJob(jobId, enabled)`
Habilita/deshabilita un job.

### `updateJob(jobId, patch)`
Actualiza parcialmente un job.

### `listJobs()`
Lista todos los jobs.

### `start()` / `stop()`
Inicia/detiene el scheduler.

## Ejecución

Cuando un job se ejecuta:
1. 💾 Crea backup
2. ⚡ Ejecuta optimización (smart mode)
3. 📝 Registra en perfil
4. 🔔 Notifica al usuario
5. 🔄 Rollback si falla

## Persistencia

Los jobs se mantienen en memoria. Para persistir entre reinicios, se guardarían en `/config/scheduler.json` (implementación futura).

## UI

- Sección "⏰ Optimización Programada" en Settings
- Formulario para crear nuevos jobs
- Lista de jobs con toggle y botón de eliminar
- Indicador de última ejecución

## Consideraciones

- Los jobs de condición (batería/temperatura) verifican cada 60 segundos
- Los jobs de intervalo usan `setInterval`
- Si el dispositivo no está conectado, el job de condición no se ejecuta
- Cada job ejecuta rollback automático en caso de error
