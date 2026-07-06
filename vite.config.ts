import { defineConfig } from 'vite';

export default defineConfig({
  // Served from https://vensas.github.io/pdf-splitter/
  base: '/pdf-splitter/',
  build: {
    target: 'es2022',
  },
});
