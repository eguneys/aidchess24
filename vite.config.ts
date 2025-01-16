import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'

export default defineConfig({
  base: './',
  plugins: [solid()],
  build: {
	  target: 'esnext'
  },
  worker: {
    format: 'es'
  },
  server: {
    headers: {
      "Cross-Origin-Embedder-Policy": "require-corp",
      "Cross-Origin-Opener-Policy": "same-origin",
    },
  },
  optimizeDeps: { exclude: ['lila-stockfish-web'] },
})
