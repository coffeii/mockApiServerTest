import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/admin': {
        target: 'https://mockapiservertest-production.up.railway.app',
        changeOrigin: false,   // 원래 Host/Origin 헤더를 유지
        secure: false,
        // 추가로 아래 콜백을 걸면 명시적으로 origin 헤더를 세팅할 수도 있습니다.
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            proxyReq.setHeader('origin', 'http://localhost:5173')
          })
        }
      }
    }
  }
})
