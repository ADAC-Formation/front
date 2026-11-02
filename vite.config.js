import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Le manifeste permet à scripts/check-bundle.mjs de vérifier le budget et le découpage par page.
  build: { manifest: true },
  // Chargées à la demande par le modèle d'import : sans cela, le serveur de dev les découvre au premier
  // clic, re-optimise ses dépendances et fait échouer les pages déjà ouvertes (504 « Outdated Optimize Dep »).
  optimizeDeps: { include: ['write-excel-file/browser', '@onparallel/write-excel-file-data-validation'] },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
    css: false,
    // Même origine que l'API de test : jsdom applique CORS aux requêtes XHR avec cookies.
    environmentOptions: { jsdom: { url: 'http://localhost:8080' } },
    env: { VITE_API_URL: 'http://localhost:8080/api' },
  },
})
