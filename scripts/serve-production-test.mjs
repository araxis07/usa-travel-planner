import { build, preview } from 'vite';
import { execFileSync } from 'node:child_process';
const outDir = 'artifacts/production';
execFileSync(process.execPath, ['scripts/prepare-images.mjs'], { stdio: 'inherit' });
await build({
  build: { outDir, emptyOutDir: true },
  define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify('https://roam-test.supabase.co'),
    'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify('sb_publishable_browser_test'),
  },
});
execFileSync(process.execPath, ['scripts/build-pages.mjs', outDir], {
  stdio: 'inherit',
  env: { ...process.env, SITE_URL: 'https://roam.example' },
});
const server = await preview({
  build: { outDir },
  preview: { host: '127.0.0.1', port: 5198, strictPort: true },
});
server.printUrls();
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () => server.httpServer.close(() => process.exit()));
