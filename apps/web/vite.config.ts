import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // 1. Minify code aggressively to reduce file size
    minify: 'esbuild',
    
    // 2. Optimization settings
    chunkSizeWarningLimit: 1000, // Increase warning limit to 1000kb
    
    rollupOptions: {
      output: {
        // 3. Manual Chunking: Separate heavy libraries from your code
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Group React core libraries
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'react-vendor';
            }
            // Group UI libraries (Framer Motion is heavy, Lucide is light but good to separate)
            if (id.includes('framer-motion') || id.includes('lucide-react') || id.includes('@heroicons')) {
              return 'ui-vendor';
            }
            // Group heavy utilities
            if (id.includes('moment') || id.includes('date-fns')) {
              return 'utils-vendor';
            }
            // Everything else
            return 'vendor'; 
          }
        },
      },
    },
  },
})