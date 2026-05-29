#!/usr/bin/env node
/**
 * !important ratchet. Counts `!important` occurrences in stylesheets and
 * inline `style=` attributes under `src/`. Each one is a cascade workaround
 * that prevents a downstream consumer from overriding the framework cleanly.
 *
 * Baseline file: .important-baseline (plain number).
 */
import { readFileSync, readdirSync, statSync, existsSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const BASELINE = resolve(process.cwd(), '.important-baseline');
const COVERAGE = resolve(process.cwd(), '.important-coverage.json');
const updateMode = process.argv.slice(2).includes('--update');

const ROOTS = ['src'];
const STYLE_EXTS = new Set(['.css', '.scss', '.sass', '.less']);
const CODE_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const SKIP_DIRS = new Set([
  'node_modules',
  '.next',
  'dist',
  'storybook-static',
  'auth',
  'appwrapper',
  'dynamic-form',
  'zod2gql',
]);

function walk(dir, out) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of entries) {
    if (name.startsWith('.')) continue;
    if (SKIP_DIRS.has(name)) continue;
    const p = join(dir, name);
    let st;
    try {
      st = statSync(p);
    } catch {
      continue;
    }
    if (st.isDirectory()) walk(p, out);
    else out.push(p);
  }
}

const allFiles = [];
for (const r of ROOTS) walk(r, allFiles);

const perFile = {};
let total = 0;

for (const path of allFiles) {
  const ext = path.slice(path.lastIndexOf('.'));
  let count = 0;
  if (STYLE_EXTS.has(ext)) {
    const text = readFileSync(path, 'utf8');
    count = (text.match(/!important/g) ?? []).length;
  } else if (CODE_EXTS.has(ext)) {
    const text = readFileSync(path, 'utf8');
    // Look for !important inside string-ish style= attributes
    const styleAttrs = text.match(/style\s*=\s*(["'`{])[\s\S]*?\1/g) ?? [];
    for (const block of styleAttrs) {
      count += (block.match(/!important/g) ?? []).length;
    }
  } else {
    continue;
  }
  if (count > 0) perFile[path] = count;
  total += count;
}

writeFileSync(
  COVERAGE,
  JSON.stringify({ generatedAt: new Date().toISOString(), perFile, totalImportant: total }, null, 2) + '\n',
);

if (updateMode) {
  writeFileSync(BASELINE, `${total}\n`, 'utf8');
  console.log(`[important-ratchet] baseline updated to ${total}`);
  process.exit(0);
}

if (!existsSync(BASELINE)) {
  writeFileSync(BASELINE, `${total}\n`, 'utf8');
  console.log(`[important-ratchet] baseline initialised at ${total}`);
  process.exit(0);
}

const baseline = Number(readFileSync(BASELINE, 'utf8').trim());
if (Number.isNaN(baseline)) {
  console.error(`[important-ratchet] cannot parse baseline at ${BASELINE}`);
  process.exit(2);
}

if (total > baseline) {
  console.error(`[important-ratchet] FAIL: !important count rose ${baseline} -> ${total} (+${total - baseline}).`);
  console.error('Each !important is a cascade workaround. Prefer specificity, source order, or refactoring the rule.');
  process.exit(1);
}

if (total < baseline) {
  console.log(
    `[important-ratchet] OK: !important dropped ${baseline} -> ${total}. Lower the baseline: npm run important:ratchet:update`,
  );
  process.exit(0);
}

console.log(`[important-ratchet] OK: !important unchanged at ${total}.`);
process.exit(0);
