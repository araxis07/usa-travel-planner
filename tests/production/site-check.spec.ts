import { test, expect } from '@playwright/test';
import { execFile } from 'node:child_process';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';

test('published-site check accepts static pages and rejects wrong origins, guide and asset fallbacks', async ({
  baseURL,
}) => {
  test.setTimeout(60000);
  let failure: 'canonical' | 'guide' | 'asset' | null = null;
  // Replay the real production build with the local host as its public origin.
  const server = createServer(async (req, res) => {
    try {
      const response = await fetch(baseURL + req.url!, { signal: AbortSignal.timeout(15000) });
      let body = await response.text();
      let type = response.headers.get('content-type') || '';
      if (failure !== 'canonical')
        body = body.split('https://roam.example').join(`http://${req.headers.host}`);
      if (failure === 'guide' && req.url === '/en/states/california/') {
        body =
          '<!doctype html><html lang="en"><body><main><h1>Roam America</h1></main></body></html>';
        type = 'text/html';
      }
      if (failure === 'asset' && /^\/assets\/.*\.js$/.test(req.url!)) {
        body = '<!doctype html><html><body>Host fallback</body></html>';
        type = 'text/html';
      }
      res.writeHead(response.status, { 'Content-Type': type }).end(body);
    } catch {
      res.writeHead(500).end('Fixture response failed');
    }
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  try {
    for (const mode of [null, 'canonical', 'guide', 'asset'] as const) {
      failure = mode;
      const result = await new Promise<{ code: string | number; output: string }>((resolve) =>
        execFile(
          process.execPath,
          ['scripts/check-site.mjs', origin],
          { timeout: 30000 },
          (error, stdout, stderr) => resolve({ code: error?.code ?? 0, output: stdout + stderr }),
        ),
      );
      if (mode === null) {
        expect(result.code, result.output).toBe(0);
        expect(result.output).toContain('Passed: 15 static pages in five languages');
      } else {
        expect(result.code, result.output).toBe(1);
        expect(result.output).toContain(
          mode === 'canonical'
            ? 'canonical origin'
            : mode === 'guide'
              ? 'heading'
              : 'asset MIME type',
        );
      }
    }
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});
