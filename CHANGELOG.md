# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- Storybook with 5 component stories (GlassCard, Badge, RiskBadge, ImpactBadge, CopyButton)
- FAQ panel with 10 questions and search
- Keyboard shortcuts (1-6 for modules, ⌘G to generate, ⌘, for settings, ? for help)
- Visual regression tests (5 screenshot tests with Playwright)
- i18n: Portuguese (PT) and French (FR) — 4 languages total
- Loading skeleton components (Skeleton, ModuleSkeleton)
- ADRs: 3 Architecture Decision Records
- User Stories: 15 stories with acceptance criteria
- Disclaimer legal: security notice on first visit, re-visible from Settings
- Analytics: localStorage-only usage tracking (zero PII)

### Changed
- DebloatModule: PackageItem memoized with React.memo + useCallback
- PerformanceModule: TweakItem memoized with React.memo + useCallback
- README: restructured with flow diagram, security section, updated badges
- CI: deploy.yml now runs lint + tests before build
- Settings: language selector now shows 4 buttons (ES/EN/PT/FR)

### Fixed
- Added missing LICENSE (MIT) file

## [1.0.0] - 2026-04-29

### Added
- Initial release
- 6 modules: Backup, Debloat, Performance, Aesthetics, Rescue, Root
- 83 tests (70 unit + 13 E2E)
- Electron desktop app (Windows, macOS, Linux)
- PWA with offline support
- i18n: Spanish (voseo) + English
- CI/CD: GitHub Actions → GitHub Pages
- Auto-update for Electron
- Onboarding wizard
- Script history panel
- Theme toggle (light/dark)
- Bloatware JSON external file (updatable without redeploy)
