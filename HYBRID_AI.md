# Hybrid AI

## Descripción

Motor de IA híbrida que combina predicciones locales con un endpoint remoto configurable. Selección automática según confianza y fallback local si la nube falla.

## Arquitectura

```
hybridAI.js
├── configure(config)              → Actualizar configuración del endpoint
├── getConfig()                    → Obtener configuración (sin exponer API key)
├── predict(deviceId)              → Predicción híbrida completa
├── predictType(deviceId, type)    → Predicción de un tipo específico
├── getMetrics()                   → Métricas de uso del motor
├── _getLocalPredictions()         → Predicciones locales (FailurePredictor + AnomalyDetector)
├── _getRemotePredictions()        → Predicciones del endpoint remoto
├── _mergePredictions()            → Fusión inteligente por confianza
├── _getFromCache() / _setCache()  → Cache de respuestas remotas
```

## Configuración

```javascript
const hybridAI = new HybridAI({
  endpoint: 'https://api.example.com/predict',
  apiKey: 'sk-...',
  timeout: 10000,
  confidenceThreshold: 0.65,
  fallbackToLocal: true,
  cacheRemoteMs: 300000,  // 5 min
  enabled: true,
});
```

## Flujo de Predicción

1. **Local siempre**: Ejecuta FailurePredictor + AnomalyDetector localmente
2. **Remoto si configurado**: Envía snapshots al endpoint, recibe predicciones
3. **Cache**: Verifica cache antes de llamar al endpoint
4. **Fusión inteligente**: Compara confianza de ambas fuentes por predicción
5. **Selección**: Prioriza la fuente con mayor confianza

## Fusión de Predicciones

Para cada tipo de fallo:
- Si `remoteConfidence > localConfidence` → usar remoto, enriquecer con datos locales
- Si `localConfidence >= remoteConfidence` → usar local
- Si solo existe en una fuente → usar esa fuente
- Confianza fusionada: `local * 0.6 + remote * 0.4`

## Payload Remoto

```json
{
  "deviceId": "abc123",
  "snapshots": [
    { "timestamp": "...", "battery": 65, "temperature": 34.2, "processCount": 45, "memoryAvailable": 42, "storageUsed": 67 }
  ],
  "timestamp": "2026-05-02T..."
}
```

## Respuesta Esperada del Endpoint

```json
{
  "predictions": [
    { "id": "battery_critical", "label": "...", "urgency": "medium", "confidence": 0.8, "projection": { "estimatedDays": 14 } }
  ],
  "confidence": 0.75,
  "model": "cloud-v1",
  "latencyMs": 230
}
```

## Métricas

```javascript
{
  localCalls: 42,
  remoteCalls: 15,
  remoteFailures: 2,
  cacheHits: 8,
  merges: 12,
  totalCalls: 57,
  remoteSuccessRate: 87,
  cacheHitRate: 14,
}
```

## Consideraciones de Seguridad

- La API key nunca se expone en `getConfig()`
- El endpoint remoto recibe solo datos agregados (snapshots), no datos sensibles
- Timeout configurable para evitar cuelgues
- Fallback local garantizado si `fallbackToLocal: true`
