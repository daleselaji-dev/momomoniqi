import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  /* 相对路径产物：浏览器 CDN / Electron 自定义协议（app://）都能直接加载 */
  base: './',
})
