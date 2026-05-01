# ULTRA_AESTHETIC.md — Modo Ultra Aesthetic

## Visión General

Efectos visuales premium que transforman la interfaz de funcional a impresionante.

## Módulo: `/src/ui/theme/ultraAesthetic.js`

## Efectos Incluidos

### Glassmorphism Avanzado
- `backdrop-filter: blur(24px) saturate(1.8)`
- Bordes semi-transparentes con `rgba(255,255,255,0.06)`
- Sombras múltiples (exterior + inset highlight)
- Hover: mayor blur, brillo y elevación (`translateY(-1px)`)

### Background Dinámico
- Gradiente animado de 4 colores oscuros
- `background-size: 400% 400%` con animación de 15s
- Shift suave entre posiciones del gradiente

### Glow Effects
- Texto con `text-shadow` en gradient-text
- Status dots con `box-shadow` pulsante
- Scrollbar con gradiente azul→púrpura

### Microinteracciones
- Botones: `scale(0.97)` en `:active`
- Filtro `brightness(1.1)` en hover
- Transiciones `cubic-bezier(0.4, 0, 0.2, 1)`

### Card Shimmer
- Pseudo-elemento `::before` con gradiente
- Animación de deslizamiento cada 8s
- Sutil, no intrusivo

### Radial Glow en Metric Cards
- Tracking de mouse con `--mouse-x` / `--mouse-y`
- `radial-gradient` que sigue al cursor
- Solo en elementos con `data-metric-card`

### Loading Spinner 3D
- Rotación combinada Y + X
- Efecto de profundidad

### Tab Transitions
- Fade-in con `translateY(8px)` → `0`
- Duración 300ms

### Pulse Ring
- Anillo pulsante en botón de optimizar
- Gradiente púrpura→rosa
- Opacidad oscilante

## Activación

### Desde UI
- Toggle "✨ Aesthetic" en el header
- Toggle "Ultra Aesthetic Mode" en Settings

### Programáticamente
```javascript
const ua = require('./src/ui/theme/ultraAesthetic');
ua.enable();   // Activa
ua.disable();  // Desactiva
ua.toggle();   // Toggle
ua.isActive(); // Estado
```

## Implementación

Se inyecta una hoja de estilos `<style id="ultra-aesthetic">` en el `<head>` y se agrega la clase `ua-active` al `<html>`. Al desactivar, se remueven ambos.

## Consideraciones de Performance

- Todos los efectos usan CSS puro (no JS animation loops)
- `backdrop-filter` es GPU-accelerado
- El tracking de mouse usa `requestAnimationFrame` implícito (event throttling del browser)
- No afecta a dispositivos con `prefers-reduced-motion`
