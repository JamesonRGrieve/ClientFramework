#!/usr/bin/env node
/**
 * Supply-chain validator for pnpm-lock.yaml.
 *
 * Checks (line-by-line, no full YAML parser to keep the dep surface small):
 *   - Every `tarball:` URL uses HTTPS and resolves to an allow-listed host.
 *   - Every `repo:` URL uses git+ssh / git+https and resolves to an allow-listed host.
 *
 * Hard gate. No baseline.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const LOCK = resolve(process.cwd(), 'pnpm-lock.yaml');
if (!existsSync(LOCK)) {
    console.error('[lockfile-validate] missing pnpm-lock.yaml');
    process.exit(2);
}

const ALLOWED_HOSTS = new Set([
    'registry.npmjs.org',
    'codeload.github.com',
    'github.com',
    'api.github.com',
]);
const ALLOWED_SCHEMES = new Set(['https:', 'git+ssh:', 'git+https:']);

const lock = readFileSync(LOCK, 'utf8');
const violations = [];
let line = 0;
for (const rawLine of lock.split('\n')) {
    line++;
    const trimmed = rawLine.trim();

    const tarball = /^tarball:\s*(\S+)$/i.exec(trimmed);
    if (tarball) {
        let url;
        try {
            url = new URL(tarball[1]);
        } catch {
            violations.push(`${line}: tarball URL unparseable: ${tarball[1]}`);
            continue;
        }
        if (!ALLOWED_SCHEMES.has(url.protocol)) {
            violations.push(`${line}: tarball uses non-allowed scheme ${url.protocol} (${tarball[1]})`);
        }
        if (!ALLOWED_HOSTS.has(url.hostname)) {
            violations.push(`${line}: tarball host not in allow-list: ${url.hostname}`);
        }
    }

    const repo = /^repo:\s*(\S+)$/i.exec(trimmed);
    if (repo) {
        let url;
        try {
            url = new URL(repo[1]);
        } catch {
            violations.push(`${line}: repo URL unparseable: ${repo[1]}`);
            continue;
        }
        if (!ALLOWED_SCHEMES.has(url.protocol)) {
            violations.push(`${line}: repo uses non-allowed scheme ${url.protocol} (${repo[1]})`);
        }
        if (!ALLOWED_HOSTS.has(url.hostname)) {
            violations.push(`${line}: repo host not in allow-list: ${url.hostname}`);
        }
    }
}

if (violations.length) {
    console.error('[lockfile-validate] FAIL:');
    for (const v of violations) console.error('  ' + v);
    process.exit(1);
}

console.log(`[lockfile-validate] OK: pnpm-lock.yaml resolutions point at trusted hosts (${[...ALLOWED_HOSTS].join(', ')}).`);
process.exit(0);
