import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
