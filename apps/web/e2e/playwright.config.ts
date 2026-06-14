import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;
const port = process.env.E2E_PORT || '3002';
const baseURL = `http://localhost:${port}`;

// The web server must always be started (or reused) so that every page.goto()
// resolves. Locally we run `next dev` (no build step needed); in CI we run the
// production server against the prebuilt `.next` artifact.
const webServer = {
  command: isCI ? `npx next start -p ${port}` : `npx next dev -p ${port}`,
  url: baseURL,
  // Reuse an already-running server locally; always start fresh in CI.
  reuseExistingServer: !isCI,
  timeout: 120000,
  stdout: 'pipe',
  env: { PORT: port },
  cwd: process.cwd(),
};

export default defineConfig({
  testDir: '.',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: 2,
  workers: isCI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    ...(isCI ? [] : [
      {
        name: 'firefox',
        use: { ...devices['Desktop Firefox'] },
      },
      {
        name: 'mobile-chrome',
        use: { ...devices['Pixel 5'] },
      },
    ]),
  ],
  webServer,
});
