# Contributing to MejoraRedmi14c

¡Gracias por tu interés en contribuir! 

## Cómo contribuir

### Reportar un bug
1. Revisa los [issues existentes](https://github.com/pabloeckert/MejoraRedmi14c/issues) para evitar duplicados
2. Usa el template "Bug Report"
3. Incluye: dispositivo, versión de HyperOS, pasos para reproducir

### Sugerir una feature
1. Abre un issue con el template "Feature Request"
2. Describe el problema que resuelve
3. Si es un nuevo dispositivo: incluye `adb shell getprop` output

### Enviar un PR
1. Fork el repo
2. Creá una rama: `git checkout -b feature/mi-feature`
3. Commit con mensaje descriptivo: `feat: agregar soporte para Redmi Note 13`
4. Tests pasan: `npm run test:run && npm run test:e2e`
5. Lint limpio: `npm run lint`
6. Abrí el PR contra `main`

### Desarrollo local
```bash
npm install
npm run dev          # Dev server
npm run test         # Tests en watch
npm run test:e2e     # E2E tests
npm run lint         # Lint
```

### Convenciones
- **Commits:** [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `refactor:`)
- **Microcopy:** Voseo argentino en español
- **Componentes:** Un componente por archivo, barrel exports
- **Tests:** Tests para cada componente nuevo y cada función de servicio

### Áreas de contribución
- 📱 **Nuevos dispositivos:** Agregar datos de otros Xiaomi al catálogo
- 🌍 **Traducciones:** Agregar más idiomas a `src/locales/`
- 🧪 **Tests:** Mejorar cobertura de tests
- 🎨 **Diseño:** Mejoras al sistema de diseño
- 📖 **Documentación:** Mejorar guías y ejemplos

## Code of Conduct

Este proyecto sigue el [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). Al participar, esperamos que respetes estas reglas.
