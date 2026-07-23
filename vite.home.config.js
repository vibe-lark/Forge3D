import { defineConfig } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  build: {
    outDir: path.join(root, 'dist-home'),
    emptyOutDir: true,
    rollupOptions: {
      input: path.join(root, 'home.html'),
    },
  },
});
