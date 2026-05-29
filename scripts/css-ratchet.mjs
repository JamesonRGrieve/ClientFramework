#!/usr/bin/env node
/**
 * Stylelint warning ratchet. Runs `stylelint --formatter json` over
 * stylesheets under `src/` and tracks the total warning count.
 *
 * Baseline file: .css-baseline (plain number).
 */
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

const BASELINE = resolve(process.cwd(), '.css-baseline');
const updateMode = process.argv.slice(2).includes('--update');
const outFile = resolve(tmpdir(), `client-framework-stylelint-${process.pid}.json`);

try {
  execSync(
    `./node_modules/.bin/stylelint "src/**/*.{css,scss,sass}" --formatter json --allow-empty-input --output-file "${outFile}"`,
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024, shell: '/bin/bash' },
  );
} catch {
  // stylelint exits non-zero on findings; the JSON is still in outFile.
}

let raw = '';
if (existsSync(outFile)) {
  raw = readFileSync(outFile, 'utf8');
  unlinkSync(outFile);
}

let results;
try {
  results = JSON.parse(raw || '[]');
} catch (e) {
  console.error('[css-ratchet] could not parse stylelint JSON output:');
  console.error(raw.slice(0, 500));
  process.exit(2);
}

let errorCount = 0;
let warningCount = 0;
for (const file of results) {
  for (const w of file.warnings ?? []) {
    if (w.severity === 'error') errorCount++;
    else warningCount++;
  }
}

if (errorCount > 0) {
  console.error(`[css-ratchet] FAIL: stylelint reported ${errorCount} error(s). Errors are not allowed.`);
  process.exit(1);
}

if (updateMode) {
  writeFileSync(BASELINE, `${warningCount}\n`, 'utf8');
  console.log(`[css-ratchet] baseline updated to ${warningCount}`);
  process.exit(0);
}

if (!existsSync(BASELINE)) {
  writeFileSync(BASELINE, `${warningCount}\n`, 'utf8');
  console.log(`[css-ratchet] baseline initialised at ${warningCount}`);
  process.exit(0);
}

const baseline = Number(readFileSync(BASELINE, 'utf8').trim());
if (Number.isNaN(baseline)) {
  console.error(`[css-ratchet] cannot parse baseline at ${BASELINE}`);
  process.exit(2);
}

if (warningCount > baseline) {
  console.error(`[css-ratchet] FAIL: stylelint warnings rose ${baseline} -> ${warningCount} (+${warningCount - baseline}).`);
  process.exit(1);
}

if (warningCount < baseline) {
  console.log(
    `[css-ratchet] OK: stylelint warnings dropped ${baseline} -> ${warningCount}. Lower the baseline: npm run css:ratchet:update`,
  );
  process.exit(0);
}

console.log(`[css-ratchet] OK: stylelint warnings unchanged at ${warningCount}.`);
process.exit(0);
