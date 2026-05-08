# CLAUDE.md

## Design Philosophy

This repository is a template framework. Downstream projects merge from it regularly. Every design decision must minimize the need for downstream repos to modify framework-owned files or directories. **Avoid merge conflicts with downstream implementors at all costs.** Prefer configuration, extension points, and convention-based overrides so that downstream customization happens in files the framework never touches.

## Code Standards

### TypeScript

- Use TypeScript strict mode. All exports must be typed — no `any` except where third-party types are missing.
- Lint with **ESLint** (`next lint`). Format with **Prettier**.
- Follow modern TypeScript idioms: discriminated unions over type assertions, `satisfies` for safe narrowing, `readonly` where mutation isn't needed, `as const` for literal types.
- Favor object-oriented design and class-based abstractions. Use classes for stateful services, models, and anything with lifecycle. Use interfaces and generics to define contracts. Prefer composition via injected dependencies over standalone functions with implicit coupling.
- Minimize code volume. Extract shared logic into base classes, generic utilities, or hooks. Consolidate repeated patterns — two near-identical blocks should become one parameterized abstraction.
- Prefer `const` over `let`. Never use `var`.
- Use template literals over string concatenation.
- Never use `console.log` in committed code. Use `console.warn` or `console.error` for diagnostics.
- No magic numbers. Extract timeouts, poll intervals, and other numeric constants to named `const` declarations at the top of the file.
- Handle every promise. Every `async` call must be `await`ed, `.catch()`-ed, or explicitly marked `void`. Unhandled rejections silently swallow errors.
- No inline HTML event handlers. Never use `onclick`, `onload`, or similar attributes in dynamically constructed HTML. Use React event handlers or `addEventListener` instead.
- No HTML string interpolation with external data. Never pass untrusted or backend-supplied values into `dangerouslySetInnerHTML` or any DOM API that parses HTML. Build content with React components and text nodes instead.
- Clean up lifecycle resources. Capture all timer IDs from `setTimeout`/`setInterval` and clear them in cleanup functions returned from `useEffect`. Dispose subscriptions and listeners on unmount. Never leave dangling event listeners or orphaned timers.

### General

- **DRY aggressively.** Extract repeated logic into shared abstractions as soon as a pattern appears twice. Prefer a single parameterized implementation over two similar blocks. Actively look for opportunities to reduce total lines of code through consolidation.
- **No dead code.** Remove commented-out imports, unused variables, and stale comments. Don't leave `// TODO` markers without a linked issue.
- **Naming:** Names should describe *what* something is or does, not *how*. Prefer `terrainTileCache` over `tc` or `cache1`.
- **No secrets in code.** API keys and credentials must come from environment variables — never hardcoded.
- **Commits:** Write concise commit messages focused on *why*, not *what*. One logical change per commit.
- **Don't suppress linter warnings** (`// eslint-disable`) without first trying to fix the root cause. Suppression is a last resort, not a shortcut.

## Submodules

This project uses two git submodules. The other previously-split modules — `appwrapper`, `dynamic-form`, `next-log` — were inlined because they were heavily coupled to framework internals and never published as standalone packages; the submodule overhead exceeded the unrealized reuse benefit.

```
src/components/auth/          → github.com/JamesonRGrieve/auth
src/lib/zod2gql/              → github.com/JamesonRGrieve/zod2gql
```

- **`auth`** stays separate because downstream forks may swap it wholesale (Auth0, Clerk, custom) and the cleaner the boundary the easier that swap.
- **`zod2gql`** stays separate because it's the one genuinely reusable utility — zero framework coupling, candidate for npm publication.

Submodule rules:

- **After cloning**, initialize submodules: `git submodule update --init --recursive`.
- **To pull latest**: `git submodule update --remote --merge`.
- **Path aliases** in `tsconfig.json` map `@/auth/*` and `@/zod2gql` to the `src/` directories inside each submodule. Path aliases for the inlined modules (`@/appwrapper/*`, `@/dynamic-form/*`, `@/next-log/*`) point at their now-local directories under `src/components/` and `src/lib/`; imports remain unchanged from the submodule era.
- **Submodule changes are separate commits.** If you modify code inside a submodule, commit and push within that submodule first, then update the parent repo's submodule pointer with a separate commit.
- **Don't edit submodule code to fix a parent-repo problem.** If the issue is in the parent repo's usage, fix it there.
- **`auth` currently imports from inlined modules and parent app code** (e.g. `@/dynamic-form/*`, `@/next-log/log`, `@/app/NavMain`). This violates the "self-contained" rule but reflects historical reality. Future cleanup: move framework-side glue into the parent so `auth` only depends on its own surface plus `@/zod2gql`.

## Commands

```bash
npm install               # Install dependencies
npm run dev               # Dev server on port 1109
npm run build             # Production build
npm run lint              # ESLint
npm run lint-fix          # ESLint with auto-fix
npm run fix               # Prettier + ESLint auto-fix
npm run prettier-fix      # Prettier format only
```
