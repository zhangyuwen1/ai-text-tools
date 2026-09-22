import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// 正式域名：textkitai.com（腾讯云注册，DNS 托管 Cloudflare，站点托管 Pages）
export default defineConfig({
  site: 'https://textkitai.com',
  adapter: cloudflare({ imageService: 'passthrough' }),
  output: 'static',
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
