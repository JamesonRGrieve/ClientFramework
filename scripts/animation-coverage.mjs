#!/usr/bin/env node
/**
 * Count animation usages across CSS (and Tailwind v4 `@theme` animation tokens).
 *
 * Tracks:
 *   - `@keyframes <name>` blocks
 *   - `animation:` / `animation-name:` / `animation-*:` declarations
 *   - Tailwind v4 `@theme` `--animate-*` and `--keyframes-*` tokens
 *
 * Scans:
 *   - src/**\/*.{css,scss,module.css}
 *   - app/**\/*.css (Next.js app router; src/app is already covered above)
 *
 * Excludes submodule directories (which have their own ratchets).
 *
 * Output: prints the count to stdout. Writes .animation-coverage.json.
 */
import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const EXCLUDED_DIRS = new Set([
    'node_modules', '.next', 'dist', 'storybook-static', 'coverage',
    'appwrapper', 'auth', 'dynamic-form', 'zod2gql',
]);

function walk(dir, out = []) {
    if (!existsSync(dir)) return out;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) {
            if (EXCLUDED_DIRS.has(entry.name)) continue;
            walk(join(dir, entry.name), out);
        } else if (entry.isFile()) {
            const name = entry.name;
            if (name.endsWith('.css') || name.endsWith('.scss')) {
                out.push(join(dir, entry.name));
            }
        }
    }
    return out;
}

const SCAN_DIRS = ['src', 'app'].filter((d) => existsSync(d));
const sources = [];
for (const d of SCAN_DIRS) walk(d, sources);
sources.sort();

let keyframes = 0;
let declarations = 0;
let themeTokens = 0;

for (const path of sources) {
    const text = readFileSync(path, 'utf8');
    keyframes += (text.match(/@keyframes\s+[\w-]+/g) ?? []).length;
    declarations += (text.match(/^\s*animation(?:-[a-z-]+)?\s*:/gm) ?? []).length;
    themeTokens += (text.match(/--(?:animate|keyframes)-[\w-]+\s*:/g) ?? []).length;
}

const total = keyframes + declarations + themeTokens;

const report = {
    generatedAt: new Date().toISOString(),
    sources: sources.map((p) => relative(process.cwd(), p)),
    keyframes,
    declarations,
    themeTokens,
    total,
};

writeFileSync('.animation-coverage.json', JSON.stringify(report, null, 2) + '\n');
console.log(total);
