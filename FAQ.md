# Preguntas Frecuentes (FAQ)

### 1. ¿Pierdo la garantía de mi teléfono por usar esto?
**No.** Todo el proyecto está basado en comandos oficiales de ADB (`Android Debug Bridge`) previstos por Google. No se modifican particiones del sistema ni se desbloquea el bootloader. Si necesitas enviar el teléfono al servicio técnico, basta con ejecutar `./emergencia.sh` y el celular volverá a la normalidad de fábrica.

### 2. ¿Necesito ser usuario ROOT?
**Absolutamente no.** Todo el toolkit funciona de manera estándar mediante Depuración USB.

### 3. ¿El optimizador borra mis datos personales, fotos o cuentas?
**No.** Los comandos de limpieza solo atacan la *cache* (archivos temporales del sistema o thumbnails redundantes). Tus fotos de la galería, documentos, chats de WhatsApp y cuentas permanecerán intactos.

### 4. ¿Funciona en otros modelos de Xiaomi / POCO / Redmi?
**Sí, en la gran mayoría.** Los ajustes de animación, renderizado de red (DNS/TCP), RAM y compilación de memoria funcionan en cualquier dispositivo con Android. Sin embargo, la lista de desactivación de Bloatware está armada pensando en las apps que vienen con el Redmi 14C. Si corres los scripts en otro modelo, ADB simplemente saltará las apps que no encuentre.

### 5. ¿Qué es ADB y cómo lo instalo?
ADB es el puente que permite a una computadora mandarle instrucciones a tu Android a través de un cable USB.
* **Windows**: Descarga "Platform-tools" de la web oficial de Android, extráelo y agrégalo a las variables de entorno PATH.
* **Linux/Mac**: Puedes instalarlo ejecutando `sudo apt install android-tools` o `brew install android-platform-tools`.
Para ver una guía completa, lee el `TUTORIAL.md`.

### 6. ¿Qué hago si el script falla a mitad de la ejecución o se corta la luz?
No pasa nada. Los scripts son idempotentes en su mayoría (es decir, volver a aplicarlos no daña nada). Además, el primer paso que hace el optimizador masivo es crear un "Rescue Point" (punto de restauración). Si ocurre un error mayor o tu teléfono entra en un reinicio infinito, el propio dispositivo te mandará al "Recovery Mode" donde podrás hacer un restablecimiento de fábrica manual, o puedes conectar el USB y ejecutar `./emergencia.sh` para revertir todo.

### 7. ¿Puedo seguir recibiendo actualizaciones OTA (del sistema)?
**Sí.** Las actualizaciones oficiales llegarán sin problemas porque no hemos borrado los paquetes críticos (`pm uninstall`), solo los hemos desactivado o dormido (`pm disable-user`). Ten en cuenta que tras actualizar a una nueva versión de HyperOS, Xiaomi suele volver a encender sus servicios de fábrica, así que podrías necesitar volver a ejecutar el optimizador.
