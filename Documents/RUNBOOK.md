# 📖 Runbook Operativo

> Guías paso a paso para operaciones del proyecto.

---

## Comandos Útiles

### Desarrollo
```bash
# Iniciar entorno de desarrollo
# (por definir según stack)

# Ejecutar tests
# (por definir según stack)

# Build de producción
# (por definir según stack)
```

### Deployment
```bash
# Deploy a staging
# (por definir)

# Deploy a producción
# (por definir)

# Rollback
# (por definir)
```

### Monitoreo
```bash
# Verificar salud del sistema
# (por definir)

# Revisar logs
# (por definir)

# Métricas clave
# (por definir)
```

---

## Escenarios de Incidentes

### 🔴 Servicio caído
1. Verificar alertas en dashboard de monitoreo
2. Revisar logs de la última hora
3. Identificar si es infraestructura o código
4. Ejecutar rollback si es reciente
5. Escalar a SRE si persiste

### 🟡 Degradación de performance
1. Revisar métricas de CPU/Memory/IO
2. Identificar queries lentos
3. Verificar dependencias externas
4. Considerar escalado horizontal

### 🔵 Datos inconsistentes
1. Identificar fuente de verdad
2. Revisar logs de transacciones
3. Ejecutar reconciliación si es posible
4. Notificar a DPO si hay impacto en datos personales

---

## Contactos de Escalación

| Rol | Responsabilidad | Escalar cuando |
|-----|----------------|----------------|
| Support T1 | Primer contacto | Siempre primero |
| Support T2 | Debugging avanzado | T1 no puede resolver |
| Support T3 | Arquitectura y código | T2 identifica bug complejo |
| SRE | Infraestructura | Degradación o caída |
| Cybersecurity | Incidentes de seguridad | Cualquier sospecha de breach |
| DPO | Datos personales | Cualquier incidente de datos |

---

> Este runbook se completará conforme se defina la infraestructura.
