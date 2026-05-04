# Phone Optimizer v2.1

Optimizador Android por ADB. Dos formas de usar: **scripts locales** (recomendado) o **app web**.

---

## 🖥️ Scripts locales (ADB en la PC)

### Requisitos
- ADB instalado (`platform-tools`)
- Cable USB con datos
- Depuración USB activada en el teléfono

### Uso rápido

```bash
# Menú interactivo con todas las opciones
./optimizer.sh

# O ejecutar un perfil directamente:
./perfil-rendimiento.sh    # 🚀 Máxima velocidad
./perfil-equilibrado.sh    # 📱 Uso diario
./perfil-bateria.sh        # 🔋 Ahorro de batería

# Herramientas:
./diagnostico.sh           # 🔍 Estado del dispositivo
./mantenimiento.sh         # 🔧 Limpieza periódica
./emergencia.sh            # 🚨 Restaurar TODO
```

### ¿Qué hace cada perfil?

| Perfil | Animaciones | GPU | Bloatware | Kill apps | Cache |
|---|---|---|---|---|---|
| Rendimiento | 0.3x | Forzada | 21 apps | Todas | Profunda |
| Equilibrado | 0.5x | Forzada | 3 apps | No | Segura |
| Batería | 0.5x | Sin cambios | 6 apps | Todas | Segura |

### Modo Emergencia

Si algo anda mal después de optimizar:

```bash
./emergencia.sh
```

Restaura: apps del sistema, animaciones (1x), GPU, permisos de SystemUI.

---

## 🌐 App Web (WebUSB)

Alternativa sin ADB en la PC. Abrí `index.html` en Chrome.

### Requisitos
- Chrome, Edge u Opera (WebUSB no funciona en Firefox/Safari)
- `adb kill-server` antes de abrir (libera el USB para el navegador)

```bash
adb kill-server
python3 -m http.server 8000
# Abrir http://localhost:8000
```

---

## Archivos

```
optimizer.sh            ← Menú principal (empezar acá)
perfil-rendimiento.sh   ← Perfil agresivo
perfil-equilibrado.sh   ← Perfil balanceado
perfil-bateria.sh       ← Perfil ahorro
mantenimiento.sh        ← Limpieza mensual
diagnostico.sh          ← Estado del sistema
emergencia.sh           ← Restaurar todo

index.html              ← App web
adb.js                  ← Protocolo ADB sobre WebUSB
app.js                  ← Lógica de la app web
styles.css              ← Estilos
```
