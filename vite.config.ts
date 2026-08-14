import {defineConfig} from 'vitest/config';

export default defineConfig({
  server: {
    port: 8080
  },
  preview: {
    port: 8080
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  test: {
    environment: 'node'
  }
});
