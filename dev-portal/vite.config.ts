import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      '@omi/surfaces': fileURLToPath(new URL('../packages/omi-surfaces/src/index.ts', import.meta.url))
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    },
    fs: {
      allow: [fileURLToPath(new URL('..', import.meta.url))]
    }
  },
  preview: { port: 4173 }
});
