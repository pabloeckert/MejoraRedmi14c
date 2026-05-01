# ADVANCED_DIAGNOSTICS.md — Panel de Diagnóstico Avanzado

## Visión General

Diagnóstico profundo del dispositivo que va más allá de las métricas básicas.

## Componente: `/src/ui/components/AdvancedDiagnostics.jsx`

## Secciones del Diagnóstico

### 🔋 Salud de Batería
- Nivel actual (%)
- Estado (cargando/descargando/completa)
- Voltaje (mV)
- Temperatura de batería
- Tecnología (Li-ion, etc.)
- Tipo de carga (USB/AC)

### 🌡️ Temperatura por Componente
- Zonas térmicas del dispositivo
- Lecturas individuales por sensor
- Alerta visual si > 40°C

### 📡 Estado de Sensores
- Lista de sensores activos
- Valores actuales
- Limitado a 10 sensores principales

### 📶 Estado de Radio
- WiFi: activo/inactivo + IP
- Datos móviles: activo/inactivo
- Operador de red
- Tipo de red (LTE, 5G, etc.)

### 🏷️ Servicios MIUI/HyperOS
- Conteo total de servicios MIUI activos
- Lista de servicios detectados
- Alerta si > 15 servicios

### 💀 Procesos Zombis
- Procesos en estado Z (zombie)
- Consumen recursos sin hacer nada
- Recomendación de limpieza

### 🔄 Servicios que se Reactivan
- Servicios deshabilitados que vuelven a activarse
- Comparación entre `pm list packages -d` y servicios activos
- Recomendación de deshabilitar permanente

## Fuente de Datos

Todas las lecturas via ADB shell commands:
- `dumpsys battery`
- `dumpsys thermalservice`
- `dumpsys sensorservice`
- `settings get global wifi_on`
- `dumpsys activity services`
- `ps -A -o PID,STAT,NAME`
- `pm list packages -d`

## Parsers en main.js

- `parseBatteryDetailed()` — key-value de dumpsys battery
- `parseThermalZones()` — zonas térmicas
- `parseSensors()` — sensores activos
- `parseMIUIServices()` — filtrado por keywords MIUI
- `parseZombies()` — procesos con estado Z
- `parseSelfReactivating()` — deshabilitados que aparecen en servicios
