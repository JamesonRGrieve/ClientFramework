// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexConfig } from '@/lib/zephyrex';

const config: ZephyrexConfig = {
  server: {
    // Same origin: next.config.js proxies /v1 and /graphql to API_URI.
    baseUrl: '',
    upstreamUrl: process.env.API_URI ?? 'http://localhost:1996',
  },
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME ?? 'Zephyrex',
    description: process.env['NEXT_PUBLIC_APP_DESCRIPTION'] ?? 'Zephyrex Framework Server',
    defaultTheme: (process.env['NEXT_PUBLIC_THEME_DEFAULT_MODE'] as 'dark' | 'light') ?? 'dark',
  },
  auth: {
    privateRoutes: (process.env['PRIVATE_ROUTES'] ?? '/team,/provider').split(','),
    landingOnly: process.env['LANDING_ONLY'] === 'true',
  },
};

export default config;
