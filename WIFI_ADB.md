# WIFI_ADB.md — Conexión ADB por WiFi

## Visión General

Permite controlar el dispositivo Android sin cable USB, usando ADB over TCP/IP.

## Flujo

```
USB conectado → enableTcpIp() → getDeviceIP() → adb connect IP:5555 → WiFi conectado
```

## Módulo: `/src/adb/wifi.js`

### `enableTcpIp(deviceId, port)`
- Ejecuta `adb tcpip {port}` via USB
- Reinicia el daemon ADB en modo TCP/IP
- Puerto por defecto: 5555

### `getDeviceIP(deviceId)`
- Método 1: `ip addr show wlan0` → extrae IP
- Método 2: `ifconfig wlan0` → fallback
- Método 3: `dumpsys wifi` → fallback final

### `connectOverWifi(deviceId, ip, port)`
- Habilita TCP/IP via USB
- Obtiene IP automáticamente si no se proporciona
- Ejecuta `adb connect {ip}:{port}`
- Guarda la conexión en memoria

### `verifyWifiConnection(deviceId)`
- Ejecuta `shell echo ok` para verificar conexión
- Retorna `{ connected: true/false, ip, port }`

### `disconnect(deviceId)`
- Ejecuta `adb disconnect {ip}:{port}`
- Limpia la conexión de memoria

### `autoReconnect(deviceId)`
- Intenta reconectar usando la IP guardada
- Retorna true/false

## Persistencia

La IP del dispositivo se guarda en el perfil:
```
/devices/{deviceId}_profile.json → wifiIP
```

## UI

- Botón "📶 WiFi" en DeviceOverview
- Muestra IP cuando está conectado
- Permite desconectar

## Limitaciones

- Requiere conexión USB inicial para habilitar TCP/IP
- El dispositivo y la PC deben estar en la misma red WiFi
- Al reiniciar el dispositivo, TCP/IP se desactiva (requiere reconexión USB)
- Puerto 5555 por defecto (configurable)
