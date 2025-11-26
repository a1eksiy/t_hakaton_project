import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/receipts': {
        target: 'http://localhost:8000', // Измените на адрес вашего бэкенд сервера
        changeOrigin: true,
        secure: false,
      },
      '/supplies': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
