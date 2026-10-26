import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
    dedupe: ['react', 'react-dom', 'react/jsx-runtime'],
  },
  esbuild: {
    jsx: 'automatic',
  },
  server: {
    watch: {
      ignored: ['**/tmp/chrome-*/**', '**/tmp/edge-*/**'],
    },
  },
  build: {
    target: 'es2022',
  },
});
