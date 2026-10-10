import { defineConfig } from 'vite';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
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
      resolveId(id) {
        if (id === 'virtual:state-details') return '\0virtual:state-details';
        if (id === 'virtual:city-details') return '\0virtual:city-details';
      },
      async load(id) {
        if (id === '\0virtual:city-details') {
          const path = new URL('./content/city-guides.json', import.meta.url);
          this.addWatchFile(fileURLToPath(path));
          const content = JSON.parse(await readFile(path, 'utf8'));
          return `export default {${content.guides.map((g: { placeId: string }) => `"${g.placeId}":()=>import("/content/city-guides.json?city=${g.placeId}")`).join(',')}}`;
        }
        if (id !== '\0virtual:state-details') return;
        const path = new URL('./content/states.json', import.meta.url);
        this.addWatchFile(fileURLToPath(path));
        const catalog = JSON.parse(await readFile(path, 'utf8')) as Catalog;
        return `export default {${catalog.states
          .map(
            (state) => `"${state.code}":()=>import("/content/states.json?details=${state.code}")`,
          )
          .join(',')}}`;
      },
      transform(source, id) {
        if (/\/content\/city-guides\.json\?(copy|city=[A-Z]{2}-0)$/.test(id)) {
          const content = JSON.parse(source);
          return JSON.stringify(
            id.endsWith('?copy')
              ? { copy: content.copy }
              : content.guides.find(
                  (g: { placeId: string }) => g.placeId === id.split('?city=')[1],
                ),
          );
        }
        if (!/\/content\/states\.json\?(overview|photos|details=[A-Z]{2})$/.test(id)) return;
        const catalog = JSON.parse(source) as Catalog;
        if (id.includes('?details=')) {
          const state = catalog.states.find((s) => s.code === id.split('?details=')[1]);
          if (!state) throw Error(`Unknown state details: ${id}`);
          return JSON.stringify({ photos: state.photos, destinations: state.destinations });
        }
        // Keep one editorial source; practical details and photo credits load with guides.
        const practicalFields = new Set([
          'summarySources',
          'summaryLicense',
          'access',
          'stay',
          'officialUrl',
          'bookingUrl',
          'reviewedAt',
          'reviewAfter',
          'translationsReviewed',
        ]);
        return JSON.stringify(
          id.endsWith('?photos')
            ? Object.fromEntries(
                catalog.states.flatMap((state) => state.photos.map((p) => [p.src, p])),
              )
            : {
                ...catalog,
                states: catalog.states.map((state) => ({
                  ...state,
                  destinations: state.destinations.map((profile) =>
                    Object.fromEntries(
                      Object.entries(profile).filter(([key]) => !practicalFields.has(key)),
                    ),
                  ),
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
    manifest: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (/\/content\/city-guides\.json\?city=[A-Z]{2}-0$/.test(id))
            return 'city-details-' + id.split('?city=')[1];
          if (id.endsWith('/content/states.json?overview')) return 'state-guides';
          if (id.endsWith('/content/states.json?photos')) return 'photo-details';
          if (/\/content\/states\.json\?details=[A-Z]{2}$/.test(id))
            return 'state-details-' + id.split('?details=')[1];
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
