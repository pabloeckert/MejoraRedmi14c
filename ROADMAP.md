# ROADMAP.md — Phone Optimizer

## Fase 1: Base Funcional ✅ (Ciclo 1)
- [x] Estructura del proyecto (Electron + Vite + Tailwind)
- [x] Detección automática de dispositivo
- [x] Motor de optimización máxima (primera conexión)
- [x] Motor de optimización inteligente (reconexiones)
- [x] Sistema de logs por dispositivo
- [x] UI mínima funcional
- [x] Documentación base

## Fase 2: Inteligencia ✅ (Ciclo 2)
- [x] Dashboard en tiempo real con métricas live (CPU, RAM, temp, batería, procesos, servicios MIUI)
- [x] Gráficos de tendencias (batería, temperatura, procesos, apps, rendimiento)
- [x] Comparativa pre/post optimización
- [x] Perfiles inteligentes por dispositivo (DeviceProfile + health score)
- [x] Smart Insights (predicciones ML, apps problemáticas, procesos recurrentes)
- [x] Integración ML con UI (predicciones en tiempo real)
- [x] UI con tabs (Overview, Tiempo Real, Tendencias, Insights)

## Fase 3: Autonomía ✅ (Ciclo 3)
- [x] Conexión ADB por WiFi (enableTcpIp, connectOverWifi, verifyWifiConnection)
- [x] Sistema de backup completo (apps, servicios, settings, batería, procesos)
- [x] Rollback automático si optimización falla
- [x] Modo automático (detectar → optimizar → registrar → notificar)
- [x] Notificaciones del sistema (Electron Notification API)
- [x] Programación de optimizaciones (intervalo, batería, temperatura)
- [x] Manejo centralizado de errores con logs
- [x] Settings panel (auto mode, WiFi, backups, scheduler, errores)

## Fase 4: ML Avanzado (Ciclo 4)
- [ ] Predicción de batería (cuándo necesitará carga)
- [ ] Detección de anomalías (malware, apps abusivas)
- [ ] Recomendaciones personalizadas por usuario
- [ ] Benchmark comparativo (score de rendimiento)
- [ ] Exportar/importar perfiles de optimización

## Fase 5: Producción (Ciclo 5)
- [ ] Installer multiplataforma (Windows, macOS, Linux)
- [ ] Auto-updates
- [ ] Logging remoto (opcional)
- [ ] Tests automatizados
- [ ] Documentación de usuario final
