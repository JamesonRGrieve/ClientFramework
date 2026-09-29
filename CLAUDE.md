# Claude Code Instructions — zephyrex (client)

Installable Next.js framework package (`npm install zephyrex`). Downstream projects consume it as a dependency and define their own extensions — they do not fork or merge from this repo.

## Stack Standards

Read **before your first edit** in this repo:

- `/home/jameson/Source/ai-prompts/typescript.md` — TypeScript, casting, ratchets, Biome, ESLint, tsconfig, test structure, pre-commit
- `/home/jameson/Source/ai-prompts/react-next.md` — React/Next.js component layering, hooks, a11y, security, state/data-fetching, CSS/theme

---

## Architecture

```
src/lib/zephyrex/           Core package exports (ZephyrexApp, hooks, types, extensions)
src/components/ui/          shadcn/ui primitives (35 components)
src/components/appwrapper/  Shell components (sidebar, header, footer, nav) — absorbed submodule
src/app/                    Template app (reference consumer)
e2e/                        Playwright integration tests (client↔server)
```

### Package Exports

```typescript
// App shell
import { ZephyrexApp, ZephyrexRouter, createMiddleware } from 'zephyrex';

// Data hooks
import { useClient, useUser, useRole, useTeams, useProviders, useNotifications } from 'zephyrex';

// Feature hooks
import { useSearch, useFileUpload, useSubscription, useOnline } from 'zephyrex';

// Components
import { RequireRole, ErrorBoundary, NotificationBell, SearchInput, RootProviderStatus } from 'zephyrex';

// Page injection
import { PageWithSlots, usePageSlots } from 'zephyrex';

// Extensions (one per server-bundled extension, 1:1)
import { allExtensions } from 'zephyrex/extensions';
import { authMfaExtension } from 'zephyrex/extensions/auth_mfa';
```

### Consumer Pattern

A consumer app is ~6 files:

- `zephyrex.config.ts` — `ZephyrexConfig` with server URL, app name, extensions, pages, nav
- `layout.tsx` — wraps children with `<ZephyrexApp config={config}>`
- `middleware.ts` — `export default createMiddleware()`
- `[...slug]/page.tsx` — `<ZephyrexRouter>` for extension routes
- `extensions/*.tsx` — custom `ZephyrexClientExtension` definitions

### Extension System

34 client extensions match 1:1 with the extensions bundled with the server (pinned by `extensions/index.test.ts`). Identity-provider extensions live in zephyrex-auth and campaign extensions in zephyrex-rpg, each with its client counterpart. Each extension can provide:

- `pages` — routes to register
- `navItems` — sidebar entries
- `settingsPanel` — settings UI component
- `middleware` — middleware hooks
- `providers` — React context providers
- `pageSlots` — inject before/after/replace/sidebar content into built-in pages

### Page Injection

The built-in `team`, `settings` and `provider` pages render through `PageWithSlots`; `before`/`after` slots surround the page, `sidebar` slots follow its context sidebar, and a `replace` slot stands in for it. Extension `navItems` join the sidebar menu and extension `middleware` runs after the built-in auth hooks:

```typescript
const myExtension: ZephyrexClientExtension = {
  pageSlots: {
    team: [{ position: 'after', component: TeamAnalytics }],
    settings: [{ position: 'sidebar', component: QuickStats }],
  },
};
```

---

## Sibling Packages

| Package | npm name          | Source                |
| ------- | ----------------- | --------------------- |
| Auth    | `@zephyrex/auth`  | `../auth`             |
| Forms   | `@jgrieve/forms`  | `../dynamic-form`     |
| Zod→GQL | `zod2gql`         | `../zod2gql`          |
| Server  | `zephyrex` (PyPI) | `../server-framework` |

The packages are ordinary dependencies consumed from their compiled `dist/`. Until they are published, `pnpm-workspace.yaml` overrides them to the sibling checkouts as injected `file:` copies (peers such as react and zod resolve from this package, so there is one of each); pnpm treats an injected sibling as unchanged until its resolution changes, so after rebuilding one run `pnpm update @zephyrex/auth @jgrieve/forms zod2gql` and restore the registry ranges it rewrites to `file:` in `package.json`. Tailwind scans their `dist/` through `@source` in `globals.css`.

---

## Commands

```bash
pnpm install              # Install dependencies
pnpm dev                  # Dev server on port 1109
pnpm build                # Production build (Next 16 Turbopack)
pnpm test                 # Vitest unit tests
pnpm test:e2e             # Playwright integration tests (spawns server + client)
pnpm storybook            # Storybook on port 3001
pnpm check                # All ratchets
```

---

## PWA

Uses `@serwist/next` (replaces dead `next-pwa`). Service worker at `src/app/sw.ts`, manifest at `src/app/manifest.ts`. Disabled in development, active in production builds.

---

## License

AGPL-3.0-or-later. SPDX header on every source file.
