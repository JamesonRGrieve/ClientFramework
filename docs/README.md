# Zephyrex Client Framework

Installable Next.js framework for building apps on the Zephyrex server. Ships a complete app shell with auth, team management, provider settings, and 59 extension stubs matching server extensions 1:1.

## Quick Start (Consumer App)

```bash
mkdir my-app && cd my-app
pnpm init
pnpm add zephyrex @zephyrex/auth @zephyrex/zod2gql @jgrieve/forms next react react-dom
```

Create `src/zephyrex.config.ts`:

```typescript
import type { ZephyrexConfig } from 'zephyrex';

const config: ZephyrexConfig = {
  server: { baseUrl: 'http://localhost:1996' },
  app: { name: 'My App' },
};

export default config;
```

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

Create `src/middleware.ts`:

```typescript
import { createMiddleware } from 'zephyrex';
export default createMiddleware();
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

```
NEXT_PUBLIC_API_URI=http://localhost:1996
NEXT_PUBLIC_APP_URI=http://localhost:1109
NEXT_PUBLIC_AUTH_URI=http://localhost:1109/user
PRIVATE_ROUTES=/settings,/team,/provider
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
