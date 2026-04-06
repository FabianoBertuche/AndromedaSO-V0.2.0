import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_API_BASE_URL || 'http://127.0.0.1:5000'
  const apiAuthHeader = `Bearer ${env.VITE_API_AUTH_TOKEN || 'andromeda_dev_web_token'}`

  return {
    plugins: [react()],
    server: {
      host: '127.0.0.1',
      port: 5173,
      strictPort: true,
      proxy: {
        '/gateway': {
          target: apiTarget,
          changeOrigin: true,
          headers: { Authorization: apiAuthHeader },
          rewrite: (p) => p.replace(/^\/gateway/, '/v1/gateway'),
        },
        '/sandbox': {
          target: apiTarget,
          changeOrigin: true,
          headers: { Authorization: apiAuthHeader },
          rewrite: (p) => p.replace(/^\/sandbox/, '/v1/sandbox'),
        },
        '/memory': {
          target: apiTarget,
          changeOrigin: true,
          headers: { Authorization: apiAuthHeader },
          rewrite: (p) => p.replace(/^\/memory/, '/v1/memory'),
        },
        '/model-center': {
          target: apiTarget,
          changeOrigin: true,
          headers: { Authorization: apiAuthHeader },
          rewrite: (p) => p.replace(/^\/model-center/, '/v1/model-center'),
        },
        '/agents': {
          target: apiTarget,
          changeOrigin: true,
          headers: { Authorization: apiAuthHeader },
          rewrite: (p) => p.replace(/^\/agents/, '/v1/agents'),
        },
        '/api/knowledge': {
          target: apiTarget,
          changeOrigin: true,
          headers: { Authorization: apiAuthHeader },
          rewrite: (p) => p.replace(/^\/api\/knowledge/, '/v1/knowledge'),
        }
      }
    }
  }
})

