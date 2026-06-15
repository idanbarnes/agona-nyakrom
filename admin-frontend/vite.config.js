import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, new URL('.', import.meta.url).pathname, '')

  return {
    base: env.VITE_APP_BASE_PATH || '/',
    plugins: [react()],
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        '/api': 'http://localhost:5000',
        '/uploads': 'http://localhost:5000',
      },
    },
  }
})
