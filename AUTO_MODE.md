# AUTO_MODE.md — Modo Automático

## Visión General

El modo automático permite que la app funcione de forma autónoma: detecta dispositivos, optimiza, registra y notifica sin intervención del usuario.

## Módulo: `/src/core/autoMode.js`

## Flujo

```
┌─────────────────────────────────────────────────────────┐
│                  MODO AUTOMÁTICO                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. Polling cada 10s                                    │
│     └─ detectDevice()                                   │
│                                                         │
│  2. ¿Nuevo dispositivo o primera conexión?              │
│     ├─ Sí → paso 3                                     │
│     └─ No → ¿Cooldown expirado? (1 hora)               │
│              ├─ Sí → paso 3                            │
│              └─ No → esperar                            │
│                                                         │
│  3. Ejecutar ciclo completo:                            │
│     a. 💾 createBackup()                                │
│     b. ⚡ runOptimization()                             │
│     c. 📝 Registrar en profile + logs                   │
│     d. 🔔 sendNotification()                            │
│     e. 🧹 cleanOldBackups()                             │
│                                                         │
│  4. Si falla:                                           │
│     a. 🔄 rollback() automático                         │
│     b. 🔔 Notificar del error                           │
│                                                         │
│  5. Volver al paso 1                                    │
└─────────────────────────────────────────────────────────┘
```

## API

### `start()`
Activa el polling de detección.

### `stop()`
Desactiva el polling.

### `isActive()`
Retorna si está activo.

### `setCooldown(ms)`
Configura tiempo mínimo entre optimizaciones automáticas (default: 1 hora).

## Callback UI

```javascript
autoMode.onStatusChange = (status) => {
  // status: { status, message, timestamp }
  // status values: 'active', 'inactive', 'detected', 'backing_up',
  //                'optimizing', 'done', 'warning', 'rolling_back'
};
```

## Cooldown

- Default: 1 hora entre optimizaciones del mismo dispositivo
- Previene optimizaciones excesivas
- Se puede configurar con `setCooldown(ms)`

## UI

- Toggle "Modo Automático" en Settings
- Indicador de estado en tiempo real
- Mensajes de estado durante el ciclo

## Eventos

| Estado | Mensaje | Notificación |
|--------|---------|-------------|
| `active` | Modo automático activado | — |
| `detected` | Dispositivo detectado: {model} | — |
| `backing_up` | Creando backup... | — |
| `optimizing` | Optimizando... | — |
| `done` | Optimización completada | ✅ |
| `warning` | Optimización con errores | ⚠️ |
| `rolling_back` | Error — ejecutando rollback | 🔄 |
