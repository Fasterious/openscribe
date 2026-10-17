import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vitest/config'
import { fileURLToPath, URL } from 'node:url'

// En-têtes d'isolation : nécessaires plus tard pour la transcription locale
// (calcul parallèle dans le navigateur). Posés dès maintenant pour que le
// développement et l'aperçu se comportent comme la production.
const isolationHeaders = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'credentialless',
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    headers: isolationHeaders,
    // Les exports, rapports et notes écrits pendant une analyse ne rechargent pas la page (sinon l'analyse s'arrête).
    watch: { ignored: ['**/fixtures/**', '**/docs/**', '**/e2e/**', '**/*.md'] },
  },
  preview: { headers: isolationHeaders },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
})
