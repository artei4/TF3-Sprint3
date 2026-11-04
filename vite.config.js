import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { cpSync, existsSync } from 'node:fs'

// Logo e fotos são referenciadas dentro de strings do JavaScript (./assets/brand/..., ./assets/photos/...),
// então o Vite não as enxerga sozinho. Este plugin copia as pastas para dist/ no build.
function copyBrandAssets() {
  return {
    name: 'copy-brand-assets',
    apply: 'build',
    closeBundle() {
      for (const dir of ['assets/brand', 'assets/photos']) {
        if (existsSync(dir)) cpSync(dir, 'dist/' + dir, { recursive: true })
      }
    },
  }
}

export default defineConfig({
  base: './',
  plugins: [tailwindcss(), copyBrandAssets()],
  server: { host: '0.0.0.0' },
})
