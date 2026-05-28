import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
