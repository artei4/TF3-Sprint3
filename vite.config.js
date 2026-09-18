import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { cpSync, existsSync } from 'node:fs'

// A logo é referenciada dentro de strings do JavaScript (./assets/brand/simbolo.jpg),
// então o Vite não a enxerga sozinho. Este plugin copia a pasta para dist/ no build.
function copyBrandAssets() {
  return {
    name: 'copy-brand-assets',
    apply: 'build',
    closeBundle() {
      if (existsSync('assets/brand')) cpSync('assets/brand', 'dist/assets/brand', { recursive: true })
    },
  }
}

export default defineConfig({
  base: './',
  plugins: [tailwindcss(), copyBrandAssets()],
  server: { host: '0.0.0.0' },
})
