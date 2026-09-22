import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';

// 静态优先 + 按需服务端路由（API 端点与 /r/[id] 声明 prerender = false）。
// imageService passthrough：workers 环境无 sharp，本站也不用 Astro 资产图片。
export default defineConfig({
  adapter: cloudflare({ imageService: 'passthrough' }),
  output: 'static',
  vite: {
    plugins: [tailwindcss()],
  },
});
