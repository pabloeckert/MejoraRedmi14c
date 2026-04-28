# ADR-003: Bloatware en JSON Externo

## Estado: Aceptado

## Contexto
La lista de paquetes de bloatware del Redmi 14C estaba hardcodeada en `device.js`. Cada cambio requería modificar código, hacer build y redeploy.

## Decisión
**Extraer la lista a `bloatware.json` y cargarla dinámicamente**

### Alternativas consideradas:
1. **Hardcodeado en device.js** — Simple, pero requiere redeploy para cada cambio
2. **JSON externo cargado via fetch** — Más flexible, pero necesita servidor o CDN
3. **JSON importado estáticamente** — Balance entre flexibilidad y simplicidad
4. **Base de datos remota** — Overkill para una lista de ~50 paquetes

### Razones:
- **Actualizabilidad**: Se puede editar `bloatware.json` sin tocar código
- **Colaboración**: Contribuidores pueden agregar paquetes sin saber React
- **Versionado**: El JSON está en git, se puede hacer diff y review
- **Validación**: Se puede añadir validación de esquema en el futuro

### Implementación:
```javascript
// device.js
import bloatwareData from './bloatware.json';
export const BLOATWARE = bloatwareData;
```

## Consecuencias
- ✅ Actualizaciones de bloatware sin redeploy
- ✅ Contribuciones más fáciles (solo editar JSON)
- ✅ Historial de cambios en git
- ⚠️ El JSON se incluye en el bundle (no se puede actualizar sin redeploy web)
- ⚠️ Futuro: considerar carga dinámica via fetch si se necesita actualización en caliente
