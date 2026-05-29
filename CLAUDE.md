# Claude Code Instructions — client-framework

This is a **Next.js application template**. Downstream projects merge from it regularly. Workspace-level TS/JS standards (Direction, Casting, Ratchets, ESLint, TS, Test, Pre-commit, Hard Rules) live in `../CLAUDE.md` §7 and apply here. This file documents the rules **specific** to this repo.

---

## Design Philosophy

This repository is a template framework. Downstream projects merge from it regularly. Every design decision must minimize the need for downstream repos to modify framework-owned files or directories. **Avoid merge conflicts with downstream implementors at all costs.** Prefer configuration, extension points, and convention-based overrides so that downstream customization happens in files the framework never touches.

---

## Submodules

This project uses four git submodules — each is an independent repo with its own `package.json`:

```
src/components/appwrapper/    → github.com/JamesonRGrieve/appwrapper
src/components/auth/          → github.com/JamesonRGrieve/auth
src/components/dynamic-form/  → github.com/JamesonRGrieve/dynamic-form
src/lib/zod2gql/              → github.com/JamesonRGrieve/zod2gql
```

- **After cloning**, initialize submodules: `git submodule update --init --recursive`.
- **To pull latest** for all submodules: `git submodule update --remote --merge`.
- **Path aliases** in `tsconfig.json` map `@/auth/*`, `@/appwrapper/*`, `@/dynamic-form/*`, and `@/zod2gql` to their respective `src/` directories inside each submodule.
- **Submodule changes are separate commits** (workspace rule). Modify, commit, push in the submodule first; bump the parent's pointer in a separate commit.
- **Don't edit submodule code to fix a parent-repo problem.** If the issue is in the parent repo's usage, fix it there. Only modify submodule code for bugs or features that belong to that library.
- **No cross-linking between submodules.** Each submodule must be a self-contained npm package — no submodule imports from another submodule.

---

## Repo-Specific Notes (in addition to workspace §7)

- **Object-oriented bias.** Stateful services, models, and lifecycle objects use classes. Use interfaces and generics to define contracts. Prefer composition via injected dependencies over standalone functions with implicit coupling.
- **Promise hygiene.** Every `async` call must be `await`ed, `.catch()`-ed, or explicitly marked `void`. Unhandled rejections silently swallow errors.
- **No inline HTML event handlers.** Never use `onclick`, `onload`, etc. in dynamically constructed HTML. Use React event handlers or `addEventListener`.
- **No HTML string interpolation with external data.** Never pass untrusted values into `dangerouslySetInnerHTML` or any DOM API that parses HTML. Build content with React components and text nodes instead.
- **Lifecycle resource cleanup.** Capture all timer IDs from `setTimeout` / `setInterval` and clear them in cleanup functions returned from `useEffect`. Dispose subscriptions and listeners on unmount.
- **No magic numbers.** Extract timeouts, poll intervals, and other numeric constants to named `const` declarations at the top of the file.
- **No `console.log` in committed code.** Use `console.warn` / `console.error` for diagnostics.

---

## Ratchet Status

This repo currently lacks `scripts/` ratchet runners. Adopt the canonical implementations from `dynamic-form/scripts/` (`lint-ratchet.mjs`, `typecheck-ratchet.mjs`, `coverage-symmetry.mjs`, `symmetry-ratchet.mjs`) and seed `.eslint-warning-baseline`, `.tsc-error-baseline`, `.symmetry-baseline` from current state. Track in `todo.json`.

---

## Commands

The package manager is **pnpm**. Do not use `npm` — the `package-lock.json` is gone; only `pnpm-lock.yaml` is committed.

```bash
pnpm install              # Install dependencies
pnpm dev                  # Dev server on port 1109
pnpm build                # Production build
pnpm lint                 # ESLint (flat config, eslint.config.mjs)
pnpm lint-fix             # ESLint with auto-fix
pnpm fix                  # Prettier + ESLint auto-fix
pnpm prettier-fix         # Prettier format only
pnpm check                # Aggregate: lockfile + all ratchets
```

### ESLint: modern flat config

This repo uses the **ESLint v9 flat config** (`eslint.config.mjs`) invoked via the ESLint CLI (`eslint .`) — `next lint` and the legacy `.eslintrc.json` / `.eslintignore` have been removed (`next lint` is deprecated in Next 15+). The full prior ruleset is preserved and bridged via `@eslint/eslintrc`'s `FlatCompat` for shareable configs without native flat presets (`next/core-web-vitals`, `plugin:storybook/recommended`, `plugin:@vitest/legacy-recommended`). Type-aware rules use `parserOptions.projectService` (TS-ESLint v8) instead of a hard-coded `project` path.

### Submodules and lint

The flat config's top-level `ignores` excludes all five submodule paths plus the app-router boilerplate, build output and tooling files. Each submodule has its own ESLint pipeline and is responsible for linting itself; the parent never loads a submodule's config.

---

## Ratchet Re-seed Required

The ESLint configuration was hardened toward foundry parity (workspace `../CLAUDE.md` §7.5): added `plugin:storybook/recommended`, the full `@typescript-eslint/naming-convention` rule set, `@typescript-eslint/no-use-before-define`, `no-new-native-nonconstructor`, `no-duplicate-imports`, `no-self-assign`, an explicit `@typescript-eslint/no-shadow` pair, a 4th `no-restricted-syntax` selector (`unknown` outside `catch`), and a Vitest test-file override (`@vitest/eslint-plugin`). The config was also migrated from legacy `.eslintrc.json` + `next lint` to the modern flat config (`eslint.config.mjs`, `eslint .`); the lint-ratchet now drives the ESLint CLI directly.

Because new warn-level rules were added, the lint baseline will report more warnings than `.eslint-warning-baseline` currently records. After `pnpm install` (which installs the newly added `@vitest/eslint-plugin`), re-seed the lint baseline:

```bash
pnpm install
pnpm lint:ratchet:update   # re-seeds .eslint-warning-baseline
```

Commit the regenerated `.eslint-warning-baseline` in the **same commit** as these config changes (workspace `../CLAUDE.md` §7.3 — a baseline bump rides with the change that necessitated it). Do not bypass the ratchet with `--no-verify`.
