import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setupTests.ts'],
    globals: false,
    css: true,
  },
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify('http://localhost:8080'),
  },
})
