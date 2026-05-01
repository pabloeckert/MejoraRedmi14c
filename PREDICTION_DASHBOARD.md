# Prediction Dashboard

## Descripción

Dashboard dedicado para visualizar predicciones ML del dispositivo. Muestra predicciones lineales vs no lineales, confianza del modelo, comparación de ajustes, y acciones proactivas recomendadas.

## Componente

```
PredictionDashboard.jsx
├── Header con KPIs
│   ├── Confianza ML (%)
│   ├── Total predicciones
│   ├── Predicciones críticas
│   └── Modelos (L / NL)
├── Comparación Linear vs No Lineal
│   ├── Métrica y urgencia
│   ├── Actual vs Proyección
│   ├── R² Ajustado
│   ├── Comparación R²
│   ├── Coeficientes del polinomio
│   └── Umbral crítico (si aplica)
├── Predicciones Lineales
│   ├── Icono + Label + Urgencia
│   ├── Descripción
│   ├── Actual vs Proyectado
│   ├── Días estimados
│   ├── Recomendación
│   └── Métricas del modelo (R², pendiente)
├── Acciones Proactivas Recomendadas
│   ├── Icono + Label
│   ├── Descripción
│   ├── Urgencia badge
│   └── Indicador prevenible
└── Info del modelo (algoritmo, grados, selección)
```

## Pestaña en App.jsx

Añadida como pestaña "🔮 Predicciones" entre "Insights" y "Diagnóstico".

## Datos que consume

| Fuente | Prop | Contenido |
|---|---|---|
| FailurePredictor | `failurePredictions` | Predicciones lineales + no lineales |
| ProactiveOptimizer | `proactiveResults` | Acciones proactivas recomendadas |
| NonLinearPredictor | API `predictNonLinear` | Predicciones polinómicas detalladas |

## Visualización

### KPI Cards (4 columnas)
- Confianza ML: porcentaje con color (verde > 70%, naranja > 40%, rojo)
- Predicciones: conteo total
- Críticas: conteo con color (rojo si > 0, verde si 0)
- Modelos: "L:X NL:Y" para lineal/no-lineal

### Comparación por métrica
- Tarjeta oscura con borde
- 3 columnas: Actual, Proyección, R² Ajustado
- Barra de comparación R² lineal vs polinómico
- Badge de mejora porcentual
- Coeficientes del polinomio
- Alerta de umbral crítico si aplica

### Predicciones lineales
- Tarjeta con color según urgencia (rojo crítico, naranja alto)
- Datos: actual, proyectado, días estimados
- Recomendación en tarjeta oscura
- Métricas del modelo: R², pendiente, dirección

## Estado vacío

- Sin dispositivo: "Conecta un dispositivo para ver predicciones"
- Sin predicciones: "Sin predicciones de riesgo" con confianza y puntos de datos
