import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/messages-pro/',
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        app: 'app/index.html',
        infloww: 'infloww/index.html',
        report: 'reports/four-platform-module-comparison/index.html',
      },
    },
  },
})
