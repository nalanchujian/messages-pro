import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/messages-pro/',
  // Removed pages must return 404 instead of falling back to the homepage.
  appType: 'mpa',
  // Keep the running app's dependency cache separate from middleware test servers.
  cacheDir: 'node_modules/.vite-app',
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        app: 'app/index.html',
        infloww: 'infloww/index.html',
        valuePlaybook: 'research/value-playbook/index.html',
      },
    },
  },
})
