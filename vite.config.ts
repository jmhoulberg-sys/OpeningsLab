import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Use './' so all asset paths are relative — works on GitHub Pages
// (both user pages at root and project pages at /repo-name/).
export default defineConfig({
  plugins: [react()],
  base: './',
})
