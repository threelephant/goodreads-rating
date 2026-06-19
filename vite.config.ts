import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Relative base so the app works under the GitHub Pages sub-path
  // (https://<user>.github.io/<repo>/) without hardcoding the repo name.
  base: './',
})
