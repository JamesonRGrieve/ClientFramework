# Claude Code Instructions — client-framework

Next.js application template. Downstream projects merge from it regularly. Workspace-level standards live in `../CLAUDE.md` and apply here. This file documents rules **specific** to this repo.

## Stack Standards

Read **before your first edit** in this repo:

- `/home/jameson/Source/ai-prompts/typescript.md` — TypeScript language, casting, ratchets, Biome, ESLint, tsconfig, test structure, pre-commit pipeline
- `/home/jameson/Source/ai-prompts/react-next.md` — React/Next.js component layering, hooks, accessibility, security, template discipline, submodules, app-router, state/data-fetching, CSS/theme ratchets

These are the canonical home of their rules. This file does not restate them — it adds repo-specific detail only.

---

## Design Philosophy

This repo _is_ the template described in `react-next.md` §6: every design decision minimizes the surface downstream consumers must modify — prefer configuration, extension points, and convention-based overrides over edits to framework-owned files.

---

## Submodules

Submodule discipline is canonical in `react-next.md` §7. This repo's concrete submodules — each an independent repo with its own `package.json`:

```
src/components/appwrapper/    → github.com/JamesonRGrieve/appwrapper
src/components/auth/          → github.com/JamesonRGrieve/auth
src/components/dynamic-form/  → github.com/JamesonRGrieve/dynamic-form
src/lib/zod2gql/              → github.com/JamesonRGrieve/zod2gql
```

**Path aliases** in `tsconfig.json` map `@/auth/*`, `@/appwrapper/*`, `@/dynamic-form/*`, and `@/zod2gql` to their respective `src/` directories inside each submodule.

---

## Repo-Specific Notes

- **Logger.** Server-side logging uses the in-repo `next-log` package (`@jgrieve/next-log`, `src/lib/next-log`) — no ad-hoc `console.log` in committed code; `console.warn` / `console.error` are reserved for genuine diagnostics.

---

## Commands

The package manager is **pnpm**. Do not use `npm` — only `pnpm-lock.yaml` is committed.

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

---

## ESLint: Flat Config

Flat-config baseline is canonical in `react-next.md` §8. Repo-local specifics:

- The full prior ruleset is preserved and bridged via `@eslint/eslintrc`'s `FlatCompat` for shareable configs without native flat presets: `next/core-web-vitals`, `plugin:storybook/recommended`, `plugin:@vitest/legacy-recommended`.
- The flat config's top-level `ignores` excludes all five submodule paths plus the app-router boilerplate, build output, and tooling files. Each submodule has its own ESLint pipeline and lints itself; the parent never loads a submodule's config.

---

## Ratchet Status

This repo currently lacks `scripts/` ratchet runners. Adopt the canonical implementations from `dynamic-form/scripts/` (`lint-ratchet.mjs`, `typecheck-ratchet.mjs`, `coverage-symmetry.mjs`, `symmetry-ratchet.mjs`) and seed `.eslint-warning-baseline`, `.tsc-error-baseline`, `.symmetry-baseline` from current state. Track in `todo.json`.

---

## Ratchet Re-seed Required

The ESLint configuration was hardened toward foundry parity (`typescript.md` §5): added `plugin:storybook/recommended`, the full `@typescript-eslint/naming-convention` rule set, `@typescript-eslint/no-use-before-define`, `no-new-native-nonconstructor`, `no-duplicate-imports`, `no-self-assign`, an explicit `@typescript-eslint/no-shadow` pair, a 4th `no-restricted-syntax` selector (`unknown` outside `catch`), and a Vitest test-file override (`@vitest/eslint-plugin`). The config was also migrated from legacy `.eslintrc.json` + `next lint` to the modern flat config (`eslint.config.mjs`, `eslint .`).

Because new warn-level rules were added, the lint baseline will report more warnings than `.eslint-warning-baseline` currently records. After `pnpm install`, re-seed:

```bash
pnpm install
pnpm lint:ratchet:update   # re-seeds .eslint-warning-baseline
```

Commit the regenerated `.eslint-warning-baseline` in the **same commit** as these config changes (`typescript.md` §3 — a baseline bump rides with the change that necessitated it).
