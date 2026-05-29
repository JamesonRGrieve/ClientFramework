#!/usr/bin/env node
/**
 * Ratchet for hard-coded color and spacing literals in CSS.
 *
 * Baseline: `.theme-baseline` (JSON: { colors: number, spacing: number }).
 * Direction: counts must NOT rise. Both metrics are tracked independently —
 * a rise in either fails the ratchet.
 */
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const BASELINE = resolve(process.cwd(), '.theme-baseline');
const COVERAGE = resolve(process.cwd(), '.theme-coverage.json');
const updateMode = process.argv.slice(2).includes('--update');

execSync('node scripts/theme-coverage.mjs', { encoding: 'utf8' });
const cov = JSON.parse(readFileSync(COVERAGE, 'utf8'));
const current = { colors: cov.colors, spacing: cov.spacing };

if (updateMode) {
  writeFileSync(BASELINE, JSON.stringify(current, null, 2) + '\n', 'utf8');
  console.log(`[theme-ratchet] baseline updated to ${JSON.stringify(current)}`);
  process.exit(0);
}

if (!existsSync(BASELINE)) {
  writeFileSync(BASELINE, JSON.stringify(current, null, 2) + '\n', 'utf8');
  console.log(`[theme-ratchet] baseline initialised at ${JSON.stringify(current)}`);
  process.exit(0);
}

let baseline;
try {
  baseline = JSON.parse(readFileSync(BASELINE, 'utf8'));
} catch (err) {
  console.error(`[theme-ratchet] cannot parse baseline at ${BASELINE}: ${err.message}`);
  process.exit(2);
}

const failures = [];
for (const key of ['colors', 'spacing']) {
  const b = baseline[key] ?? 0;
  const c = current[key];
  if (c > b) failures.push(`${key}: ${b} -> ${c} (+${c - b})`);
}

if (failures.length) {
  console.error(`[theme-ratchet] FAIL: theme literals rose:`);
  for (const f of failures) console.error(`  ${f}`);
  console.error(`See ${COVERAGE}. Move literals into Tailwind v4 @theme tokens.`);
  process.exit(1);
}

const drops = [];
for (const key of ['colors', 'spacing']) {
  const b = baseline[key] ?? 0;
  const c = current[key];
  if (c < b) drops.push(`${key}: ${b} -> ${c}`);
}

if (drops.length) {
  console.log(`[theme-ratchet] OK: literals dropped: ${drops.join(', ')}. Lower baseline: pnpm theme:ratchet:update`);
  process.exit(0);
}

console.log(`[theme-ratchet] OK: theme literals unchanged at ${JSON.stringify(current)}.`);
process.exit(0);
