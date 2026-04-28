# ADR-001: React + Vite + Tailwind CSS

## Estado: Aceptado

## Contexto
Se necesitaba un stack frontend para una aplicación web que optimiza el Redmi 14C vía ADB. La app debe:
- Ser rápida y ligera (target: usuarios con conexiones lentas)
- Funcionar como PWA offline
- Compilarse a Desktop (Electron)
- Ser mantenible por un solo desarrollador

## Decisión
**React 19 + Vite 8 + Tailwind CSS 4**

### Alternativas consideradas:
1. **Vue + Vite** — Buena opción, pero React tiene ecosistema más grande
2. **Svelte** — Menor ecosistema, menos componentes UI disponibles
3. **Next.js** — Overkill para una app sin SSR, añade complejidad innecesaria
4. **CSS Modules / Styled Components** — Tailwind es más rápido para prototipar

### Razones:
- **React 19**: Concurrent features, ecosistema maduro, gran comunidad
- **Vite 8**: Velocidad de build extremadamente rápida, HMR instantáneo, ESM nativo
- **Tailwind 4**: Utility-first permite diseño rápido, oklch para colores perceptualmente uniformes, container queries nativas

## Consecuencias
- ✅ Build rápido (<2s en desarrollo)
- ✅ Code-splitting automático por módulo
- ✅ Fácil de encontrar ayuda/comunidad
- ⚠️ Tailwind genera CSS grande si no se tree-shakea (Vite lo maneja)
- ⚠️ React 19 es relativamente nuevo (posibles edge cases)
