import React, { useState, useEffect, useCallback } from 'react';
import { SparkLine } from './charts/Charts';

export default function DeviceOverview({ device, profile, onAssignOwner }) {
  const [healthAnim, setHealthAnim] = useState(0);
  const [wifiStatus, setWifiStatus] = useState(null);
  const [wifiLoading, setWifiLoading] = useState(false);

  useEffect(() => {
    if (profile?.healthScore != null) {
      const timer = setTimeout(() => setHealthAnim(profile.healthScore), 100);
      return () => clearTimeout(timer);
    }
  }, [profile?.healthScore]);

  const handleWifiConnect = async () => {
    if (!device?.deviceId) return;
    setWifiLoading(true);
    const result = await window.optimizer.wifiConnect({ deviceId: device.deviceId });
    setWifiStatus(result.error ? { error: result.error } : result);
    setWifiLoading(false);
  };

  const handleWifiDisconnect = async () => {
    if (!device?.deviceId) return;
    await window.optimizer.wifiDisconnect({ deviceId: device.deviceId });
    setWifiStatus(null);
  };

  const handleCreateBackup = async () => {
    if (!device?.deviceId) return;
    await window.optimizer.createBackup({ deviceId: device.deviceId });
  };

  const getHealthColor = (score) => {
    if (score >= 80) return { text: 'text-accent-green', bg: 'bg-accent-green', emoji: '🟢' };
    if (score >= 60) return { text: 'text-accent-orange', bg: 'bg-accent-orange', emoji: '🟡' };
    if (score >= 40) return { text: 'text-accent-orange', bg: 'bg-accent-orange', emoji: '🟠' };
    return { text: 'text-accent-red', bg: 'bg-accent-red', emoji: '🔴' };
  };

  const getHealthLabel = (score) => {
    if (score >= 80) return 'Excelente';
    if (score >= 60) return 'Bueno';
    if (score >= 40) return 'Regular';
    return 'Necesita atención';
  };

  if (!device) return null;

  const info = device.deviceInfo || {};
  const score = profile?.healthScore ?? 100;
  const health = getHealthColor(score);

  return (
    <div className="glass p-6 space-y-5">
      {/* Device Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-blue/20 to-accent-purple/20 
            border border-accent-blue/30 flex items-center justify-center text-2xl">
            📱
          </div>
          <div>
            <h2 className="text-xl font-bold text-dark-100">
              {info.model || 'Dispositivo Android'}
            </h2>
            <p className="text-sm text-dark-400">
              {info.brand} · {info.device} · Android {info.android}
            </p>
            {device.owner && device.owner !== 'Desconocido' && (
              <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-accent-blue/10 text-accent-blue border border-accent-blue/20">
                👤 {device.owner}
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className={`text-xs ${health.text} font-medium`}>{health.emoji} {health.label}</div>
          <div className="text-3xl font-bold text-dark-100 mt-1">{score}</div>
          <div className="text-xs text-dark-500">/100</div>
        </div>
      </div>

      {/* Health Bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-dark-400">Salud del dispositivo</span>
          <span className={`text-xs font-medium ${health.text}`}>
            {getHealthLabel(score)}
          </span>
        </div>
        <div className="w-full h-3 bg-dark-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-out ${health.bg}`}
            style={{ width: `${healthAnim}%` }}
          />
        </div>
      </div>

      {/* Device Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatItem label="Conexiones" value={profile?.optimizationHistory?.length || device.profile?.connections || 0} icon="🔗" />
        <StatItem label="Optimizaciones" value={profile?.totalOptimizations || 0} icon="⚡" />
        <StatItem label="Primera vez" value={device.firstConnection ? 'Sí' : 'No'} icon="🆕" />
        <StatItem label="Última optimización" value={
          profile?.lastOptimization
            ? new Date(profile.lastOptimization).toLocaleDateString('es', { day: '2-digit', month: 'short' })
            : 'Nunca'
        } icon="📅" />
      </div>

      {/* Sparklines */}
      {profile && (
        <div className="grid grid-cols-2 gap-3">
          {profile.batteryHistory?.length > 2 && (
            <div className="bg-dark-900/50 rounded-lg p-3 border border-dark-700/20">
              <div className="text-xs text-dark-400 mb-1">🔋 Batería</div>
              <SparkLine data={profile.batteryHistory.map(b => b.level)} width={140} height={24} color="#10b981" />
            </div>
          )}
          {profile.temperatureHistory?.length > 2 && (
            <div className="bg-dark-900/50 rounded-lg p-3 border border-dark-700/20">
              <div className="text-xs text-dark-400 mb-1">🌡️ Temperatura</div>
              <SparkLine data={profile.temperatureHistory.map(t => t.value)} width={140} height={24} color="#f59e0b" />
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex gap-2">
        {!wifiStatus?.ip ? (
          <button onClick={handleWifiConnect} disabled={wifiLoading}
            className="flex-1 py-2 px-3 bg-accent-blue/10 hover:bg-accent-blue/20 border border-accent-blue/20
              text-accent-blue text-xs font-medium rounded-lg transition-all disabled:opacity-50">
            {wifiLoading ? '⏳ Conectando...' : '📶 WiFi'}
          </button>
        ) : (
          <button onClick={handleWifiDisconnect}
            className="flex-1 py-2 px-3 bg-accent-green/10 border border-accent-green/20
              text-accent-green text-xs font-medium rounded-lg">
            ✅ WiFi {wifiStatus.ip}
          </button>
        )}
        <button onClick={handleCreateBackup}
          className="flex-1 py-2 px-3 bg-dark-700/50 hover:bg-dark-600/50 border border-dark-600/30
            text-dark-300 text-xs font-medium rounded-lg transition-all">
          💾 Backup
        </button>
      </div>
      {wifiStatus?.error && (
        <p className="text-xs text-accent-red">{wifiStatus.error}</p>
      )}

      {/* Device Info */}
      <div className="border-t border-dark-700/50 pt-4 space-y-2">
        <InfoRow label="MIUI/HyperOS" value={info.miui || 'N/A'} />
        <InfoRow label="Hardware" value={info.hardware} />
        <InfoRow label="SDK" value={info.sdk} />
        <InfoRow label="Serial" value={device.deviceId} mono />
      </div>
    </div>
  );
}

function StatItem({ label, value, icon }) {
  return (
    <div className="bg-dark-900/50 rounded-lg p-3 border border-dark-700/20">
      <div className="flex items-center gap-2">
        <span className="text-sm">{icon}</span>
        <div>
          <div className="text-lg font-bold text-dark-100">{value}</div>
          <div className="text-xs text-dark-500">{label}</div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono = false }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-dark-400">{label}</span>
      <span className={`text-dark-200 ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  );
}
