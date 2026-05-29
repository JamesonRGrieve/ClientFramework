#!/usr/bin/env node
/**
 * type-coverage ratchet. Computes the % of source positions whose inferred
 * type is non-`any` under `--strict`. Per workspace standard, the baseline
 * tracks the covered count; covered may never drop. Once covered === total,
 * the ratchet auto-flips to strict mode (no regressions allowed).
 *
 * Baseline file: .type-coverage-baseline (JSON).
 */
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const BASELINE = resolve(process.cwd(), '.type-coverage-baseline');
const args = new Set(process.argv.slice(2));
const updateMode = args.has('--update');

let stdout = '';
try {
  stdout = execSync('./node_modules/.bin/type-coverage --strict --no-detail', {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 16 * 1024 * 1024,
  });
} catch (err) {
  stdout = err.stdout?.toString() ?? '';
}

const match = /\((\d+)\s*\/\s*(\d+)\)\s+([\d.]+)%/.exec(stdout);
if (!match) {
  console.error('[type-coverage-ratchet] could not parse type-coverage output:');
  console.error(stdout);
  process.exit(2);
}

const covered = Number(match[1]);
const total = Number(match[2]);
const percent = Number(match[3]);

const baseExists = existsSync(BASELINE);
const prior = baseExists ? JSON.parse(readFileSync(BASELINE, 'utf8')) : null;
const priorStrict = Boolean(prior?.strict);
const isAtCeiling = covered === total;
const strict = priorStrict || isAtCeiling;

if (priorStrict && !isAtCeiling) {
  console.error('[type-coverage-ratchet] STRICT-MODE VIOLATION: type-coverage regressed below 100%.');
  console.error(`  covered=${covered} total=${total} (${percent}%) — gap=${total - covered}`);
  process.exit(1);
}

function writeBaseline() {
  const out = { covered, total, percent, strict };
  writeFileSync(BASELINE, JSON.stringify(out, null, 2) + '\n', 'utf8');
}

if (updateMode) {
  writeBaseline();
  console.log(
    `[type-coverage-ratchet] baseline updated: covered=${covered} total=${total} (${percent}%)${strict ? ' [strict]' : ''}`,
  );
  process.exit(0);
}

if (!baseExists) {
  writeBaseline();
  console.log(`[type-coverage-ratchet] baseline initialised: covered=${covered} total=${total} (${percent}%)`);
  process.exit(0);
}

const priorCovered = Number(prior.covered ?? 0);
if (covered < priorCovered) {
  console.error('[type-coverage-ratchet] FAIL:');
  console.error(`  covered: ${priorCovered} -> ${covered} (-${priorCovered - covered})`);
  process.exit(1);
}

if (isAtCeiling && !priorStrict) {
  writeBaseline();
  console.log(`[type-coverage-ratchet] GRADUATED to strict: 100% (${covered}/${total}).`);
  process.exit(0);
}

console.log(`[type-coverage-ratchet] OK: covered=${covered} total=${total} (${percent}%)${strict ? ' [strict]' : ''}`);
process.exit(0);
