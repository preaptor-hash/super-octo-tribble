import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true
      },
      manifest: {
        name: 'Vyess HRMS Field App',
        short_name: 'Vyess HRMS',
        description: 'Offline-first field worker recruitment app',
        theme_color: '#4f46e5',
        icons: [
          {
            src: 'https://cdn-icons-png.flaticon.com/512/1077/1077114.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'https://cdn-icons-png.flaticon.com/512/1077/1077114.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react')) {
              return 'vendor-react'
            }
            if (id.includes('supabase')) {
              return 'vendor-supabase'
            }
            if (id.includes('lucide') || id.includes('recharts') || id.includes('leaflet')) {
              return 'vendor-ui'
            }
            return 'vendor'
          }
        }
      }
    }
  },
  server: {
    port: 5173,
    strictPort: false,
  }
})
