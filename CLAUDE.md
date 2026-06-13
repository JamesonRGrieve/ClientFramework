# Claude Code Instructions — client-framework

This is a **Next.js application template**. Downstream projects merge from it regularly. Workspace-level TS/JS standards (Direction, Casting, Ratchets, ESLint, TS, Test, Pre-commit, Hard Rules) live in `../CLAUDE.md` §7 and apply here. This file documents the rules **specific** to this repo.

---

## Design Philosophy

Template/downstream-merge discipline is canonical in `/home/jameson/source/ai-prompts/react-next.md` §6. This repo *is* that template: every design decision minimizes the surface downstream consumers must modify — prefer configuration, extension points, and convention-based overrides over edits to framework-owned files.

---

## Submodules

Framework-package submodule discipline (init/pull, per-submodule lint pipelines, separate-commit pointer bumps, fix-defects-where-they-live, no cross-linking) is canonical in `/home/jameson/source/ai-prompts/react-next.md` §7. This repo's concrete submodules — each an independent repo with its own `package.json`:

```
src/components/appwrapper/    → github.com/JamesonRGrieve/appwrapper
src/components/auth/          → github.com/JamesonRGrieve/auth
src/components/dynamic-form/  → github.com/JamesonRGrieve/dynamic-form
src/lib/zod2gql/              → github.com/JamesonRGrieve/zod2gql
```

- **Path aliases** in `tsconfig.json` map `@/auth/*`, `@/appwrapper/*`, `@/dynamic-form/*`, and `@/zod2gql` to their respective `src/` directories inside each submodule. The in-repo `next-log` package (`@jgrieve/next-log`, `src/lib/next-log`) is the framework's logger.

---

## Repo-Specific Notes (in addition to `/home/jameson/source/ai-prompts/typescript.md` + `/home/jameson/source/ai-prompts/react-next.md`)

The generic hooks (`react-next.md` §3 — promise hygiene, lifecycle resource cleanup, no magic numbers in effects), security (`react-next.md` §5 — no inline HTML event handlers, no HTML-string interpolation with external data), and composition (`react-next.md` §1 — OO bias for stateful services, functions+hooks for UI) bullets are canonical there. Repo-local additions:

- **Logger.** Server-side logging uses the in-repo `next-log` package (`@jgrieve/next-log`, `src/lib/next-log`) — no ad-hoc `console.log` in committed code; `console.warn` / `console.error` are reserved for genuine diagnostics.

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

Flat-config baseline (ESLint v9 `eslint.config.mjs` driven by `eslint .` rather than the deprecated `next lint`; `parserOptions.projectService` instead of a hard-coded `project` path; submodule paths and app-router boilerplate ignored) is canonical in `/home/jameson/source/ai-prompts/react-next.md` §8. Repo-local specifics:

- The full prior ruleset is preserved and bridged via `@eslint/eslintrc`'s `FlatCompat` for shareable configs without native flat presets: `next/core-web-vitals`, `plugin:storybook/recommended`, `plugin:@vitest/legacy-recommended`.
- The flat config's top-level `ignores` excludes all five submodule paths plus the app-router boilerplate, build output, and tooling files. Each submodule has its own ESLint pipeline and lints itself; the parent never loads a submodule's config.

---

## Ratchet Re-seed Required

The ESLint configuration was hardened toward foundry parity (workspace `../CLAUDE.md` §7.5): added `plugin:storybook/recommended`, the full `@typescript-eslint/naming-convention` rule set, `@typescript-eslint/no-use-before-define`, `no-new-native-nonconstructor`, `no-duplicate-imports`, `no-self-assign`, an explicit `@typescript-eslint/no-shadow` pair, a 4th `no-restricted-syntax` selector (`unknown` outside `catch`), and a Vitest test-file override (`@vitest/eslint-plugin`). The config was also migrated from legacy `.eslintrc.json` + `next lint` to the modern flat config (`eslint.config.mjs`, `eslint .`); the lint-ratchet now drives the ESLint CLI directly.

Because new warn-level rules were added, the lint baseline will report more warnings than `.eslint-warning-baseline` currently records. After `pnpm install` (which installs the newly added `@vitest/eslint-plugin`), re-seed the lint baseline:

```bash
pnpm install
pnpm lint:ratchet:update   # re-seeds .eslint-warning-baseline
```

Commit the regenerated `.eslint-warning-baseline` in the **same commit** as these config changes (workspace `../CLAUDE.md` §7.3 — a baseline bump rides with the change that necessitated it). Do not bypass the ratchet with `--no-verify`.
