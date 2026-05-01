/**
 * Non-Linear Predictor - Motor de predicción no lineal
 * Implementa regresión polinómica grado 2 y 3
 * Complementa al FailurePredictor lineal con captura de patrones curvos
 */

class NonLinearPredictor {
  constructor() {
    this.degree = 2; // Por defecto grado 2
  }

  /**
   * Predicción completa no lineal para un dispositivo
   * @param {Array} snapshots - Snapshots históricos
   * @returns {Object} Predicciones no lineales con métricas de calidad
   */
  async predict(snapshots) {
    if (snapshots.length < 5) {
      return {
        available: false,
        reason: 'Mínimo 5 sesiones para predicciones no lineales',
        predictions: [],
      };
    }

    const predictions = [];

    // ── Batería no lineal ──
    const batteryNL = this._predictMetricNonLinear(
      snapshots, 'battery', s => s.battery?.level ? parseInt(s.battery.level) : null,
      { label: 'Batería (no lineal)', unit: '%', criticalThreshold: 15, direction: 'decreasing' }
    );
    if (batteryNL) predictions.push(batteryNL);

    // ── Temperatura no lineal ──
    const tempNL = this._predictMetricNonLinear(
      snapshots, 'temperature', s => s.temperature,
      { label: 'Temperatura (no lineal)', unit: '°C', criticalThreshold: 45, direction: 'increasing' }
    );
    if (tempNL) predictions.push(tempNL);

    // ── Procesos no lineal ──
    const procNL = this._predictMetricNonLinear(
      snapshots, 'processes', s => s.processes?.length || null,
      { label: 'Procesos (no lineal)', unit: '', criticalThreshold: 180, direction: 'increasing' }
    );
    if (procNL) predictions.push(procNL);

    // ── Memoria no lineal ──
    const memNL = this._predictMetricNonLinear(
      snapshots, 'memory', s => s.memory?.availablePercent || null,
      { label: 'Memoria (no lineal)', unit: '%', criticalThreshold: 8, direction: 'decreasing' }
    );
    if (memNL) predictions.push(memNL);

    // ── Storage no lineal ──
    const storageNL = this._predictMetricNonLinear(
      snapshots, 'storage', s => s.storage?.usedPercent || null,
      { label: 'Almacenamiento (no lineal)', unit: '%', criticalThreshold: 93, direction: 'increasing' }
    );
    if (storageNL) predictions.push(storageNL);

    return {
      available: true,
      predictions,
      modelInfo: {
        algorithm: 'Polynomial Regression (Least Squares)',
        degrees: [2, 3],
        bestFitSelection: 'R² adjusted',
      },
    };
  }

