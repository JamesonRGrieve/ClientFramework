#!/usr/bin/env node
/**
 * dependency-cruiser ratchet. Runs `depcruise --output-type json src` and
 * tallies violation counts per rule name. Per-rule counts cannot rise. When
 * a rule's count reaches 0 it auto-flips to strict.
 *
 * Baseline file: .depcruise-baseline (JSON).
 */
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const BASELINE = resolve(process.cwd(), '.depcruise-baseline');
const args = new Set(process.argv.slice(2));
const updateMode = args.has('--update');

let raw = '';
try {
    raw = execSync(
        './node_modules/.bin/depcruise --config .dependency-cruiser.cjs --output-type json src',
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 256 * 1024 * 1024 },
    );
} catch (err) {
    raw = err.stdout?.toString() ?? '';
}

let report;
try {
    report = JSON.parse(raw);
} catch (e) {
    console.error('[depcruise-ratchet] could not parse depcruise JSON:');
    console.error(raw.slice(0, 500));
    process.exit(2);
}

const byRule = {};
for (const mod of report.modules ?? []) {
    for (const dep of mod.dependencies ?? []) {
        for (const rule of dep.rules ?? []) {
            if (!rule?.name) continue;
            byRule[rule.name] = (byRule[rule.name] ?? 0) + 1;
        }
    }
    for (const rule of mod.rules ?? []) {
        if (!rule?.name) continue;
        byRule[rule.name] = (byRule[rule.name] ?? 0) + 1;
    }
}

const baseExists = existsSync(BASELINE);
const prior = baseExists ? JSON.parse(readFileSync(BASELINE, 'utf8')) : null;
const priorByRule = prior?.byRule ?? {};
const priorStrict = new Set(Array.isArray(prior?.strict) ? prior.strict : []);

const strict = new Set(priorStrict);
const newlyStrict = [];
const allRules = new Set([...Object.keys(byRule), ...Object.keys(priorByRule)]);
for (const rule of allRules) {
    const count = byRule[rule] ?? 0;
    if (count === 0 && !strict.has(rule)) {
        strict.add(rule);
        newlyStrict.push(rule);
    }
}

const strictViolations = [];
for (const rule of [...strict].sort()) {
    if ((byRule[rule] ?? 0) > 0) strictViolations.push(`${rule}: ${byRule[rule]} (strict — must be 0)`);
}

if (strictViolations.length) {
    console.error('[depcruise-ratchet] STRICT-MODE VIOLATION:');
    for (const v of strictViolations) console.error('  ' + v);
    process.exit(1);
}

const out = {
    strict: [...strict].sort(),
    totals: { totalViolations: Object.values(byRule).reduce((a, b) => a + b, 0) },
    byRule: Object.fromEntries(Object.keys(byRule).sort().map((r) => [r, byRule[r]])),
};
const serialized = JSON.stringify(out, null, 2) + '\n';

if (updateMode) {
    writeFileSync(BASELINE, serialized, 'utf8');
    console.log('[depcruise-ratchet] baseline updated. Total violations:', out.totals.totalViolations);
    process.exit(0);
}

if (!baseExists) {
    writeFileSync(BASELINE, serialized, 'utf8');
    console.log('[depcruise-ratchet] baseline file missing — initialised. Total violations:', out.totals.totalViolations);
    process.exit(0);
}

const failures = [];
for (const rule of Object.keys(byRule)) {
    if (strict.has(rule)) continue;
    const c = byRule[rule];
    const b = priorByRule[rule] ?? null;
    if (b === null) continue;
    if (c > b) failures.push(`${rule}: ${b} -> ${c} (+${c - b})`);
}

if (failures.length) {
    console.error('[depcruise-ratchet] FAIL:');
    for (const f of failures) console.error('  ' + f);
    process.exit(1);
}

const brandNew = Object.keys(byRule).filter((r) => !(r in priorByRule));
if (newlyStrict.length || brandNew.length) {
    writeFileSync(BASELINE, serialized, 'utf8');
}
console.log('[depcruise-ratchet] OK.');
process.exit(0);
