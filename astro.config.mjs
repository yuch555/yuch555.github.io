import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// 公開URLが決まったら SITE_URL を指定してビルドする(canonical と og:url に使う)
export default defineConfig({
  site: process.env.SITE_URL || undefined,
  output: 'static',
  trailingSlash: 'ignore',
  vite: {
    plugins: [tailwindcss()],
  },
});
