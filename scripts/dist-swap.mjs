#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * compile builds into dist.next/ and only then swaps it in for dist/, so an app that copies this
 * package (a `file:` dependency refreshed with `pnpm update`) never finds dist/ empty or half built
 * while a compile runs. `clean` clears the previous attempt before the build; `swap` replaces dist/
 * with two renames after it. Nothing is ever deleted from a live dist/.
 */
import { existsSync, renameSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const DIST = resolve('dist');
const NEXT = resolve('dist.next');
const OLD = resolve('dist.old');
const BUILD_INFO = resolve('tsconfig.compile.tsbuildinfo');

const clean = () => {
  for (const path of [NEXT, OLD, BUILD_INFO]) {
    rmSync(path, { recursive: true, force: true });
  }
};

const swap = () => {
  if (existsSync(DIST)) {
    renameSync(DIST, OLD);
  }
  renameSync(NEXT, DIST);
  rmSync(OLD, { recursive: true, force: true });
  console.warn('[dist-swap] swapped dist.next/ in for dist/');
};

const STEPS = new Map([
  ['clean', clean],
  ['swap', swap],
]);

const step = STEPS.get(process.argv[2] ?? '');
if (!step) {
  console.error(`usage: dist-swap.mjs <${[...STEPS.keys()].join('|')}>`);
  process.exit(1);
}
step();
