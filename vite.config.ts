import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte()],
  base: './', // For GitHub Pages compatibility
  build: {
    target: 'es2020',
    outDir: 'dist',
    sourcemap: true,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'svelte': ['svelte']
        }
      }
    }
  },
  server: {
    port: 5173,
    strictPort: false,
    open: false
  },
  preview: {
    port: 4173,
    strictPort: false
  }
});
