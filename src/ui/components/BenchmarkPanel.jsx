import React, { useState, useCallback } from 'react';
import { BarChart, DonutChart } from '../charts/Charts';

export default function BenchmarkPanel({ deviceId }) {
  const [results, setResults] = useState(null);
  const [previous, setPrevious] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [running, setRunning] = useState(false);

  const runBenchmark = useCallback(async () => {
    if (!deviceId || running) return;
    setRunning(true);
    try {
      const data = await window.optimizer.runBenchmark({ deviceId });
      if (data.error) throw new Error(data.error);

      if (results) {
        setPrevious(results);
        const comp = await window.optimizer.compareBenchmark({
          current: data,
          previous: results,
        });
        if (!comp.error) setComparison(comp);
      }

      setResults(data);
    } catch (err) {
      console.error('Benchmark error:', err);
    }
    setRunning(false);
  }, [deviceId, running, results]);

  if (!deviceId) {
    return (
      <div className="glass p-8 text-center">
        <p className="text-dark-400">Conecta un dispositivo para ejecutar benchmarks</p>
      </div>
    );
  }

  const breakdownData = results ? Object.entries(results.breakdown).map(([key, value]) => ({
    label: formatLabel(key),
    value,
    color: getScoreColor(value),
  })) : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          🏋️ Benchmark de Rendimiento
        </h2>
        <button onClick={runBenchmark} disabled={running}
          className="text-xs px-4 py-2 bg-accent-purple/10 hover:bg-accent-purple/20 border border-accent-purple/20
            text-accent-purple rounded-lg disabled:opacity-50 transition-all">
          {running ? '⏳ Ejecutando...' : '▶️ Ejecutar Benchmark'}
        </button>
      </div>

      {running && !results && (
        <div className="glass p-8 text-center">
          <div className="animate-pulse text-3xl mb-3">🏋️</div>
          <p className="text-dark-300">Ejecutando pruebas de rendimiento...</p>
          <p className="text-dark-500 text-xs mt-1">CPU, RAM, IO, latencia, servicios, limpieza, térmica</p>
        </div>
      )}

      {results && (
        <>
          {/* Main Score */}
          <div className="glass p-6 flex items-center gap-8">
            <div className="relative">
              <DonutChart value={results.score} max={100} size={140} color={getScoreColor(results.score)} label="Score" />
            </div>
            <div className="flex-1">
              <h3 className="text-3xl font-bold text-dark-100">{results.score}/100</h3>
              <p className={`text-sm font-medium mt-1 ${getScoreTextColor(results.score)}`}>
                {getScoreLabel(results.score)}
              </p>
              <p className="text-xs text-dark-500 mt-2">
                Comparado con Xiaomi 17 Ultra como ideal
              </p>

              {/* Comparison with previous */}
              {comparison && (
                <div className={`mt-3 text-sm flex items-center gap-2 ${
                  comparison.improved ? 'text-accent-green' : 'text-accent-red'
                }`}>
                  {comparison.improved ? '📈' : '📉'}
                  {comparison.scoreDelta > 0 ? '+' : ''}{comparison.scoreDelta} puntos vs anterior
                </div>
              )}

              <p className="text-xs text-dark-600 mt-2">
                Duración: {(results.durationMs / 1000).toFixed(1)}s
              </p>
            </div>
          </div>

          {/* Breakdown Chart */}
          {breakdownData.length > 0 && (
            <div className="glass p-5">
              <h3 className="text-sm font-semibold text-dark-200 mb-3">Desglose por categoría</h3>
              <BarChart data={breakdownData} width={600} height={200} label="benchmark" />
            </div>
          )}

          {/* Individual Tests */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(results.tests).map(([key, test]) => (
              <TestCard key={key} name={formatLabel(key)} test={test} prevTest={previous?.tests?.[key]} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function TestCard({ name, test, prevTest }) {
  const scoreColor = getScoreColor(test.score || 0);

  return (
    <div className="glass p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-dark-200">{name}</h4>
        <span className="text-lg font-bold" style={{ color: scoreColor }}>{test.score ?? '?'}</span>
      </div>

      <div className="w-full h-1.5 bg-dark-800 rounded-full mb-3">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${test.score || 0}%`, backgroundColor: scoreColor }} />
      </div>

      {/* Details */}
      <div className="space-y-1">
        {test.usage != null && <Detail label="Uso" value={`${test.usage}%`} />}
        {test.cores != null && <Detail label="Cores" value={test.cores} />}
        {test.freqMhz != null && <Detail label="Frecuencia" value={`${test.freqMhz}MHz`} />}
        {test.totalMb != null && <Detail label="RAM Total" value={`${test.totalMb}MB`} />}
        {test.availableMb != null && <Detail label="RAM Libre" value={`${test.availableMb}MB`} />}
        {test.freePercent != null && <Detail label="% Libre" value={`${test.freePercent}%`} />}
        {test.writeMs != null && <Detail label="Escritura" value={`${test.writeMs}ms`} />}
        {test.readMs != null && <Detail label="Lectura" value={`${test.readMs}ms`} />}
        {test.avgMs != null && <Detail label="Latencia" value={`${test.avgMs}ms`} />}
        {test.total != null && <Detail label="Servicios" value={test.total} />}
        {test.miuiServices != null && <Detail label="MIUI" value={test.miuiServices} />}
        {test.temperature != null && <Detail label="Temperatura" value={`${test.temperature}°C`} />}
        {test.error && <p className="text-xs text-accent-red">⚠️ {test.error}</p>}
      </div>

      {/* Comparison */}
      {prevTest?.score != null && test.score != null && (
        <div className="mt-2 pt-2 border-t border-dark-700/30 flex items-center justify-between">
          <span className="text-xs text-dark-500">vs anterior: {prevTest.score}</span>
          <span className={`text-xs font-medium ${
            test.score > prevTest.score ? 'text-accent-green' :
            test.score < prevTest.score ? 'text-accent-red' : 'text-dark-400'
          }`}>
            {test.score > prevTest.score ? '📈' : test.score < prevTest.score ? '📉' : '➡️'}
            {test.score > prevTest.score ? '+' : ''}{test.score - prevTest.score}
          </span>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-dark-500">{label}</span>
      <span className="text-dark-300 font-mono">{value}</span>
    </div>
  );
}

function formatLabel(key) {
  const map = {
    cpu: '🖥️ CPU',
    ram: '🧠 RAM',
    io: '💿 IO',
    latency: '⚡ Latencia',
    services: '⚙️ Servicios',
    cleanliness: '🧹 Limpieza',
    thermal: '🌡️ Térmica',
  };
  return map[key] || key;
}

function getScoreColor(score) {
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#f59e0b';
  if (score >= 40) return '#f97316';
  return '#ef4444';
}

function getScoreTextColor(score) {
  if (score >= 80) return 'text-accent-green';
  if (score >= 60) return 'text-accent-orange';
  return 'text-accent-red';
}

function getScoreLabel(score) {
  if (score >= 90) return '🏆 Excepcional — Nivel Xiaomi 17 Ultra';
  if (score >= 80) return '🟢 Excelente rendimiento';
  if (score >= 60) return '🟡 Buen rendimiento';
  if (score >= 40) return '🟠 Rendimiento mejorable';
  return '🔴 Necesita optimización urgente';
}
