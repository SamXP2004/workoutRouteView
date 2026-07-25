import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command, mode }) => ({
  plugins: [react()],
  // Development serves local route data. A normal production build excludes
  // public/ so private coordinates cannot be published by accident.
  publicDir: command === 'serve' || mode === 'private' ? 'public' : false,
}))
