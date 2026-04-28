import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: process.env.ELECTRON === 'true' ? './' : '/MejoraRedmi14c/',
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
})
