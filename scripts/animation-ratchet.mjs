#!/usr/bin/env node
/**
 * Ratchet for animation usages across CSS + Tailwind v4 @theme tokens.
 *
 * Reads `.animation-baseline` and regenerates `.animation-coverage.json`.
 * Fails if the count has risen above the baseline. Run with `--update`
 * to seed/lower the baseline after deliberate reductions.
 */
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const BASELINE = resolve(process.cwd(), '.animation-baseline');
const COVERAGE = resolve(process.cwd(), '.animation-coverage.json');
const updateMode = process.argv.slice(2).includes('--update');

const out = execSync('node scripts/animation-coverage.mjs', { encoding: 'utf8' }).trim();
const current = Number(out.split('\n').pop());
if (Number.isNaN(current)) {
    console.error('[animation-ratchet] could not parse coverage output:', out);
    process.exit(2);
}

if (updateMode) {
    writeFileSync(BASELINE, `${current}\n`, 'utf8');
    console.log(`[animation-ratchet] baseline updated to ${current}`);
    process.exit(0);
}

if (!existsSync(BASELINE)) {
    writeFileSync(BASELINE, `${current}\n`, 'utf8');
    console.log(`[animation-ratchet] baseline initialised at ${current}`);
    process.exit(0);
}

const baseline = Number(readFileSync(BASELINE, 'utf8').trim());
if (Number.isNaN(baseline)) {
    console.error(`[animation-ratchet] cannot parse baseline at ${BASELINE}`);
    process.exit(2);
}

if (current > baseline) {
    console.error(`[animation-ratchet] FAIL: animation usages rose ${baseline} -> ${current} (+${current - baseline}). See ${COVERAGE}.`);
    console.error('Prefer Tailwind v4 @theme tokens or tailwindcss-animate utilities over hand-rolled keyframes/declarations.');
    process.exit(1);
}

if (current < baseline) {
    console.log(`[animation-ratchet] OK: animation usages dropped ${baseline} -> ${current}. Lower baseline: pnpm animation:ratchet:update`);
    process.exit(0);
}

console.log(`[animation-ratchet] OK: animation usages unchanged at ${current}.`);
process.exit(0);
