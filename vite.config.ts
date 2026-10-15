import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/messages-pro/',
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        infloww: 'infloww/index.html',
      },
    },
  },
})
