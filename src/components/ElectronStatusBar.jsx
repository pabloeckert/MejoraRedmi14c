import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Terminal, Usb, Wifi, WifiOff } from 'lucide-react';
import { isElectron } from '../hooks/useElectron';
import { Badge } from './ui';

export function ElectronStatusBar() {
  const [adbStatus, setAdbStatus] = useState(null);
  const [devices, setDevices] = useState([]);
  const [deviceInfo, setDeviceInfo] = useState(null);

  useEffect(() => {
    if (!isElectron()) return;

    const check = async () => {
      const adb = await window.electronAPI.checkADB();
      setAdbStatus(adb);

      if (adb.available) {
        const dev = await window.electronAPI.listDevices();
        if (dev.success) setDevices(dev.devices);

        const info = await window.electronAPI.getDeviceInfo();
        if (info.success) setDeviceInfo(info.info);
      }
    };

    check();
    const interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, []);

  if (!isElectron()) return null;

  return (
    <motion.div
      className="glass rounded-xl p-3 mb-4 flex items-center justify-between"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-brand-500" />
          <span className="text-xs font-medium text-text-secondary">Desktop App</span>
        </div>

        <div className="flex items-center gap-2">
          {adbStatus?.available ? (
            <Badge variant="success"><Usb className="w-3 h-3" /> ADB Listo</Badge>
          ) : (
            <Badge variant="danger"><WifiOff className="w-3 h-3" /> ADB No encontrado</Badge>
          )}

          {devices.length > 0 ? (
            <Badge variant="success"><Wifi className="w-3 h-3" /> {devices[0].serial}</Badge>
          ) : adbStatus?.available ? (
            <Badge variant="warning">Sin dispositivo</Badge>
          ) : null}
        </div>
      </div>

      {deviceInfo && (
        <div className="flex items-center gap-3 text-xs text-text-muted">
          <span>{deviceInfo.brand} {deviceInfo.model}</span>
          <span>Android {deviceInfo.android}</span>
          {deviceInfo.miui && <span>HyperOS {deviceInfo.miui}</span>}
        </div>
      )}
    </motion.div>
  );
}
