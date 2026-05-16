#!/usr/bin/env node
/**
 * Count hard-coded design tokens that should live in Tailwind v4 `@theme`.
 *
 *  - `colors`:  hex literals (#abc / #aabbcc / #aabbccdd) and rgb()/rgba()/hsl()/hsla()
 *    appearing in CSS files outside the `@theme` block. (Tokens defined inside
 *    `@theme` are the destination, not a violation.)
 *  - `spacing`: numeric CSS literals with px/rem/em units in non-token positions
 *    inside CSS files (excluding 0, 1px borders, and inside `@theme`).
 *
 * Scans the same CSS sources as animation-coverage.mjs.
 * Output: writes `.theme-coverage.json`; prints `colors=<n> spacing=<m>`.
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const EXCLUDED_DIRS = new Set([
    'node_modules', '.next', 'dist', 'storybook-static', 'coverage',
    'appwrapper', 'auth', 'dynamic-form', 'next-log', 'zod2gql',
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

// Strip @theme { ... } blocks (token definitions are the destination, not a violation).
function stripThemeBlocks(text) {
    return text.replace(/@theme[^{]*\{[\s\S]*?\n\}/g, '');
}

// Strip CSS comments to avoid false positives in docs.
function stripComments(text) {
    return text.replace(/\/\*[\s\S]*?\*\//g, '');
}

const COLOR_RE = /#[0-9a-fA-F]{3,8}\b|\b(?:rgb|rgba|hsl|hsla)\s*\(/g;
// Match spacing literals: <number><unit>, excluding 0 and 1px commonly-used border.
const SPACING_RE = /(?<![\w-])(?!0(?:px|rem|em|\b))(\d+(?:\.\d+)?)(px|rem|em)\b/g;

let colors = 0;
let spacing = 0;
const perFile = {};

for (const path of sources) {
    const raw = readFileSync(path, 'utf8');
    const text = stripComments(stripThemeBlocks(raw));
    const c = (text.match(COLOR_RE) ?? []).length;
    let s = 0;
    let m;
    SPACING_RE.lastIndex = 0;
    while ((m = SPACING_RE.exec(text)) !== null) {
        const n = parseFloat(m[1]);
        const unit = m[2];
        if (unit === 'px' && n === 1) continue; // 1px borders are conventional
        if (n === 0) continue;
        s++;
    }
    colors += c;
    spacing += s;
    if (c || s) perFile[relative(process.cwd(), path)] = { colors: c, spacing: s };
}

const report = {
    generatedAt: new Date().toISOString(),
    sources: sources.map((p) => relative(process.cwd(), p)),
    colors,
    spacing,
    perFile,
};

writeFileSync('.theme-coverage.json', JSON.stringify(report, null, 2) + '\n');
console.log(`colors=${colors} spacing=${spacing}`);
