#!/usr/bin/env node
/**
 * knip ratchet. Runs `knip --reporter json` and tallies issue counts across
 * categories. Per-category counts cannot rise. When a category reaches 0 it
 * auto-flips to "strict mode": further occurrences in that category are a
 * hard fail with no `--update` escape.
 *
 * Baseline file: .knip-baseline (JSON).
 */
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const BASELINE = resolve(process.cwd(), '.knip-baseline');
const args = new Set(process.argv.slice(2));
const updateMode = args.has('--update');

const CATEGORIES = [
    'files',
    'dependencies',
    'devDependencies',
    'optionalPeerDependencies',
    'unlisted',
    'unresolved',
    'binaries',
    'exports',
    'types',
    'enumMembers',
    'classMembers',
    'duplicates',
    'namespaceMembers',
];

let raw = '';
try {
    raw = execSync('./node_modules/.bin/knip --reporter json', {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        maxBuffer: 128 * 1024 * 1024,
    });
} catch (err) {
    raw = err.stdout?.toString() ?? '';
}

let report;
try {
    report = JSON.parse(raw);
} catch (e) {
    console.error('[knip-ratchet] could not parse knip JSON output:');
    console.error(raw.slice(0, 500));
    process.exit(2);
}

const counts = Object.fromEntries(CATEGORIES.map((c) => [c, 0]));
const issues = Array.isArray(report?.issues) ? report.issues : [];
for (const item of issues) {
    for (const cat of CATEGORIES) {
        const v = item[cat];
        if (Array.isArray(v)) counts[cat] += v.length;
    }
}

const baseExists = existsSync(BASELINE);
const prior = baseExists ? JSON.parse(readFileSync(BASELINE, 'utf8')) : null;
const priorCounts = prior?.counts ?? {};
const priorStrict = new Set(Array.isArray(prior?.strict) ? prior.strict : []);

const strict = new Set(priorStrict);
const newlyStrict = [];
for (const cat of CATEGORIES) {
    if (counts[cat] === 0 && !strict.has(cat)) {
        strict.add(cat);
        newlyStrict.push(cat);
    }
}

const strictViolations = [];
for (const cat of [...strict].sort()) {
    if ((counts[cat] ?? 0) > 0) strictViolations.push(`${cat}: ${counts[cat]} (strict — must be 0)`);
}

if (strictViolations.length) {
    console.error('[knip-ratchet] STRICT-MODE VIOLATION:');
    for (const v of strictViolations) console.error('  ' + v);
    console.error('Fix the new occurrences. `--update` will NOT silence this.');
    process.exit(1);
}

const out = {
    strict: [...strict].sort(),
    totals: { total: Object.values(counts).reduce((a, b) => a + b, 0) },
    counts: Object.fromEntries(CATEGORIES.map((c) => [c, counts[c]])),
};
const serialized = JSON.stringify(out, null, 2) + '\n';

if (updateMode) {
    writeFileSync(BASELINE, serialized, 'utf8');
    console.log('[knip-ratchet] baseline updated. counts:', counts);
    if (strict.size) console.log(`[knip-ratchet] strict categories: ${[...strict].sort().join(', ')}`);
    process.exit(0);
}

if (!baseExists) {
    writeFileSync(BASELINE, serialized, 'utf8');
    console.log('[knip-ratchet] baseline file missing — initialised. counts:', counts);
    process.exit(0);
}

const failures = [];
for (const cat of CATEGORIES) {
    if (strict.has(cat)) continue;
    const c = counts[cat] ?? 0;
    const b = priorCounts[cat] ?? 0;
    if (c > b) failures.push(`${cat}: ${b} -> ${c} (+${c - b})`);
}

if (failures.length) {
    console.error('[knip-ratchet] FAIL:');
    for (const f of failures) console.error('  ' + f);
    console.error('Either fix the new occurrences or, if intentional, run: npm run knip:ratchet:update');
    process.exit(1);
}

if (newlyStrict.length) {
    writeFileSync(BASELINE, serialized, 'utf8');
    console.log(`[knip-ratchet] GRADUATED to strict (count reached 0): ${newlyStrict.join(', ')}`);
}
console.log('[knip-ratchet] OK.');
process.exit(0);
