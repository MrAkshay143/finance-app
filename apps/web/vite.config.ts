import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

function pwaVersionInjector() {
  return {
    name: 'pwa-version-injector',
    closeBundle() {
      const swDistPath = path.resolve(__dirname, 'dist/sw.js');
      if (fs.existsSync(swDistPath)) {
        let content = fs.readFileSync(swDistPath, 'utf-8');
        const newVersion = `finance-pwa-v-${Date.now().toString(36)}`;
        content = content.replace(/const CACHE_NAME = '[^']+';/, `const CACHE_NAME = '${newVersion}';`);
        fs.writeFileSync(swDistPath, content, 'utf-8');
        console.log(`[PWA] Injected dynamic cache version: ${newVersion}`);
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), pwaVersionInjector()],
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:4000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: process.env.VITE_API_URL || 'http://localhost:4000',
        ws: true,
      },
    },
  },
});
