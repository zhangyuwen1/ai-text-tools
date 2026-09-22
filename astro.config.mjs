import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// 第 1 周：纯静态输出（全部工具浏览器端运行）。
// 第 2 周接入检测 API 时添加 @astrojs/cloudflare adapter 与 wrangler.toml。
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },
});