  /**
   * Predicción no lineal de una métrica específica
   * Intenta grado 2 y 3, selecciona el mejor ajuste
   */
  _predictMetricNonLinear(snapshots, metricKey, extractor, config) {
    const points = [];
    for (let i = 0; i < snapshots.length; i++) {
      const val = extractor(snapshots[i]);
      if (val != null && isFinite(val)) {
        points.push({ x: i, y: val });
      }
    }

    if (points.length < 5) return null;

    // Intentar grado 2 y 3
    const fit2 = this._polynomialRegression(points, 2);
    const fit3 = this._polynomialRegression(points, 3);

    // Seleccionar mejor ajuste (R² ajustado penaliza complejidad)
    const adjR2_2 = this._adjustedR2(fit2.r2, points.length, 2);
    const adjR2_3 = this._adjustedR2(fit3.r2, points.length, 3);

    const bestFit = adjR2_3 > adjR2_2 ? { ...fit3, degree: 3, adjR2: adjR2_3 }
                                       : { ...fit2, degree: 2, adjR2: adjR2_2 };

    // Calcular MSE
    const mse = this._meanSquaredError(points, bestFit);

    // Proyectar 10 pasos adelante
    const currentX = points.length - 1;
    const projections = [];
    for (let step = 1; step <= 10; step++) {
      const x = currentX + step;
      const y = this._evalPolynomial(bestFit.coefficients, x);
      projections.push({ step, x, y: Math.round(y * 100) / 100 });
    }

    const currentValue = points[points.length - 1].y;
    const projectedValue = projections[projections.length - 1].y;

    // Determinar urgencia
    let urgency = 'low';
    let willReachCritical = false;
    let stepsUntilCritical = Infinity;

    if (config.direction === 'decreasing') {
      // Buscar cuándo baja del umbral
      for (const proj of projections) {
        if (proj.y <= config.criticalThreshold) {
          willReachCritical = true;
          stepsUntilCritical = proj.step;
          break;
        }
      }
    } else {
      // Buscar cuándo sube del umbral
      for (const proj of projections) {
        if (proj.y >= config.criticalThreshold) {
          willReachCritical = true;
          stepsUntilCritical = proj.step;
          break;
        }
      }
    }

    if (willReachCritical) {
      urgency = stepsUntilCritical <= 3 ? 'critical' : stepsUntilCritical <= 6 ? 'high' : 'medium';
    }

    // Solo reportar si hay tendencia significativa O si es crítico
    const slope = bestFit.coefficients.length > 1 ? bestFit.coefficients[1] : 0;
    const isSignificant = Math.abs(slope) > 0.3 || willReachCritical;
    if (!isSignificant) return null;

    // Generar curva completa para visualización (pasos pasados + futuros)
    const curveData = [];
    for (let i = -Math.min(points.length, 10); i <= 10; i++) {
      const x = currentX + i;
      const y = this._evalPolynomial(bestFit.coefficients, x);
      curveData.push({ x, y: Math.round(y * 100) / 100, isFuture: i > 0 });
    }

    return {
      metric: metricKey,
      label: config.label,
      unit: config.unit,
      urgency,
      model: {
        degree: bestFit.degree,
        coefficients: bestFit.coefficients.map(c => Math.round(c * 1000) / 1000),
        r2: Math.round(bestFit.r2 * 1000) / 1000,
        adjR2: Math.round(bestFit.adjR2 * 1000) / 1000,
        mse: Math.round(mse * 100) / 100,
      },
      current: {
        value: currentValue,
        step: currentX,
      },
      projection: {
        steps: 10,
        targetValue: projectedValue,
        willReachCritical,
        stepsUntilCritical: willReachCritical ? stepsUntilCritical : null,
        criticalThreshold: config.criticalThreshold,
        direction: config.direction,
      },
      curveData,
      comparison: {
        linear: this._linearForComparison(points),
        nonLinear: {
          degree: bestFit.degree,
          r2: bestFit.r2,
          adjR2: bestFit.adjR2,
        },
        improvement: Math.round((bestFit.adjR2 - this._linearForComparison(points).r2) * 100),
      },
    };
  }

  /**
   * Regresión polinómica por mínimos cuadrados
   * Resuelve el sistema normal: (X^T X) β = X^T y
   */
  _polynomialRegression(points, degree) {
    const n = points.length;
    const k = degree + 1;

    // Construir matriz X (Vandermonde) y vector y
    const X = [];
    const y = [];
    for (const p of points) {
      const row = [];
      for (let j = 0; j < k; j++) {
        row.push(Math.pow(p.x, j));
      }
      X.push(row);
      y.push(p.y);
    }

    // X^T X
    const XtX = this._matMul(this._transpose(X), X);
    // X^T y
    const Xty = this._matVecMul(this._transpose(X), y);

    // Resolver por eliminación gaussiana
    const coefficients = this._gaussianElimination(XtX, Xty);

    if (!coefficients) {
      return { coefficients: [0], r2: 0 };
    }

    // Calcular R²
    const r2 = this._calculateR2(points, coefficients);

    return { coefficients, r2 };
  }

