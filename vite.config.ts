/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import { VitePWA } from 'vite-plugin-pwa'
import pkg from './package.json'

// https://vitejs.dev/config/
export default defineConfig({
  // Source unique de verite pour la version affichee : package.json.
  // Evite la derive entre les differents ecrans (Shell, splash, lobby tablette).
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
  },
  plugins: [
    react(),
    electron([
      {
        entry: 'electron/main.ts',
        vite: {
          build: {
            rollupOptions: {
              external: ['ws', 'bufferutil', 'utf-8-validate']
            }
          }
        }
      },
      {
        entry: 'electron/preload.ts',
        onstart(options) {
          options.reload()
        },
        vite: {
          build: {
            rollupOptions: {
              output: {
                entryFileNames: '[name].mjs',
              },
            },
          },
        },
      },
    ]),
    renderer(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Tablet Hub - GM-OS',
        short_name: 'Tablet Hub',
        description: 'Application compagnon pour les joueurs de GM-OS',
        theme_color: '#020617', // bg-slate-950
        background_color: '#020617',
        display: 'fullscreen',
        orientation: 'landscape',
        start_url: '/?window=tablet',
        icons: [
          {
            src: '/tablet-hub-icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/tablet-hub-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
      }
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
})
