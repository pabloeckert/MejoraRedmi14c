# 📋 User Stories — MejoraRedmi14c

> Cada historia incluye: rol, acción, beneficio y criterios de aceptación.

---

## Módulo: Backup

### US-001: Backup de contactos
**Como** usuario del Redmi 14C,
**quiero** exportar mis contactos a un archivo VCF,
**para** no perder mis contactos si algo sale mal.

**Criterios de aceptación:**
- [ ] Selecciono "Contactos" en la lista de backup
- [ ] El script generado incluye el comando para exportar contactos
- [ ] El archivo VCF se guarda en la carpeta de backup

### US-002: Backup completo
**Como** usuario que va a hacer cambios en el sistema,
**quiero** respaldar contactos, fotos, WhatsApp y APKs de una vez,
**para** tener un backup completo antes de modificar el teléfono.

**Criterios de aceptación:**
- [ ] Puedo seleccionar/deseleccionar todos los items
- [ ] El script genera una carpeta organizada por categoría
- [ ] Cada categoría tiene su propio subdirectorio

---

## Módulo: Debloat

### US-003: Perfil seguro de debloat
**Como** usuario principiante,
**quiero** un perfil que solo elimine bloatware obvio,
**para** no romper funcionalidades del teléfono.

**Criterios de aceptación:**
- [ ] El perfil "Seguro" solo incluye paquetes no esenciales
- [ ] Cada paquete tiene una descripción de qué es
- [ ] Se muestra un badge de riesgo para cada paquete

### US-004: Personalización de debloat
**Como** usuario avanzado,
**quiero** poder seleccionar individualmente qué paquetes eliminar,
**para** tener control total sobre qué se desinstala.

**Criterios de aceptación:**
- [ ] Puedo activar/desactivar paquetes individualmente
- [ ] El contador se actualiza en tiempo real
- [ ] El perfil agresivo muestra una advertencia antes de generar

---

## Módulo: Performance

### US-005: Animaciones más rápidas
**Como** usuario del Redmi 14C,
**quiero** que las animaciones sean más rápidas (0.5x),
**para** que el teléfono se sienta más rápido e instantáneo.

**Criterios de aceptación:**
- [ ] La opción de animaciones 0.5x está seleccionada por defecto
- [ ] Se muestra el comando ADB correspondiente
- [ ] El riesgo es "Sin riesgo" y el impacto es "Alto"

### US-006: Desactivar RAM virtual
**Como** usuario que quiere mejor rendimiento,
**quiero** desactivar la RAM virtual,
**para** que el teléfono no use almacenamiento lento como RAM.

**Criterios de aceptación:**
- [ ] La opción está seleccionada por defecto
- [ ] Se explica por qué la RAM virtual es contraproducente
- [ ] El comando es reversible

---

## Módulo: Estética

### US-007: Activar blur nativo
**Como** usuario que quiere una UI más moderna,
**quiero** activar el efecto blur nativo de HyperOS,
**para** que la interfaz se vea premium con glassmorphism.

**Criterios de aceptación:**
- [ ] La opción está disponible y seleccionada por defecto
- [ ] Se describe el efecto visual esperado
- [ ] El riesgo es "Sin riesgo"

### US-008: Forzar 90Hz
**Como** usuario que quiere una experiencia más fluida,
**quiero** forzar el refresh rate a 90Hz,
**para** que todo se vea más suave.

**Criterios de aceptación:**
- [ ] Se muestra la advertencia de mayor consumo de batería
- [ ] El riesgo es "Bajo"
- [ ] Se puede revertir a 60Hz

---

## Módulo: Rescate

### US-009: Restaurar app específica
**Como** usuario que eliminó un paquete por error,
**quiero** restaurar una app específica por su nombre de paquete,
**para** no tener que restaurar todo.

**Criterios de aceptación:**
- [ ] Hay un campo de texto para ingresar el nombre del paquete
- [ ] Se genera el comando `pm install-existing`
- [ ] Se puede copiar el comando con un click

### US-010: Script de restauración completa
**Como** usuario que quiere deshacer todos los cambios,
**quiero** un script que restaure todo lo que se modificó,
**para** volver al estado original del teléfono.

**Criterios de aceptación:**
- [ ] El script restaura animaciones, configuraciones y apps
- [ ] Se puede descargar como archivo .sh
- [ ] Se incluyen comentarios explicativos en el script

---

## Módulo: Root

### US-011: Guía de root paso a paso
**Como** usuario avanzado que quiere root,
**quiero** una guía paso a paso con Magisk,
**para** saber exactamente qué hacer sin arriesgar mi teléfono.

**Criterios de aceptación:**
- [ ] La guía tiene 6 pasos numerados
- [ ] Cada paso se puede expandir/contraer
- [ ] Se incluyen advertencias de riesgo claras
- [ ] Se menciona que root es opcional (80% de mejora sin root)

---

## Transversales

### US-012: Onboarding
**Como** usuario nuevo,
**quiero** un wizard de bienvenida que me explique los pasos,
**para** entender cómo usar la app sin confusiones.

**Criterios de aceptación:**
- [ ] Se muestra en la primera visita
- [ ] Tiene 3 pasos: conectar, backup, optimizar
- [ ] Se puede saltar
- [ ] Se guarda en localStorage que ya se vio

### US-013: Disclaimer legal
**Como** usuario,
**quiero** ver un aviso de seguridad antes de usar la app,
**para** entender los riesgos de usar scripts ADB.

**Criterios de aceptación:**
- [ ] Se muestra en la primera visita (antes del onboarding)
- [ ] Explica que todo es reversible
- [ ] Se puede volver a ver desde Configuración
- [ ] Se acepta con un botón claro

### US-014: i18n — 4 idiomas
**Como** usuario hispanohablante/anglófono/lusófono/francófono,
**quiero** usar la app en mi idioma,
**para** entender todas las instrucciones y opciones.

**Criterios de aceptación:**
- [ ] ES (voseo), EN, PT, FR disponibles
- [ ] 130+ strings traducidos por idioma
- [ ] Selector visual con 4 botones en Settings
- [ ] Se persiste la selección en localStorage

### US-015: FAQ
**Como** usuario con dudas,
**quiero** un panel de preguntas frecuentes accesible desde la app,
**para** resolver mis dudas sin salir de la app.

**Criterios de aceptación:**
- [ ] Botón flotante (esquina inferior izquierda)
- [ ] 10 preguntas frecuentes con respuestas expandibles
- [ ] Campo de búsqueda para filtrar
- [ ] Accesible con teclado
