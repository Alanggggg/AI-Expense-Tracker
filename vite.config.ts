import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    define: {
      // This ensures process.env.API_KEY works in the browser after build
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      'process.env': {} 
    },
    build: {
      outDir: 'dist',
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
          // Explicitly build the service worker so it ends up in dist/service-worker.js
          'service-worker': resolve(__dirname, 'service-worker.js'),
        },
        output: {
          entryFileNames: (assetInfo) => {
            if (assetInfo.name === 'service-worker') {
              return 'service-worker.js';
            }
            return 'assets/[name]-[hash].js';
          },
        },
      },
    },
  };
});