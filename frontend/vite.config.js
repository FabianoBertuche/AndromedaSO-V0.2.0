import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(function (_a) {
    var mode = _a.mode;
    var env = loadEnv(mode, '.', '');
    var apiTarget = env.VITE_API_TARGET || 'http://localhost:4000';
    return {
        plugins: [react()],
        server: {
            host: 'localhost',
            port: 5173,
            proxy: {
                '/api': {
                    target: apiTarget,
                    changeOrigin: true
                },
                '/status': {
                    target: apiTarget,
                    changeOrigin: true
                },
                '/agents': {
                    target: apiTarget,
                    changeOrigin: true
                },
                '/dashboard': {
                    target: apiTarget,
                    changeOrigin: true
                },
                '/tasks': {
                    target: apiTarget,
                    changeOrigin: true
                },
                '/eval': {
                    target: apiTarget,
                    changeOrigin: true
                },
                '/orchestrator': {
                    target: apiTarget,
                    changeOrigin: true
                }
            }
        }
    };
});
