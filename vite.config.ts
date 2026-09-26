import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname || process.cwd(), '.'),
      },
    },
    server: {
      // Set DISABLE_HMR=true in a sandboxed IDE preview. File watching is off
      // there to stop the preview flickering on every edit, at the cost of no
      // hot reload. Leave it unset for normal local development.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      // The screens are loaded on demand, so the entry chunk is the shell and
      // the domain layer. Anything over this is worth a look rather than a
      // shrug.
      chunkSizeWarningLimit: 400,
    },
  };
});
