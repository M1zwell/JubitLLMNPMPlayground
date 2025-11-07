import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react', 'puppeteer', '@mendable/firecrawl-js'],
  },
  resolve: {
    alias: {
      // Mock puppeteer and firecrawl for browser
      puppeteer: false,
      '@mendable/firecrawl-js': false,
    },
  },
  server: {
    port: 8080,
    host: true,
    open: true,
    cors: true,
    proxy: {
      // Proxy API requests to Supabase in development
      '/api': {
        target: 'https://kiztaihzanqnrcrqaxsv.supabase.co/functions/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      external: ['puppeteer', '@mendable/firecrawl-js'],
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          monaco: ['@monaco-editor/react'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  preview: {
    port: 8080,
    host: true,
    open: true,
  },
});
