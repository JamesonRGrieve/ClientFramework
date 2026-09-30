// SPDX-License-Identifier: AGPL-3.0-or-later
// Checks that dist/ loads under Node's own ESM resolver, not only under a bundler (which
// tolerates extensionless paths and packages without an "exports" map):
//   1. every relative import names a file that exists, and
//   2. every module imports cleanly when executed by plain Node.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const DIST = resolve('dist');
const RELATIVE_IMPORT = /(?:from|import)\s*\(?\s*['"](\.{1,2}\/[^'"]+)['"]/g;

const files = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      walk(full);
    } else if (name.endsWith('.js') || name.endsWith('.d.ts')) {
      files.push(full);
    }
  }
};
walk(DIST);

const relativeName = (file) => file.replace(`${DIST}/`, '');

const broken = [];
for (const file of files) {
  for (const match of readFileSync(file, 'utf8').matchAll(RELATIVE_IMPORT)) {
    const target = resolve(dirname(file), match[1]);
    if (!existsSync(target) || statSync(target).isDirectory()) {
      broken.push(`${relativeName(file)} -> ${match[1]}`);
    }
  }
}

const modules = files.filter((file) => file.endsWith('.js'));
for (const file of modules) {
  try {
    await import(pathToFileURL(file).href);
  } catch (error) {
    broken.push(`${relativeName(file)}: ${error instanceof Error ? error.message.split('\n')[0] : String(error)}`);
  }
}

if (broken.length > 0) {
  console.error(`[verify-dist] ${broken.length} problems loading dist/ under Node:`);
  for (const entry of broken) {
    console.error(`  ${entry}`);
  }
  process.exit(1);
}
console.warn(`[verify-dist] OK: ${files.length} dist files resolve and ${modules.length} modules import under Node`);
