import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    ...(process.env.CI ? [] : [
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
  webServer: process.env.CI ? {
    command: 'node .next/standalone/node_modules/.pnpm/next@14.2.35_@babel+core@7.29.0_@playwright+test@1.59.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/dist/server/next.js',
    url: 'http://localhost:3000',
    reuseExistingServer: false,
    timeout: 120000,
    env: {
      PORT: '3000',
    },
    cwd: process.cwd(),
  } : undefined,
});
