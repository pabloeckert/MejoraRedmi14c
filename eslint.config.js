import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'release']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  {
    files: ['electron/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        require: 'readonly',
        __dirname: 'readonly',
        module: 'readonly',
        process: 'readonly',
      },
    },
    rules: {
      'no-undef': 'off',
    },
  },
  {
    files: ['vite.config.js', 'vitest.config.js', 'playwright.config.js'],
    languageOptions: {
      globals: {
        process: 'readonly',
      },
    },
    rules: {
      'no-undef': 'off',
    },
  },
])