  /**
   * Evalúa polinomio en un punto x
   */
  _evalPolynomial(coefficients, x) {
    let result = 0;
    for (let i = 0; i < coefficients.length; i++) {
      result += coefficients[i] * Math.pow(x, i);
    }
    return result;
  }

  /**
   * R² ajustado que penaliza grados más altos
   */
  _adjustedR2(r2, n, degree) {
    if (n <= degree + 1) return r2;
    return 1 - ((1 - r2) * (n - 1)) / (n - degree - 1);
  }

  /**
   * Error cuadrático medio
   */
  _meanSquaredError(points, fit) {
    let sum = 0;
    for (const p of points) {
      const predicted = this._evalPolynomial(fit.coefficients, p.x);
      sum += (p.y - predicted) ** 2;
    }
    return sum / points.length;
  }

  /**
   * R² para comparación
   */
  _calculateR2(points, coefficients) {
    const meanY = points.reduce((s, p) => s + p.y, 0) / points.length;
    let ssRes = 0, ssTot = 0;
    for (const p of points) {
      const predicted = this._evalPolynomial(coefficients, p.x);
      ssRes += (p.y - predicted) ** 2;
      ssTot += (p.y - meanY) ** 2;
    }
    return ssTot > 0 ? 1 - ssRes / ssTot : 0;
  }

  /**
   * Regresión lineal simple para comparación
   */
  _linearForComparison(points) {
    const n = points.length;
    let sx = 0, sy = 0, sxy = 0, sxx = 0;
    for (const p of points) {
      sx += p.x; sy += p.y; sxy += p.x * p.y; sxx += p.x * p.x;
    }
    const slope = (n * sxy - sx * sy) / (n * sxx - sx * sx);
    const intercept = (sy - slope * sx) / n;
    const r2 = this._calculateR2(points, [intercept, slope]);
    return { slope: Math.round(slope * 1000) / 1000, intercept: Math.round(intercept * 100) / 100, r2: Math.round(r2 * 1000) / 1000 };
  }

  // ── Álgebra matricial ──

  _transpose(M) {
    const rows = M.length, cols = M[0].length;
    const T = Array.from({ length: cols }, () => Array(rows));
    for (let i = 0; i < rows; i++)
      for (let j = 0; j < cols; j++)
        T[j][i] = M[i][j];
    return T;
  }

  _matMul(A, B) {
    const m = A.length, n = B[0].length, p = B.length;
    const C = Array.from({ length: m }, () => Array(n).fill(0));
    for (let i = 0; i < m; i++)
      for (let j = 0; j < n; j++)
        for (let k = 0; k < p; k++)
          C[i][j] += A[i][k] * B[k][j];
    return C;
  }

  _matVecMul(M, v) {
    return M.map(row => row.reduce((s, val, i) => s + val * v[i], 0));
  }

  _gaussianElimination(A, b) {
    const n = A.length;
    // Augmented matrix
    const M = A.map((row, i) => [...row, b[i]]);

    for (let col = 0; col < n; col++) {
      // Partial pivoting
      let maxRow = col;
      for (let row = col + 1; row < n; row++) {
        if (Math.abs(M[row][col]) > Math.abs(M[maxRow][col])) maxRow = row;
      }
      [M[col], M[maxRow]] = [M[maxRow], M[col]];

      if (Math.abs(M[col][col]) < 1e-12) return null; // Singular

      // Eliminate below
      for (let row = col + 1; row < n; row++) {
        const factor = M[row][col] / M[col][col];
        for (let j = col; j <= n; j++) {
          M[row][j] -= factor * M[col][j];
        }
      }
    }

    // Back substitution
    const x = Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
      x[i] = M[i][n];
      for (let j = i + 1; j < n; j++) {
        x[i] -= M[i][j] * x[j];
      }
      x[i] /= M[i][i];
    }

    return x;
  }
}

module.exports = { NonLinearPredictor };
