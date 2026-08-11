// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexConfig } from '@/lib/zephyrex';

const config: ZephyrexConfig = {
  server: {
    baseUrl: process.env.NEXT_PUBLIC_API_URI ?? 'http://localhost:1996',
  },
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME ?? 'Zephyrex',
    description: process.env.NEXT_PUBLIC_APP_DESCRIPTION ?? 'Zephyrex Framework Server',
    defaultTheme: (process.env.NEXT_PUBLIC_THEME_DEFAULT_MODE as 'dark' | 'light') ?? 'dark',
  },
  auth: {
    privateRoutes: (process.env.PRIVATE_ROUTES ?? '/settings,/team,/provider').split(','),
  },
};

export default config;
