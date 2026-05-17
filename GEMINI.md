# MejoraRedmi14c - Guía del Proyecto

Este proyecto es un kit de herramientas avanzado para la optimización de dispositivos Android, específicamente diseñado para el **Redmi 14C** (HyperOS / Android 14 / MediaTek Helio G81 Ultra). Permite mejorar el rendimiento, la fluidez y la duración de la batería mediante comandos ADB.

## Arquitectura del Proyecto

El proyecto se divide en dos componentes principales:

1.  **Scripts de Shell (Recomendado):** Una colección de scripts modulares para ejecución local via terminal.
    -   `optimizer.sh`: Menú interactivo principal.
    -   `mega-optimizer.sh`: Script "todo en uno" que aplica optimizaciones masivas (bloatware, GPU, animaciones, memoria).
    -   `config.sh`: Configuración compartida y valores canónicos para todos los scripts.
    -   `rescue.sh`: Sistema de puntos de restauración para seguridad.
2.  **Interfaz Web:** Una aplicación web experimental que utiliza WebUSB para ejecutar comandos ADB directamente desde el navegador.
    -   `index.html`: Interfaz de usuario.
    -   `adb.js`: Implementación del protocolo ADB sobre WebUSB.
    -   `app.js`: Lógica de negocio de la aplicación web.

## Tecnologías Principales

-   **Shell Scripting (Bash):** Automatización de comandos ADB.
-   **ADB (Android Debug Bridge):** Comunicación con el dispositivo Android.
-   **JavaScript (Vanilla):** Lógica de la aplicación web y protocolo ADB.
-   **WebUSB API:** Conectividad USB nativa en navegadores compatibles.

## Guía de Uso

### Scripts de Terminal

1.  **Preparación:**
    ```bash
    chmod +x *.sh
    ```
2.  **Optimización Completa (Recomendado):**
    ```bash
    ./run-optimize.sh
    ```
3.  **Menú Interactivo:**
    ```bash
    ./optimizer.sh
    ```

### App Web

1.  Asegúrate de usar un navegador compatible (Chrome, Edge u Opera).
2.  Abre `index.html` directamente o sírvelo localmente:
    ```bash
    python3 -m http.server 8000
    ```
3.  Conecta el dispositivo y activa la "Depuración USB".

## Convenciones de Desarrollo

### Scripts de Shell
-   **Sourcear Configuración:** Todos los scripts deben incluir `source ./config.sh` para mantener consistencia en colores, logs y valores de sistema.
-   **Seguridad Primero:** 
    -   Siempre verificar la conexión ADB antes de proceder.
    -   Validar el fabricante del dispositivo (Xiaomi/Redmi/POCO).
    -   Verificar la temperatura del dispositivo (>40°C aborta la operación).
-   **Idempotencia:** Los scripts deben intentar detectar si un cambio ya fue aplicado para evitar redundancia.

### Interfaz Web
-   **Modularidad:** Mantener el protocolo ADB (`adb.js`) separado de la lógica de optimización (`app.js`).
-   **Feedback Visual:** Proporcionar logs en tiempo real al usuario dentro de la interfaz.

## Archivos Clave

-   `config.sh`: El "Single Source of Truth" para valores de optimización (animaciones, swappiness, etc.).
-   `bloatware-db.sh`: Base de datos de paquetes de aplicaciones de Xiaomi y Google que pueden ser removidos de forma segura.
-   `mega-optimizer.sh`: El script con la mayor lógica de impacto en el sistema.
-   `rescue.sh`: Gestiona los backups automáticos antes de aplicar cambios agresivos.

## Roadmap / TODO
-   [ ] Implementar sistema de logs centralizado en `/logs`.
-   [ ] Expandir `bloatware-db.sh` con más paquetes de HyperOS.
-   [ ] Mejorar la estabilidad del protocolo WebUSB en `adb.js`.
