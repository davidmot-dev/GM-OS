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
  /**
   * **Le build de profilage — hors chemin par défaut.**
   *
   * `GMOS_PROFILAGE=1 npm run build` remplace `react-dom/client` par la
   * variante **profiling** de React. Elle seule renseigne `actualDuration` sur
   * chaque fibre, c'est-à-dire le temps réellement passé à rendre **ce**
   * composant — la seule manière de dire *qui* coûte, et pas seulement
   * *combien*.
   *
   * ⚠️ **Sans la variable, rien ne change.** Le build de production reste celui
   * d'avant, à l'octet près : *rendre mesurable ne doit jamais vouloir dire
   * rendre plus lent.* La variante profiling coûte ~10 % de temps de rendu et
   * n'a rien à faire dans ce que le meneur lance le samedi soir.
   *
   * Employé par `e2e/profilageDesRendus.spec.ts`.
   */
  resolve: process.env.GMOS_PROFILAGE
    ? { alias: { 'react-dom/client': 'react-dom/profiling' } }
    : {},
  /* Un profilage qui rend `nK` et `VJ` ne désigne personne : on garde les noms
     de fonctions, et seulement dans ce build-là. */
  esbuild: process.env.GMOS_PROFILAGE ? { keepNames: true } : undefined,
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
    projects: [
      {
        // Renderer : jsdom + plugins Vite du projet (react, electron-renderer, PWA).
        extends: true,
        test: {
          name: 'renderer',
          globals: true,
          environment: 'jsdom',
          setupFiles: ['./src/test/setup.ts'],
          include: ['src/**/*.{test,spec}.{ts,tsx}'],
        },
      },
      {
        // Process principal : environnement node pur, sans vite-plugin-electron-renderer
        // (ses shims de modules natifs cassent en ESM hors Electron).
        test: {
          name: 'electron',
          globals: true,
          environment: 'node',
          include: ['electron/**/*.{test,spec}.ts'],
        },
      },
    ],
  },
})
