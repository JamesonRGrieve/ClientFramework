// SPDX-License-Identifier: AGPL-3.0-or-later
// Completes a package's build output directory after tsc + tsc-alias. Run from the package.
// Usage: finish-dist.mjs <dist-dir> [<source>=<dist-path>]...
//   - marks the directory as ES modules, so Node loads its .js files as ESM whatever the
//     enclosing package says;
//   - copies each listed source file into it, e.g. a package's stylesheet export.
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const [distArg, ...copies] = process.argv.slice(2);
if (distArg === undefined) {
  console.error('usage: finish-dist.mjs <dist-dir> [<source>=<dist-path>]...');
  process.exit(1);
}
const DIST = resolve(distArg);

writeFileSync(resolve(DIST, 'package.json'), `${JSON.stringify({ type: 'module' }, null, 2)}\n`);
for (const copy of copies) {
  const [source, target] = copy.split('=');
  if (source === undefined || target === undefined) {
    console.error(`[finish-dist] expected <source>=<dist-path>, got ${copy}`);
    process.exit(1);
  }
  const destination = resolve(DIST, target);
  mkdirSync(dirname(destination), { recursive: true });
  copyFileSync(resolve(source), destination);
}
console.warn(`[finish-dist] marked ${distArg} as ES modules and copied ${copies.length} file(s)`);
