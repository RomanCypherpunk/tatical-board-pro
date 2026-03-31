import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  publicDir: 'assets',
  css: {
    postcss: './config/postcss.config.js',
  },
  server: {
    port: 5173,
    open: true,
  },
});
