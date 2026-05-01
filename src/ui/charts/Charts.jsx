import React, { useMemo } from 'react';

/**
 * Lightweight SVG chart components — no external dependencies
 */

// ─── Line Chart ────────────────────────────────────────
export function LineChart({ data, width = 500, height = 200, color = '#3b82f6', label = '', unit = '' }) {
  const { points, path, areaPath, minY, maxY, xStep } = useMemo(() => {
    if (!data || data.length < 2) return { points: [], path: '', areaPath: '', minY: 0, maxY: 100, xStep: 0 };

    const values = data.map(d => d.value);
    const minY = Math.min(...values) * 0.9;
    const maxY = Math.max(...values) * 1.1;
    const rangeY = maxY - minY || 1;

    const padding = { top: 20, right: 20, bottom: 30, left: 50 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;
    const xStep = chartW / (data.length - 1);

    const points = data.map((d, i) => ({
      x: padding.left + i * xStep,
      y: padding.top + chartH - ((d.value - minY) / rangeY) * chartH,
      value: d.value,
      label: d.label,
    }));

    const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    const areaPath = path +
      ` L ${points[points.length - 1].x} ${padding.top + chartH}` +
      ` L ${points[0].x} ${padding.top + chartH} Z`;

    return { points, path, areaPath, minY, maxY, xStep };
  }, [data, width, height]);

  if (!data || data.length < 2) {
    return (
      <div className="flex items-center justify-center text-dark-500 text-sm" style={{ width, height }}>
        Datos insuficientes
      </div>
    );
  }

  const padding = { top: 20, right: 20, bottom: 30, left: 50 };
  const chartH = height - padding.top - padding.bottom;

  return (
    <svg width={width} height={height} className="overflow-visible">
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
        const y = padding.top + chartH * (1 - pct);
        const val = (minY + (maxY - minY) * pct).toFixed(0);
        return (
          <g key={i}>
            <line x1={padding.left} y1={y} x2={width - padding.right} y2={y}
              stroke="#2d2d3a" strokeWidth="1" strokeDasharray={i > 0 ? "4 4" : ""} />
            <text x={padding.left - 8} y={y + 4} textAnchor="end"
              fill="#8e8ea0" fontSize="10" fontFamily="JetBrains Mono">
              {val}{unit}
            </text>
          </g>
        );
      })}

      {/* Area fill */}
      <defs>
        <linearGradient id={`grad-${label}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#grad-${label})`} />

      {/* Line */}
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      {/* Data points */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="3" fill={color} stroke="#0a0a0f" strokeWidth="1.5" />
          {/* Tooltip on hover (simplified: show last point) */}
          {i === points.length - 1 && (
            <g>
              <rect x={p.x - 25} y={p.y - 22} width="50" height="18" rx="4"
                fill="#2d2d3a" stroke="#40414f" strokeWidth="1" />
              <text x={p.x} y={p.y - 10} textAnchor="middle"
                fill="#ececf1" fontSize="10" fontFamily="JetBrains Mono">
                {p.value}{unit}
              </text>
            </g>
          )}
        </g>
      ))}

      {/* X-axis labels */}
      {points.filter((_, i) => i % Math.max(1, Math.floor(points.length / 5)) === 0 || i === points.length - 1).map((p, i) => (
        <text key={i} x={p.x} y={height - 8} textAnchor="middle"
          fill="#8e8ea0" fontSize="9" fontFamily="JetBrains Mono">
          {p.label}
        </text>
      ))}
    </svg>
  );
}

// ─── Bar Chart ─────────────────────────────────────────
export function BarChart({ data, width = 500, height = 200, color = '#8b5cf6', label = '' }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center text-dark-500 text-sm" style={{ width, height }}>
        Sin datos
      </div>
    );
  }

  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const maxVal = Math.max(...data.map(d => d.value)) * 1.1 || 1;
  const barW = Math.min(40, (chartW / data.length) * 0.7);
  const gap = (chartW - barW * data.length) / (data.length + 1);

  return (
    <svg width={width} height={height}>
      {/* Grid */}
      {[0, 0.5, 1].map((pct, i) => {
        const y = padding.top + chartH * (1 - pct);
        const val = (maxVal * pct).toFixed(0);
        return (
          <g key={i}>
            <line x1={padding.left} y1={y} x2={width - padding.right} y2={y}
              stroke="#2d2d3a" strokeWidth="1" strokeDasharray="4 4" />
            <text x={padding.left - 8} y={y + 4} textAnchor="end"
              fill="#8e8ea0" fontSize="10" fontFamily="JetBrains Mono">
              {val}
            </text>
          </g>
        );
      })}

      {/* Bars */}
      {data.map((d, i) => {
        const barH = (d.value / maxVal) * chartH;
        const x = padding.left + gap + i * (barW + gap);
        const y = padding.top + chartH - barH;

        return (
          <g key={i}>
            <defs>
              <linearGradient id={`bar-${label}-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={d.color || color} stopOpacity="1" />
                <stop offset="100%" stopColor={d.color || color} stopOpacity="0.5" />
              </linearGradient>
            </defs>
            <rect x={x} y={y} width={barW} height={barH} rx="4"
              fill={`url(#bar-${label}-${i})`} />
            <text x={x + barW / 2} y={height - 10} textAnchor="middle"
              fill="#8e8ea0" fontSize="8" fontFamily="JetBrains Mono"
              transform={`rotate(-30 ${x + barW / 2} ${height - 10})`}>
              {d.label?.length > 10 ? d.label.slice(-10) : d.label}
            </text>
            <text x={x + barW / 2} y={y - 5} textAnchor="middle"
              fill="#acacbe" fontSize="9" fontFamily="JetBrains Mono">
              {d.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Donut Chart ───────────────────────────────────────
export function DonutChart({ value, max = 100, size = 120, color = '#3b82f6', label = '' }) {
  const pct = Math.min(value / max, 1);
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - pct);

  const getColor = () => {
    if (pct > 0.8) return '#ef4444';
    if (pct > 0.6) return '#f59e0b';
    return color;
  };

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="#2d2d3a" strokeWidth="8" />
        <circle cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={getColor()} strokeWidth="8"
          strokeDasharray={circumference} strokeDashoffset={dashOffset}
          strokeLinecap="round" className="transition-all duration-1000" />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <span className="text-xl font-bold text-dark-100">{Math.round(pct * 100)}%</span>
        <span className="text-xs text-dark-400">{label}</span>
      </div>
    </div>
  );
}

// ─── Spark Line (mini chart) ───────────────────────────
export function SparkLine({ data, width = 120, height = 32, color = '#3b82f6' }) {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);

  const points = data.map((v, i) => ({
    x: i * step,
    y: height - ((v - min) / range) * (height - 4) - 2,
  }));

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible">
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y}
        r="2.5" fill={color} />
    </svg>
  );
}
