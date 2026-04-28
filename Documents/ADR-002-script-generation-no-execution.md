# ADR-002: Generación de Scripts (No Ejecución Directa)

## Estado: Aceptado

## Contexto
La app necesita ejecutar comandos ADB en el dispositivo del usuario. Hay dos enfoques:
1. Ejecutar comandos directamente vía ADB
2. Generar scripts bash que el usuario ejecuta manualmente

## Decisión
**Generar scripts .sh para que el usuario los ejecute manualmente**

### Alternativas consideradas:
1. **Ejecución directa vía Electron IPC** — Más cómodo para el usuario, pero requiere ADB conectado a la app
2. **Ejecución directa vía WebUSB** — API experimental, soporte limitado
3. **Generar scripts + ejecutar (Electron)** — Híbrido, pero aumenta superficie de ataque

### Razones:
- **Seguridad**: El usuario lee el script antes de ejecutarlo. No hay ejecución oculta.
- **Transparencia**: Cada comando es visible y auditable.
- **Portabilidad**: Los scripts funcionan en cualquier OS con bash + ADB.
- **Simplicidad**: No necesitamos acceso directo al dispositivo desde la app.
- **Confianza**: Los usuarios de Android que usan ADB prefieren ver qué se ejecuta.

## Consecuencias
- ✅ Superficie de ataque mínima (la app nunca toca el dispositivo)
- ✅ Confianza del usuario (ve exactamente qué se ejecuta)
- ✅ Funciona en web y desktop sin cambios
- ⚠️ Requiere que el usuario sepa copiar/ejecutar un script
- ⚠️ Menos "one-click" que una ejecución directa
