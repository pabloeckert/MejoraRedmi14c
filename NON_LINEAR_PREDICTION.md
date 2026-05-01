# Non-Linear Prediction (ML Avanzado)

## Descripción

Motor de predicción no lineal que complementa al predictor lineal existente. Implementa regresión polinómica de grado 2 y 3 para capturar patrones curvos en las métricas del dispositivo que la regresión lineal no puede modelar.

## Arquitectura

```
nonLinearPredictor.js
├── predict(snapshots)              → Predicción completa no lineal
├── _predictMetricNonLinear()       → Predicción por métrica
├── _polynomialRegression(points, degree) → Regresión polinómica (mínimos cuadrados)
├── _evalPolynomial(coefficients, x)     → Evaluación de polinomio
├── _adjustedR2(r2, n, degree)     → R² ajustado (penaliza complejidad)
├── _meanSquaredError(points, fit) → Error cuadrático medio
├── _linearForComparison(points)   → Regresión lineal para comparación
└── Álgebra matricial:
    ├── _transpose(M)
    ├── _matMul(A, B)
    ├── _matVecMul(M, v)
    └── _gaussianElimination(A, b)
```

## Algoritmo

1. **Extracción de puntos**: Convierte snapshots históricos a pares (x, y) donde x es el índice de sesión y y es el valor de la métrica.

2. **Ajuste polinómico**: Para grado 2 y 3, resuelve el sistema normal `(X^T X) β = X^T y` usando eliminación gaussiana con pivoteo parcial.

3. **Selección del mejor modelo**: Compara R² ajustado (penaliza grados más altos) y selecciona el mejor ajuste.

4. **Proyección**: Evalúa el polinomio seleccionado 10 pasos adelante.

5. **Clasificación de urgencia**: Determina si el valor proyectado alcanzará el umbral crítico.

## Métricas de Calidad

| Métrica | Descripción |
|---|---|
| R² | Coeficiente de determinación (0-1) |
| R² ajustado | Penaliza complejidad del modelo |
| MSE | Error cuadrático medio |
| Grado | 2 o 3, seleccionado automáticamente |

## Comparación con Modelo Lineal

Cada predicción no lineal incluye una comparación con el modelo lineal:
- R² lineal vs R² ajustado polinómico
- Porcentaje de mejora
- Coeficientes del polinomio seleccionado

## Umbrales Críticos

| Métrica | Umbral | Dirección |
|---|---|---|
| Batería | 15% | decreasing |
| Temperatura | 45°C | increasing |
| Procesos | 180 | increasing |
| Memoria | 8% | decreasing |
| Almacenamiento | 93% | increasing |

## Integración

- Integrado en `FailurePredictor.predict()` como `nonLinearPredictions`
- Disponible en el Dashboard de Predicciones como comparación visual
- Usado por Guardian para alertas tempranas
- Usado por Auto Mode para activación de Turbo

## Limitaciones

- Mínimo 5 sesiones para activar predicciones no lineales
- Asume continuidad en las tendencias (no captura cambios bruscos)
- Grado 3 puede sobreajustar con pocos datos
- Proyección limitada a 10 pasos adelante
