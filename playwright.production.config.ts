import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/production',
  outputDir: 'artifacts/production-results',
  fullyParallel: true,
  workers: 2,
  retries: process.env.CI ? 1 : 0,
  forbidOnly: !!process.env.CI,
  reporter: [['list'], ['html', { outputFolder: 'artifacts/production-report', open: 'never' }]],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://127.0.0.1:5198',
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'reduce',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'node scripts/serve-production-test.mjs',
    url: 'http://127.0.0.1:5198',
    reuseExistingServer: false,
    timeout: 120000,
  },
});
