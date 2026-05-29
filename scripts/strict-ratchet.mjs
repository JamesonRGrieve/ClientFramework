#!/usr/bin/env node
/**
 * Strict-mode ratchet. Counts the number of TS source files under `src/`
 * that produce one or more errors when compiled with the workspace strict
 * settings (`tsconfig.strict.json`). The count may never rise. Once it hits
 * zero the ratchet auto-flips to strict mode and any regression hard-fails.
 *
 * Baseline file: .strict-baseline (JSON).
 */
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const BASELINE = resolve(process.cwd(), '.strict-baseline');
const argv = process.argv.slice(2);
const updateMode = argv.includes('--update');
const CONFIG = 'tsconfig.strict.json';

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

const failingFiles = new Set();
let totalErrors = 0;
for (const line of raw.split('\n')) {
  // tsc diagnostic format: path/to/file.ts(line,col): error TSxxxx: message
  const m = /^([^()]+\.(?:ts|tsx|js|jsx))\((\d+),(\d+)\):\s+error\s+TS\d+:/.exec(line);
  if (!m) continue;
  const file = m[1];
  // Only count files inside this repo's src/ (and root-level *.ts) — skip node_modules
  if (file.includes('node_modules')) continue;
  failingFiles.add(file);
  totalErrors++;
}

const failingCount = failingFiles.size;
const baseExists = existsSync(BASELINE);
const prior = baseExists ? JSON.parse(readFileSync(BASELINE, 'utf8')) : null;
const priorCount = Number(prior?.failingFiles ?? Number.MAX_SAFE_INTEGER);
const priorStrict = Boolean(prior?.strict);
const isAtCeiling = failingCount === 0;
const strict = priorStrict || isAtCeiling;

if (priorStrict && !isAtCeiling) {
  console.error('[strict-ratchet] STRICT-MODE VIOLATION: strict failures rose above 0.');
  console.error(`  failing files: ${failingCount}, errors: ${totalErrors}`);
  process.exit(1);
}

function writeBaseline() {
  const out = { failingFiles: failingCount, totalErrors, strict };
  writeFileSync(BASELINE, JSON.stringify(out, null, 2) + '\n', 'utf8');
}

if (updateMode) {
  writeBaseline();
  console.log(
    `[strict-ratchet] baseline updated: failingFiles=${failingCount} totalErrors=${totalErrors}${strict ? ' [strict]' : ''}`,
  );
  process.exit(0);
}

if (!baseExists) {
  writeBaseline();
  console.log(`[strict-ratchet] baseline initialised: failingFiles=${failingCount} totalErrors=${totalErrors}`);
  process.exit(0);
}

if (failingCount > priorCount) {
  console.error('[strict-ratchet] FAIL:');
  console.error(`  failingFiles: ${priorCount} -> ${failingCount} (+${failingCount - priorCount})`);
  process.exit(1);
}

if (isAtCeiling && !priorStrict) {
  writeBaseline();
  console.log('[strict-ratchet] GRADUATED to strict: 0 failing files.');
  process.exit(0);
}

console.log(`[strict-ratchet] OK: failingFiles=${failingCount} totalErrors=${totalErrors}${strict ? ' [strict]' : ''}`);
process.exit(0);
