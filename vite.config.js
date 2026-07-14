import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path' // 1. path 모듈 import
// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      // 2. '@' 기호를 프로젝트 루트의 'src' 디렉토리로 매핑
      '@': path.resolve(__dirname, './src')
    }
  }
})
