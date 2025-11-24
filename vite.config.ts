import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import fs from 'fs';

// Custom plugin to copy static files to dist since we don't have a public folder
const copyStaticFiles = () => ({
  name: 'copy-static-files',
  closeBundle: () => {
    const filesToCopy = [
      'manifest.json',
      'icon-192.png',
      'icon-512.png',
      'service-worker.js' // Copy SW directly instead of bundling
    ];

    filesToCopy.forEach(file => {
      const src = resolve(file);
      const dest = resolve('dist', file);
      // Ensure dist exists
      if (!fs.existsSync(resolve('dist'))) {
        fs.mkdirSync(resolve('dist'));
      }
      
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        console.log(`Copied ${file} to dist`);
      } else {
        console.warn(`Warning: ${file} not found in root directory`);
      }
    });
  }
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), copyStaticFiles()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      'process.env': {} 
    },
    build: {
      outDir: 'dist',
      rollupOptions: {
        input: {
          main: resolve('index.html'),
        },
        // We removed service-worker from rollup inputs because we are copying it manually
        // to avoid hashing its filename (e.g. service-worker-123.js) which breaks registration
      },
    },
  };
});