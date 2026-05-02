# 🛠️ Build Environment Windows — Phone Optimizer

Script autónomo que configura todo el entorno de compilación en Windows y genera el instalador `.exe`.

## Ejecución rápida

```
setup-windows-build-env.bat
```

Doble click y listo. El script hace todo automáticamente.

## Qué instala

| Componente | Tamaño aprox | Propósito |
|---|---|---|
| **Visual Studio Build Tools 2022** | ~2-4 GB | Compilador MSVC para Node.js nativo |
| **VC++ Tools x86/x64** | incluido | Compilador C++ |
| **Windows SDK 10.0.19041** | incluido | Headers de Windows |
| **CMake Tools** | incluido | Compilación de módulos nativos |

**No instala** Visual Studio completo, solo los Build Tools necesarios para compilar.

## Qué hace (paso a paso)

1. **Detecta** si MSVC ya está instalado (evita reinstalar)
2. **Descarga** `vs_BuildTools.exe` desde Microsoft (~1 MB el instalador)
3. **Instala** componentes en modo silencioso (sin ventanas emergentes)
4. **Configura** el entorno MSVC ejecutando `vcvarsall.bat x64`
5. **Verifica** que `cl.exe` funcione
6. **Ejecuta** `npm install` para dependencias del proyecto
7. **Ejecuta** `npm run build:win` para compilar el instalador
8. **Copia** el `.exe` generado a `/installer`
9. **Regenera** `SHA512SUMS.txt` con los hashes actualizados
10. **Actualiza** `VERSION` desde `package.json`

## Requisitos previos

| Requisito | Cómo verificar |
|---|---|
| **Windows 10/11** | Cualquier versión reciente |
| **Node.js 18+** | `node --version` |
| **npm** | `npm --version` |
| **Internet** | Para descargar Build Tools |
| **~5 GB libres** | Para VS Build Tools + node_modules + build |

## Resultado

Después de ejecutar el script, la carpeta `/installer` contendrá:

```
installer/
├── PhoneOptimizer-Setup-1.0.0.exe   ← Instalador final
├── setup-windows-build-env.bat      ← Este script
├── install-windows.bat              ← Script de instalación
├── SHA512SUMS.txt                   ← Hashes actualizados
├── VERSION                          ← Versión actual
└── README.md                        ← Documentación general
```

## Permisos

- El script solicita **permisos de Administrador** automáticamente si no los tiene
- Solo se necesitan para instalar VS Build Tools
- El build en sí no requiere permisos especiales

## Re-ejecutable

El script es **idempotente**: podés ejecutarlo múltiples veces sin problemas.

- Si MSVC ya está instalado, salta directo al build
- Si node_modules ya existe y está completo, salta `npm install`
- Si ya había un `.exe` en `/installer`, lo sobreescribe

## Solución de problemas

| Error | Solución |
|---|---|
| `cl.exe no encontrado` | Reiniciá la computadora después de instalar VS Build Tools |
| `npm install falla` | Verificá conexión a internet y que Node.js sea 18+ |
| `build:win falla` | Ejecutá `npm install` manualmente primero |
| `No se descarga el instalador` | Descargalo manualmente de https://aka.ms/vs/17/release/vs_BuildTools.exe |

## Distribución

Para distribuir el proyecto compilado:

1. Ejecutá `setup-windows-build-env.bat`
2. Copiá toda la carpeta `/installer`
3. El destinatario solo necesita ejecutar `install-windows.bat`
