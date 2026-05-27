import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',   // Relative paths — makes the build work when opened directly from Finder (file://)
  build: {
    outDir: "/tmp/kernal-build74",
    emptyOutDir: true,
    // Disable Rolldown's identifier minification — it recycles short names across
    // React internals and app modules when the bundle is large, causing
    // "TypeError: x is not a function" crashes at runtime (30+ duplicate names
    // observed in Build 37/38). Keeping mangled names false eliminates all collisions.
    // File size increases ~3× but is acceptable for a single-file demo.
    minify: false,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        manualChunks: undefined,
      },
    },
  },
});
