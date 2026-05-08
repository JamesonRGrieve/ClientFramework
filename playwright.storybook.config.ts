import { defineConfig, devices } from '@playwright/test';

const STORYBOOK_PORT = 3001;

export default defineConfig({
  testDir: './tests/storybook',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://127.0.0.1:${STORYBOOK_PORT}`,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: `pnpm dlx http-server storybook-static -p ${STORYBOOK_PORT} -s`,
    url: `http://127.0.0.1:${STORYBOOK_PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
