# 📱 Phone Optimizer - Instalador Autónomo

Instalación rápida para Linux, Windows y macOS.

## Requisitos

| Requisito | Notas |
|---|---|
| **Node.js 18+** | Solo para desarrollo desde código fuente |
| **ADB** | Debe estar en PATH (`adb version`) |
| **Teléfono Android** | Depuración USB activada |

## Instalación Rápida

### Linux

```bash
chmod +x install-linux.sh
./install-linux.sh
```

El script:
- Detecta tu arquitectura (x64, arm64)
- Verifica integridad SHA512
- Instala en `~/.local/opt/phone-optimizer`
- Crea symlink en `~/.local/bin/phone-optimizer`

### Windows

```bat
install-windows.bat
```

El script:
- Verifica integridad SHA512
- Ejecuta el instalador NSIS (.exe)
- Seguí las instrucciones del asistente

### macOS

```bash
chmod +x install-mac.command
./install-mac.command
```

El script:
- Monta la imagen .dmg
- Copia la app a `/Applications`
- Verifica integridad SHA512

## Estructura

```
installer/
├── install-linux.sh      ← Instalador Linux (bash)
├── install-windows.bat   ← Instalador Windows (batch)
├── install-mac.command   ← Instalador macOS (bash)
├── SHA512SUMS.txt        ← Hashes de integridad
├── VERSION               ← Versión actual (de package.json)
└── README.md             ← Este archivo
```

## Verificación de Integridad

Todos los scripts verifican automáticamente los hashes SHA512 antes de instalar. Si el hash no coincide, la instalación se detiene.

Para generar hashes manualmente después de compilar:

```bash
sha512sum dist-release/*.AppImage dist-release/*.exe dist-release/*.dmg > installer/SHA512SUMS.txt
```

## Compilación (desde código fuente)

```bash
git clone https://github.com/pabloeckert/MejoraRedmi14c.git
cd MejoraRedmi14c
npm install
npm run build
```

Los instaladores se generan en `dist-release/`.

## Notas

- **Linux**: Si `~/.local/bin` no está en PATH, agregalo a `~/.bashrc` o `~/.zshrc`
- **macOS**: En la primera ejecución, macOS puede bloquear la app. Andá a `Preferencias del Sistema → Seguridad y Privacidad` y hacé clic en "Abrir de todos modos"
- **Windows**: El instalador NSIS puede requerir permisos de administrador
