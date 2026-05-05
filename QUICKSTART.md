# 🚀 Inicio Rápido — MejoraRedmi14c

## ¿Qué necesitás?
- Tu Redmi 14C
- Un cable USB (que transfiera datos, no solo cargue)
- Una PC con Windows, Mac o Linux

## Paso 1: Preparar el teléfono
1. **Ajustes** → **Sobre del teléfono** → Tocar **"HyperOS version"** 7 veces
2. Vas a ver: "Ya sos desarrollador"
3. **Ajustes** → **Ajustes adicionales** → **Opciones de desarrollador**
4. Activar **"Depuración USB"**

## Paso 2: Instalar ADB
### Windows
1. Descargá: https://dl.google.com/android/repository/platform-tools-latest-windows.zip
2. Descomprimilo en `C:\platform-tools`
3. Abrí PowerShell y escribí: `C:\platform-tools\adb version`

### Mac
```bash
brew install android-platform-tools
```

### Linux
```bash
sudo apt install android-sdk-platform-tools
```

## Paso 3: Clonar y ejecutar
```bash
git clone https://github.com/pabloeckert/MejoraRedmi14c.git
cd MejoraRedmi14c
chmod +x *.sh
./optimizer.sh
```

## Paso 4: Seguir el menú
El script te guía paso a paso. Recomendamos:
1. **Perfil Equilibrado** para empezar
2. Si querés más: **Perfil Rendimiento**
3. Si algo sale mal: **🚨 Restaurar todo**

## ¿Algo salió mal?
```bash
./emergencia.sh
```
Esto restaura TODO a como estaba antes.

## Probá primero con --dry-run
```bash
./mega-optimizer.sh --dry-run
```
Esto muestra lo que haría SIN cambiar nada.
