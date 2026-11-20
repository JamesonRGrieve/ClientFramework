#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * The ratchets every Zephyrex app and the framework hold themselves to, run from the directory
 * whose baselines they read (an app's `client/`, or client-framework's root):
 *
 *   zephyrex-gates check                 # every app ratchet below, in order; fails if any does
 *   zephyrex-gates <ratchet> [--update]  # one of them; --update lowers its baseline
 *
 * Ratchets: typecheck, lint, biome, symmetry, important, js-coverage. Each reads `.<name>-baseline`
 * style files where it runs, so every app keeps only its own baselines. `GATE_ROOTS=src,other`
 * names the source roots; `LINT_TARGET` narrows ESLint.
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const RATCHETS = ['typecheck', 'lint', 'biome', 'symmetry', 'important', 'js-coverage'];

/** Runs one ratchet as its own process; its exit status. */
function run(name, args) {
  const script = fileURLToPath(new URL(`./${name}-ratchet.mjs`, import.meta.url));
  return spawnSync(process.execPath, [script, ...args], { stdio: 'inherit' }).status ?? 1;
}

const [command, ...args] = process.argv.slice(2);
if (command === 'check') {
  // Every ratchet runs, so one run reports every rise; the check fails if any did.
  const failed = RATCHETS.filter((name) => run(name, args) !== 0);
  if (failed.length > 0) {
    console.error(`[zephyrex-gates] FAIL: ${failed.join(', ')}`);
  }
  process.exit(failed.length > 0 ? 1 : 0);
} else if (command !== undefined && RATCHETS.includes(command)) {
  process.exit(run(command, args));
} else {
  console.error(`Usage: zephyrex-gates check | zephyrex-gates <${RATCHETS.join('|')}> [--update]`);
  process.exit(2);
}
