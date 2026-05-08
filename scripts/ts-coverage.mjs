#!/usr/bin/env node
/**
 * Per-rule, per-directory TypeScript-strictness coverage.
 *
 * Counts these patterns across all TS/TSX files under `src/`:
 *   - bare `: any` annotations
 *   - ` as any` casts
 *   - `@ts-expect-error` directives
 *   - `@ts-ignore` directives
 *
 * Excludes submodule directories (`src/components/auth/**`,
 * `src/lib/zod2gql/**`) since they have their own quality gates.
 * Excludes stories, tests, declarations, and generated output.
 *
 * Aggregates by top-level directory under `src/` (e.g. `app`, `components`,
 * `lib`, `extensions`). The ratchet (scripts/ts-ratchet.mjs) consumes this
 * and refuses commits that increase any per-directory metric.
 *
 *   node scripts/ts-coverage.mjs            # write report + print table
 *   node scripts/ts-coverage.mjs --json     # JSON only on stdout
 *   node scripts/ts-coverage.mjs --quiet    # write report, no stdout
 *
 * Adapted from JamesonRGrieve/wh40k-ttrpg-foundry-vtt:scripts/ts-coverage.mjs.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { relative, resolve, sep } from 'node:path';

const ROOT = resolve(process.cwd(), 'src');
const OUT = resolve(process.cwd(), '.ts-coverage.json');
const args = new Set(process.argv.slice(2));
const jsonOnly = args.has('--json');
const quiet = args.has('--quiet');

const METRICS = ['any', 'asAny', 'tsExpectError', 'tsIgnore'];

const PATTERNS = {
  any: /(^|[^A-Za-z0-9_$]):\s*any\b/g,
  asAny: /\bas\s+any\b/g,
  tsExpectError: /@ts-expect-error\b/g,
  tsIgnore: /@ts-ignore\b/g,
};

const EXCLUDE_DIR_PATHS = new Set(
  [
    resolve(ROOT, 'components/auth'),
    resolve(ROOT, 'lib/zod2gql'),
    resolve(ROOT, 'lib/next-log'),
  ],
);

const EXCLUDE_DIR_NAMES = new Set(['node_modules', '.next', 'dist', '.storybook', 'storybook-static']);

const isCountable = (name) => {
  if (!name.endsWith('.ts') && !name.endsWith('.tsx')) return false;
  if (name.endsWith('.d.ts')) return false;
  if (name.endsWith('.stories.ts') || name.endsWith('.stories.tsx')) return false;
  if (name.endsWith('.test.ts') || name.endsWith('.test.tsx')) return false;
  if (name.endsWith('.spec.ts') || name.endsWith('.spec.tsx')) return false;
  return true;
};

function* walk(dir) {
  if (EXCLUDE_DIR_PATHS.has(dir)) return;
  for (const name of readdirSync(dir)) {
    if (EXCLUDE_DIR_NAMES.has(name)) continue;
    const full = `${dir}/${name}`;
    const st = statSync(full);
    if (st.isDirectory()) yield* walk(full);
    else if (st.isFile() && isCountable(name)) yield full;
  }
}

function topLevelDir(file) {
  const rel = relative(ROOT, file);
  const parts = rel.split(sep);
  return parts.length === 1 ? '_root' : parts[0];
}

const byDir = {};
const byFile = {};
const totals = Object.fromEntries(METRICS.map((m) => [m, 0]));
let totalFiles = 0;

for (const file of walk(ROOT)) {
  const src = readFileSync(file, 'utf8');
  const counts = Object.fromEntries(METRICS.map((m) => [m, 0]));
  for (const m of METRICS) {
    const re = new RegExp(PATTERNS[m].source, PATTERNS[m].flags);
    let n = 0;
    while (re.exec(src) !== null) n++;
    counts[m] = n;
    totals[m] += n;
  }
  const dir = topLevelDir(file);
  byDir[dir] ??= Object.fromEntries([...METRICS.map((m) => [m, 0]), ['files', 0]]);
  for (const m of METRICS) byDir[dir][m] += counts[m];
  byDir[dir].files++;
  const rel = relative(process.cwd(), file);
  if (METRICS.some((m) => counts[m] > 0)) byFile[rel] = counts;
  totalFiles++;
}

const summary = { files: totalFiles, ...totals };
const payload = { generatedAt: new Date().toISOString(), summary, byDir, byFile };
const serialized = `${JSON.stringify(payload, null, 2)}\n`;

if (!jsonOnly) writeFileSync(OUT, serialized, 'utf8');

if (jsonOnly) {
  process.stdout.write(serialized);
  process.exit(0);
}

if (quiet) {
  process.exit(0);
}

const dirs = Object.keys(byDir).sort();
console.log(`\n[ts-coverage] ${totalFiles} files under src/ (excluding submodules + tests/stories)`);
console.log(
  `  totals — any: ${totals.any}, as any: ${totals.asAny}, ` +
    `@ts-expect-error: ${totals.tsExpectError}, @ts-ignore: ${totals.tsIgnore}`,
);
console.log('');
console.log('| directory | files | any | as any | @ts-expect-error | @ts-ignore |');
console.log('| --- | ---: | ---: | ---: | ---: | ---: |');
for (const d of dirs) {
  const r = byDir[d];
  console.log(`| ${d} | ${r.files} | ${r.any} | ${r.asAny} | ${r.tsExpectError} | ${r.tsIgnore} |`);
}
console.log('');
console.log(`Report written to ${OUT}.`);
