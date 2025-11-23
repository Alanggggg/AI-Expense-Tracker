import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

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
    },
    // Explicitly include the service worker and manifest in the build
    publicDir: false, // We will manually handle assets since we have a flat structure
  };
});