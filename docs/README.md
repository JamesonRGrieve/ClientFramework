# Zephyrex Client Framework

Installable Next.js framework for building apps on the Zephyrex server. Ships a complete app shell with auth, team management, provider settings, and one client extension for each of the 34 extensions bundled with the server.

## Quick Start (Consumer App)

```bash
mkdir my-app && cd my-app
pnpm init
pnpm add zephyrex @zephyrex/auth zod2gql @jgrieve/forms next react react-dom
```

Create `src/zephyrex.config.ts`:

```typescript
import type { ZephyrexConfig } from 'zephyrex';

const config: ZephyrexConfig = {
  // The browser calls the API on the app's own origin; the Next server proxies it to upstreamUrl.
  // `||`, not `??`: an .env that ships `API_URI=` (empty) should still fall back.
  server: { baseUrl: '', upstreamUrl: process.env.API_URI || 'http://localhost:1996' },
  app: { name: 'My App' },
  auth: {
    privateRoutes: ['/team', '/provider'],
    // Optional: sign-in providers the server's oauth_consumer offers; with no email mode it is OAuth-only.
    // authModes: { basic: false, magical: false },
    // oauthProviders: ['google'],
  },
};

export default config;
```

Sessions are the server's HttpOnly cookies (`zx_session`, plus `zx_csrf` for writes), so the API must be
same-origin. Proxy it in `next.config.js`:

```js
async rewrites() {
  return [
    { source: '/v1/:path*', destination: `${process.env.API_URI}/v1/:path*` },
    { source: '/graphql', destination: `${process.env.API_URI}/graphql` },
  ];
},
```

An app that serves the API in-process can use `baseUrl: '/api'` instead. For OAuth sign-in, allow
`<app>/user/close/<provider>` in the server's redirect allowlist.

Create `src/app/layout.tsx`:

```tsx
import { ZephyrexApp } from 'zephyrex';
import config from '@/zephyrex.config';

export default function Layout({ children }) {
  return (
    <html lang='en'>
      <body>
        <ZephyrexApp config={config}>{children}</ZephyrexApp>
      </body>
    </html>
  );
}
```

Create `src/proxy.ts` (Next 16's middleware):

```typescript
import { createMiddleware } from 'zephyrex';
import config from '@/zephyrex.config';
export default createMiddleware(config);
```

Create `src/app/[...slug]/page.tsx`:

```tsx
'use client';
import { ZephyrexRouter } from 'zephyrex';
import { use } from 'react';

export default function CatchAll({ params, searchParams }) {
  return <ZephyrexRouter params={use(params)} searchParams={use(searchParams)} />;
}
```

## Extensions

Import individual extensions or all at once:

```typescript
import { authMfaExtension, paymentExtension } from 'zephyrex/extensions';
import { allExtensions } from 'zephyrex/extensions';
```

Add to config:

```typescript
const config: ZephyrexConfig = {
  extensions: [authMfaExtension, paymentExtension, myCustomExtension],
};
```

## Custom Extensions

```typescript
import type { ZephyrexClientExtension } from 'zephyrex';

export const myExtension: ZephyrexClientExtension = {
  name: 'analytics',
  serverExtension: 'analytics',
  pages: [{ path: 'analytics', component: AnalyticsPage }],
  navItems: [{ title: 'Analytics', url: '/analytics' }],
  settingsPanel: AnalyticsSettings,
  pageSlots: {
    team: [{ position: 'after', component: TeamAnalyticsWidget }],
  },
};
```

## Hooks

```typescript
import { useUser, useRole, useTeams, useClient, useProviders } from 'zephyrex';
```

## Environment Variables

The template app reads these in `zephyrex.config.ts` and `next.config.js`; the framework itself reads none.

```
API_URI=http://localhost:1996      # where the Next server reaches the API (proxy target)
APP_URI=http://localhost:1109      # the app's public address (cookie domain, metadata)
PRIVATE_ROUTES=/team,/provider
```

Linked packages are installed as injected copies until they are published; after rebuilding one, refresh
the copy without rewriting the version specifiers:

```bash
pnpm update --no-save zephyrex @zephyrex/auth @jgrieve/forms zod2gql
```

## Development (Framework Contributors)

```bash
git clone git@github.com:JamesonRGrieve/ClientFramework.git
cd ClientFramework
pnpm install
pnpm dev          # Dev server on port 1109
pnpm test         # Vitest unit tests
pnpm test:e2e     # Playwright integration tests
pnpm storybook    # Storybook on port 3001
pnpm build        # Production build (Next 16 Turbopack)
```

## License

AGPL-3.0-or-later
