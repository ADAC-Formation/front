import js from '@eslint/js'
import globals from 'globals'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: { ...globals.browser, __APP_VERSION__: 'readonly' },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  // NOTES-34 : règles d'accessibilité du JSX, sur le code de l'application (pas les tests, dont les gabarits
  // imitent volontairement des cas limites). Le plugin ne déclare pas encore ESLint 10 : `overrides` de
  // package.json lui fait accepter la version du projet (vérifié : aucune erreur d'exécution).
  {
    files: ['src/**/*.jsx'],
    ignores: ['**/*.test.jsx', 'src/test/**'],
    extends: [jsxA11y.flatConfigs.recommended],
  },
  {
    files: ['scripts/**', 'vite.config.js'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['**/*.test.{js,jsx}', 'src/test/**'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node, vi: 'readonly', describe: 'readonly', it: 'readonly', expect: 'readonly', beforeAll: 'readonly', afterAll: 'readonly', beforeEach: 'readonly', afterEach: 'readonly' },
    },
  },
])
