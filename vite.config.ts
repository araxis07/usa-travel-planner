import { defineConfig } from 'vite';
import { studioPlugin } from './studio/server';
export default defineConfig(({ mode }) => ({
  cacheDir: mode === 'studio' ? 'node_modules/.vite-studio' : 'node_modules/.vite',
  optimizeDeps: { entries: ['index.html'] },
  plugins:
    mode === 'studio' ? [studioPlugin(process.env.STUDIO_CONTENT_ROOT || process.cwd())] : [],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'state-guides': ['./content/states.json'],
          translations: ['./content/translations.json'],
          'atlas-geometry': ['./data/map-paths.json'],
        },
      },
    },
  },
  server: { host: '127.0.0.1', port: mode === 'studio' ? 5174 : 5173, strictPort: true },
  preview: { host: '127.0.0.1' },
}));
