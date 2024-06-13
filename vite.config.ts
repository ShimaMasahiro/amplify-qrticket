import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  // cloud9が許可するポート番号
  server: {
    port: 8080,
  },
  plugins: [react()],
})
