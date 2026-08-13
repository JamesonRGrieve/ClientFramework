// SPDX-License-Identifier: AGPL-3.0-or-later
import { defineConfig, devices } from '@playwright/test';

const SERVER_PORT = 1996;
const CLIENT_PORT = 1109;
const API_URL = `http://localhost:${SERVER_PORT}`;
const APP_URL = `http://localhost:${CLIENT_PORT}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: 1,
  reporter: 'html',
  timeout: 30_000,

  use: {
    baseURL: APP_URL,
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: [
    {
      command: `cd ${process.env['ZEPHYREX_SERVER_DIR'] ?? '../server-framework'} && .venv/bin/python -m zephyrex run`,
      url: `${API_URL}/health`,
      timeout: 60_000,
      reuseExistingServer: !process.env['CI'],
      env: {
        DATABASE_TYPE: 'sqlite',
        DATABASE_NAME: 'e2e_test',
        DATABASE_PATH: '/tmp',
        JWT_SECRET: 'e2e-test-jwt-secret-32-bytes-long-ok',
        JWT_AUDIENCE: 'e2e-test',
        JWT_ISSUER: 'e2e-test',
        SEED_DATA: 'true',
        ALLOWED_DOMAINS: '*',
        APP_EXTENSIONS: 'metadata,auth_lockout,auth_recovery_questions,auth_invitations,auth_session,acl_rbac',
      },
    },
    {
      command: 'pnpm dev',
      url: APP_URL,
      timeout: 60_000,
      reuseExistingServer: !process.env['CI'],
      env: {
        NEXT_PUBLIC_API_URI: API_URL,
        API_URI: API_URL,
        NEXT_PUBLIC_APP_URI: APP_URL,
        APP_URI: APP_URL,
        NEXT_PUBLIC_AUTH_URI: `${APP_URL}/user`,
        AUTH_URI: `${APP_URL}/user`,
        SERVERSIDE_API_URI: API_URL,
        PRIVATE_ROUTES: '/settings,/team,/provider',
      },
    },
  ],
});
