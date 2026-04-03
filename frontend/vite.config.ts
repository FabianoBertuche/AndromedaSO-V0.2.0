import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: 'localhost',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true
      },
      '/status': {
        target: 'http://localhost:4000',
        changeOrigin: true
      },
      '/agents': {
        target: 'http://localhost:4000',
        changeOrigin: true
      },
      '/dashboard': {
        target: 'http://localhost:4000',
        changeOrigin: true
      },
      '/tasks': {
        target: 'http://localhost:4000',
        changeOrigin: true
      },
      '/eval': {
        target: 'http://localhost:4000',
        changeOrigin: true
      },
      '/orchestrator': {
        target: 'http://localhost:4000',
        changeOrigin: true
      }
    }
  }
});
