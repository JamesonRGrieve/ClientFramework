#!/usr/bin/env node
/**
 * ESLint warning ratchet.
 *
 * Runs `next lint --format json` and compares the warning count to
 * `.eslint-warning-baseline`. Fails when the count goes UP, succeeds when
 * it goes down or stays the same. Errors always fail.
 *
 * The baseline is committed to git. When a PR lowers the count, update the
 * baseline file in the same commit so the new floor sticks:
 *
 *   node scripts/lint-ratchet.mjs            # check
 *   node scripts/lint-ratchet.mjs --update   # rewrite baseline to current count
 *
 * Adapted from JamesonRGrieve/wh40k-ttrpg-foundry-vtt:scripts/lint-ratchet.mjs.
 */
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

const BASELINE_PATH = resolve(process.cwd(), '.eslint-warning-baseline');
const args = process.argv.slice(2);
const updateMode = args.includes('--update');

const lintOutputPath = resolve(tmpdir(), `clientframework-eslint-${process.pid}.json`);
let lintOutput = '';

try {
  execSync(`pnpm exec next lint --format json --output-file "${lintOutputPath}"`, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 64 * 1024 * 1024,
  });
} catch (err) {
  // next lint exits non-zero when errors exist; the JSON file is still written.
  if (!existsSync(lintOutputPath)) {
    lintOutput = err.stdout?.toString() || err.stderr?.toString() || '';
  }
}

if (!lintOutput && existsSync(lintOutputPath)) {
  lintOutput = readFileSync(lintOutputPath, 'utf8');
  unlinkSync(lintOutputPath);
}

let results;
try {
  results = JSON.parse(lintOutput);
} catch (err) {
  console.error('[lint-ratchet] failed to parse eslint JSON output');
  console.error(err.message);
  if (lintOutput) console.error(lintOutput.slice(0, 2000));
  process.exit(2);
}

const errorCount = results.reduce((sum, r) => sum + (r.errorCount ?? 0), 0);
const warningCount = results.reduce((sum, r) => sum + (r.warningCount ?? 0), 0);

if (errorCount > 0) {
  console.error(`[lint-ratchet] FAIL: eslint reported ${errorCount} error(s). Errors are not allowed.`);
  process.exit(1);
}

if (updateMode) {
  writeFileSync(BASELINE_PATH, `${warningCount}\n`, 'utf8');
  console.log(`[lint-ratchet] baseline updated to ${warningCount}`);
  process.exit(0);
}

if (!existsSync(BASELINE_PATH)) {
  writeFileSync(BASELINE_PATH, `${warningCount}\n`, 'utf8');
  console.log(`[lint-ratchet] baseline file missing — initialised at ${warningCount}`);
  process.exit(0);
}

const baseline = parseInt(readFileSync(BASELINE_PATH, 'utf8').trim(), 10);
if (Number.isNaN(baseline)) {
  console.error(`[lint-ratchet] cannot parse baseline at ${BASELINE_PATH}`);
  process.exit(2);
}

if (warningCount > baseline) {
  console.error(`[lint-ratchet] FAIL: eslint warnings increased ${baseline} -> ${warningCount} (+${warningCount - baseline}).`);
  console.error('Fix the new warnings, or if intentional run: pnpm run lint:ratchet:update');
  process.exit(1);
}

if (warningCount < baseline) {
  console.log(`[lint-ratchet] OK: eslint warnings decreased ${baseline} -> ${warningCount} (-${baseline - warningCount}).`);
  console.log('Lower the baseline in the same commit: pnpm run lint:ratchet:update');
  process.exit(0);
}

console.log(`[lint-ratchet] OK: eslint warnings unchanged at ${warningCount}.`);
process.exit(0);
