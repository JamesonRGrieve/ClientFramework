#!/usr/bin/env node
/**
 * Counts non-TypeScript source files under src/ as a ratcheting metric:
 * the long-term target is zero (everything is TypeScript). New `.js` /
 * `.jsx` files anywhere in src/ are a regression. Once the count hits
 * zero, the repo can flip `allowJs: false` in tsconfig and this ratchet
 * converts to a hard gate.
 *
 * Excludes: build output, tooling/config files, generated code.
 */
import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';

const SRC = resolve(process.cwd(), 'src');
const OUT = resolve(process.cwd(), '.js-coverage.json');

const SKIP_DIRS = new Set(['node_modules', 'dist', '__generated__']);
const JS_RE = /\.(js|jsx|mjs|cjs)$/;
const DECLARATION_RE = /\.d\.ts$/;

function walk(dir, acc = []) {
    let entries;
    try {
        entries = readdirSync(dir);
    } catch {
        return acc;
    }
    for (const entry of entries) {
        const p = join(dir, entry);
        const st = statSync(p);
        if (st.isDirectory()) {
            if (SKIP_DIRS.has(entry)) continue;
            walk(p, acc);
        } else {
            acc.push(p);
        }
    }
    return acc;
}

const all = walk(SRC);
const jsFiles = all
    .filter((p) => JS_RE.test(p) && !DECLARATION_RE.test(p))
    .map((p) => relative(process.cwd(), p))
    .sort();

const report = { count: jsFiles.length, files: jsFiles };
writeFileSync(OUT, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(`[js-coverage] ${jsFiles.length} non-TS source file(s) under src/`);
console.log(`[js-coverage] wrote ${relative(process.cwd(), OUT)}`);
