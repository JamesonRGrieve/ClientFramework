#!/usr/bin/env node
/**
 * Biome diagnostics ratchet. Runs `biome lint src/` and compares the total
 * (errors + warnings) count to .biome-baseline. Fails when the count goes UP.
 *
 * Usage:
 *   node scripts/biome-ratchet.mjs            # check
 *   node scripts/biome-ratchet.mjs --update   # rewrite baseline
 */
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

const BASELINE_PATH = resolve(process.cwd(), '.biome-baseline');
const updateMode = process.argv.slice(2).includes('--update');

let biomeOutput;
const biomeOutputPath = resolve(tmpdir(), `client-framework-biome-${process.pid}.json`);
try {
  execSync(`./node_modules/.bin/biome lint src/ --reporter=json > "${biomeOutputPath}"`, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 128 * 1024 * 1024,
    shell: '/bin/bash',
  });
} catch (err) {
  if (existsSync(biomeOutputPath)) {
    biomeOutput = readFileSync(biomeOutputPath, 'utf8');
  } else {
    biomeOutput = err.stdout?.toString() || '';
  }
}

if (!biomeOutput && existsSync(biomeOutputPath)) {
  biomeOutput = readFileSync(biomeOutputPath, 'utf8');
}
if (existsSync(biomeOutputPath)) {
  unlinkSync(biomeOutputPath);
}

const jsonStart = biomeOutput.indexOf('{');
if (jsonStart > 0) {
  biomeOutput = biomeOutput.slice(jsonStart);
}

let report;
try {
  report = JSON.parse(biomeOutput);
} catch (err) {
  console.error('[biome-ratchet] failed to parse biome JSON output');
  console.error(err.message);
  console.error(biomeOutput.slice(0, 1000));
  process.exit(2);
}

const summary = report.summary || {};
const errorCount = summary.errors ?? 0;
const warningCount = summary.warnings ?? 0;
const total = errorCount + warningCount;

if (updateMode) {
  writeFileSync(BASELINE_PATH, `${total}\n`, 'utf8');
  console.log(`[biome-ratchet] baseline updated to ${total} (errors=${errorCount}, warnings=${warningCount})`);
  process.exit(0);
}

if (!existsSync(BASELINE_PATH)) {
  writeFileSync(BASELINE_PATH, `${total}\n`, 'utf8');
  console.log(`[biome-ratchet] baseline initialised at ${total}`);
  process.exit(0);
}

const baseline = parseInt(readFileSync(BASELINE_PATH, 'utf8').trim(), 10);
if (Number.isNaN(baseline)) {
  console.error(`[biome-ratchet] cannot parse baseline at ${BASELINE_PATH}`);
  process.exit(2);
}

if (total > baseline) {
  console.error(`[biome-ratchet] FAIL: biome diagnostics increased ${baseline} -> ${total} (+${total - baseline}).`);
  console.error(`  errors=${errorCount}, warnings=${warningCount}`);
  console.error('Either fix the new diagnostics or run: pnpm biome:ratchet:update');
  process.exit(1);
}

if (total < baseline) {
  console.log(
    `[biome-ratchet] OK: diagnostics decreased ${baseline} -> ${total} (-${baseline - total}). Lower baseline: pnpm biome:ratchet:update`,
  );
  process.exit(0);
}

console.log(`[biome-ratchet] OK: diagnostics unchanged at ${total}.`);
process.exit(0);
