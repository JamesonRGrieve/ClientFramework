#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * Builds the workspace package it runs in (its tsconfig.compile.json) into dist/:
 * tsc into dist.next/, tsc-alias to give every relative import its file extension (Node's ESM
 * resolver requires them), finish-dist, then the swap into dist/. Run from the package.
 * Usage: compile-package.mjs [<source>=<dist-path>]...   (files finish-dist copies into dist/)
 */
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPTS = dirname(fileURLToPath(import.meta.url));
const NEXT = 'dist.next';
const PROJECT = ['-p', 'tsconfig.compile.json', '--outDir', NEXT];

const run = (command, args) => execFileSync(command, args, { stdio: 'inherit' });
const script = (name, args) => run(process.execPath, [join(SCRIPTS, name), ...args]);

script('dist-swap.mjs', ['clean']);
run('pnpm', ['exec', 'tsc', ...PROJECT]);
run('pnpm', ['exec', 'tsc-alias', ...PROJECT, '--resolve-full-paths']);
script('finish-dist.mjs', [NEXT, ...process.argv.slice(2)]);
script('dist-swap.mjs', ['swap']);
