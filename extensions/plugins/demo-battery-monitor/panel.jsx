/**
 * Panel UI del plugin Battery Monitor Pro
 */

export default function BatteryMonitorPanel({ data, onAction }) {
  if (!data) {
    return (
      <div className="text-center py-4">
        <p className="text-dark-400 text-sm">Sin datos de batería</p>
      </div>
    );
  }

  const { analysis, recommendations } = data;

  const healthColors = {
    good: 'text-accent-green',
    moderate: 'text-accent-orange',
    low: 'text-accent-red',
  };

  const statusIcons = {
    charging: '🔌',
    full: '✅',
    discharging: '🔋',
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-dark-900/50 rounded-lg p-2">
          <div className={`text-2xl font-bold ${healthColors[analysis.health] || 'text-dark-200'}`}>
            {analysis.level ?? '?'}%
          </div>
          <div className="text-[10px] text-dark-500">Nivel</div>
        </div>
        <div className="bg-dark-900/50 rounded-lg p-2">
          <div className="text-lg">{statusIcons[analysis.status] || '❓'}</div>
          <div className="text-[10px] text-dark-500 capitalize">{analysis.status || 'N/A'}</div>
        </div>
        <div className="bg-dark-900/50 rounded-lg p-2">
          <div className="text-lg font-bold text-dark-200">{analysis.temperature ?? '?'}°C</div>
          <div className="text-[10px] text-dark-500">Temp</div>
        </div>
      </div>

      {recommendations?.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-dark-300">Recomendaciones:</p>
          {recommendations.map((rec, i) => (
            <div key={i} className={`text-xs px-3 py-2 rounded-lg border ${
              rec.priority === 'critical' ? 'bg-accent-red/10 border-accent-red/20 text-accent-red' :
              rec.priority === 'high' ? 'bg-accent-orange/10 border-accent-orange/20 text-accent-orange' :
              'bg-dark-800/50 border-dark-700/20 text-dark-400'
            }`}>
              {rec.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
