#!/usr/bin/env node
/**
 * Test/story typecheck ratchet. Compiles `tsconfig.test.json` (test + story
 * sources) with `tsc --noEmit` and tracks the total TS diagnostic count.
 * The count may only decrease.
 *
 * Baseline file: .test-typecheck-baseline (plain number).
 */
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const BASELINE = resolve(process.cwd(), '.test-typecheck-baseline');
const updateMode = process.argv.slice(2).includes('--update');
const CONFIG = 'tsconfig.test.json';

let raw = '';
try {
  raw = execSync(`./node_modules/.bin/tsc --noEmit -p ${CONFIG}`, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 256 * 1024 * 1024,
  });
} catch (err) {
  raw = (err.stdout?.toString() ?? '') + (err.stderr?.toString() ?? '');
}

let errorCount = 0;
for (const line of raw.split('\n')) {
  if (/:\s+error\s+TS\d+:/.test(line)) errorCount++;
}

if (updateMode) {
  writeFileSync(BASELINE, `${errorCount}\n`, 'utf8');
  console.log(`[test-typecheck-ratchet] baseline updated to ${errorCount}`);
  process.exit(0);
}

if (!existsSync(BASELINE)) {
  writeFileSync(BASELINE, `${errorCount}\n`, 'utf8');
  console.log(`[test-typecheck-ratchet] baseline initialised at ${errorCount}`);
  process.exit(0);
}

const baseline = parseInt(readFileSync(BASELINE, 'utf8').trim(), 10);
if (Number.isNaN(baseline)) {
  console.error(`[test-typecheck-ratchet] cannot parse baseline at ${BASELINE}`);
  process.exit(2);
}

if (errorCount > baseline) {
  console.error(`[test-typecheck-ratchet] FAIL: errors rose ${baseline} -> ${errorCount} (+${errorCount - baseline}).`);
  process.exit(1);
}

if (errorCount < baseline) {
  console.log(
    `[test-typecheck-ratchet] OK: errors dropped ${baseline} -> ${errorCount}. Lower the baseline: npm run test:typecheck:ratchet:update`,
  );
  process.exit(0);
}

console.log(`[test-typecheck-ratchet] OK: errors unchanged at ${errorCount}.`);
process.exit(0);
