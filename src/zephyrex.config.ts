// SPDX-License-Identifier: AGPL-3.0-or-later
import { BookOpen, HelpCircle, Rocket, Server, Users, VenetianMask } from 'lucide-react';
import type { ZephyrexConfig } from '@/lib/zephyrex';

const config: ZephyrexConfig = {
  server: {
    // Same origin: next.config.js proxies /v1 and /graphql to API_URI.
    baseUrl: '',
    // An empty API_URI in .env means "use the default".
    upstreamUrl:
      process.env.API_URI !== undefined && process.env.API_URI !== '' ? process.env.API_URI : 'http://localhost:1996',
  },
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME ?? 'Zephyrex',
    description: process.env.NEXT_PUBLIC_APP_DESCRIPTION ?? 'Zephyrex Framework Server',
    defaultTheme: process.env.NEXT_PUBLIC_THEME_DEFAULT_MODE === 'light' ? 'light' : 'dark',
  },
  auth: {
    privateRoutes: (process.env.PRIVATE_ROUTES ?? '/team,/provider').split(','),
    landingOnly: process.env.LANDING_ONLY === 'true',
  },
  // The pages this template mounts under src/app; an app lists its own.
  navItems: [
    { title: 'Providers', url: '/provider', icon: Server },
    { title: 'Team', url: '/team', icon: Users },
    {
      title: 'Documentation',
      url: '/docs/getting-started',
      icon: BookOpen,
      children: [
        { title: 'Getting Started', url: '/docs/getting-started', icon: Rocket },
        { title: 'API Reference', url: '/docs/api-reference', icon: BookOpen },
        { title: 'Support', url: '/docs/support', icon: HelpCircle },
        { title: 'Privacy Policy', url: '/docs/privacy', icon: VenetianMask },
      ],
    },
  ],
};

export default config;
