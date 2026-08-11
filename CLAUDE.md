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
src/components/auth/        → symlink to ../auth repo (@zephyrex/auth)
src/components/dynamic-form/ → symlink to ../dynamic-form repo (@jgrieve/forms)
src/lib/zod2gql/            → symlink to ../zod2gql repo (@zephyrex/zod2gql)
src/app/                    Template app (reference consumer)
e2e/                        Playwright integration tests (client↔server)
```

### Package Exports

```typescript
import { ZephyrexApp, ZephyrexRouter, createMiddleware } from 'zephyrex';
import { useClient, useUser, useRole, useTeams } from 'zephyrex';
import { PageWithSlots, usePageSlots } from 'zephyrex';
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

59 client extensions match 1:1 with server extensions. Each extension can provide:
- `pages` — routes to register
- `navItems` — sidebar entries
- `settingsPanel` — settings UI component
- `middleware` — middleware hooks
- `providers` — React context providers
- `pageSlots` — inject before/after/replace/sidebar content into built-in pages

### Page Injection

Every built-in page supports slot injection via `PageWithSlots`:

```typescript
const myExtension: ZephyrexClientExtension = {
  pageSlots: {
    'team': [{ position: 'after', component: TeamAnalytics }],
    'settings': [{ position: 'sidebar', component: QuickStats }],
  },
};
```

---

## Sibling Packages

| Package | npm name | Source |
|---------|----------|-------|
| Auth | `@zephyrex/auth` | `../auth` (symlinked to `src/components/auth/`) |
| Forms | `@jgrieve/forms` | `../dynamic-form` (symlinked to `src/components/dynamic-form/`) |
| Zod→GQL | `@zephyrex/zod2gql` | `../zod2gql` (symlinked to `src/lib/zod2gql/`) |
| Server | `zephyrex` (PyPI) | `../server-framework` |

Path aliases in `tsconfig.json` map `@zephyrex/auth/*`, `@jgrieve/forms/*`, `@zephyrex/zod2gql`, and `@jgrieve/appwrapper/*` to their source directories.

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
