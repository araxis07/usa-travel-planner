import { defineConfig } from 'vite';
import { studioPlugin } from './studio/server';
import type { Catalog } from './lib/content';
export default defineConfig(({ mode }) => ({
  cacheDir: mode === 'studio' ? 'node_modules/.vite-studio' : 'node_modules/.vite',
  optimizeDeps: {
    entries: ['index.html'],
    include: ['react', 'react-dom/client', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
  },
  plugins: [
    {
      name: 'catalog-views',
      enforce: 'pre',
      transform(source, id) {
        if (!/\/content\/states\.json\?(overview|photos)$/.test(id)) return;
        const catalog = JSON.parse(source) as Catalog;
        // Keep one editorial source; gallery metadata loads with guides and galleries.
        return JSON.stringify(
          id.endsWith('?photos')
            ? Object.fromEntries(
                catalog.states.flatMap((state) => state.photos.map((p) => [p.src, p])),
              )
            : {
                ...catalog,
                states: catalog.states.map((state) => ({
                  ...state,
                  photos: state.photos.map(({ src, placeIndex, width, height }) => ({
                    src,
                    placeIndex,
                    width,
                    height,
                  })),
                })),
              },
        );
      },
    },
    ...(mode === 'studio' ? [studioPlugin(process.env.STUDIO_CONTENT_ROOT || process.cwd())] : []),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.endsWith('/content/states.json?overview')) return 'state-guides';
          if (id.endsWith('/content/states.json?photos')) return 'photo-details';
          if (id.endsWith('/content/translations.json')) return 'translations';
          if (id.endsWith('/data/map-paths.json')) return 'atlas-geometry';
        },
      },
    },
  },
  server: {
    host: '127.0.0.1',
    watch: { ignored: ['**/artifacts/**', '**/test-results/**', '**/playwright-report/**'] },
    port: mode === 'studio' ? 5174 : 5173,
    strictPort: mode === 'studio',
  },
  preview: { host: '127.0.0.1' },
}));
