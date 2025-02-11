import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import copy from 'rollup-plugin-copy'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [
      react(),
      copy({
        targets: [
          {
            src: resolve('node_modules/pdfjs-dist/build/pdf.worker.min.mjs'),
            dest: resolve('dist/renderer')
          }
        ]
      })
    ]
  }
})
