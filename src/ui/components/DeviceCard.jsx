import React from 'react';

export default function DeviceCard({ device, result }) {
  const info = device.deviceInfo || {};
  const isFirst = device.firstConnection;

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="text-3xl">📱</div>
        <div>
          <h3 className="font-semibold text-lg">{info.model || 'Dispositivo Android'}</h3>
          <p className="text-dark-400 text-sm">{info.brand} — {info.device}</p>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <InfoRow label="Android" value={info.android} />
        <InfoRow label="MIUI" value={info.miui || 'N/A'} />
        <InfoRow label="Hardware" value={info.hardware} />
        <InfoRow label="Serial" value={device.deviceId} mono />

        <div className="border-t border-dark-700 my-3" />

        <div className="flex items-center justify-between">
          <span className="text-dark-400">Primera conexión</span>
          <span className={isFirst ? 'text-accent-orange font-medium' : 'text-accent-green'}>
            {isFirst ? '⚡ Sí — Optimización máxima' : '✅ No — Optimización inteligente'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-dark-400">Propietario</span>
          <span className="text-dark-200">{device.owner || 'Sin asignar'}</span>
        </div>

        {result && (
          <>
            <div className="border-t border-dark-700 my-3" />
            <div className="flex items-center justify-between">
              <span className="text-dark-400">Última optimización</span>
              <span className={result.success ? 'text-accent-green' : 'text-accent-red'}>
                {result.success ? '✅ Exitosa' : '❌ Con errores'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-dark-400">Duración</span>
              <span className="text-dark-200 font-mono">
                {(result.durationMs / 1000).toFixed(1)}s
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono = false }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-dark-400">{label}</span>
      <span className={`text-dark-200 ${mono ? 'font-mono text-xs' : ''}`}>
        {value}
      </span>
    </div>
  );
}
