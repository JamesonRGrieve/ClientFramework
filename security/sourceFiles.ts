// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * The source the security scans read, walked and read once per test file instead of once per
 * scan: several scans assert over every file, some once per header or pattern, and on a network
 * mount each read is a round trip.
 */
import { readdirSync, readFileSync } from 'fs';
import { basename, join } from 'path';
import { SOURCE_ROOTS } from './sourceRoots';

const SKIPPED_DIRECTORIES: ReadonlySet<string> = new Set(['node_modules', '.next']);
const SCRIPT_EXTENSIONS = ['.ts', '.tsx'];

const filesByRoot = new Map<string, readonly string[]>();
const textByPath = new Map<string, string>();

function walk(dir: string): string[] {
  try {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      if (SKIPPED_DIRECTORIES.has(entry.name)) {
        return [];
      }
      const full = join(dir, entry.name);
      return entry.isDirectory() ? walk(full) : [full];
    });
  } catch {
    // A root that doesn't exist (an app without that directory) has no files.
    return [];
  }
}

/** Every file under `root`, without node_modules and .next. */
export function filesUnder(root: string): readonly string[] {
  const cached = filesByRoot.get(root);
  if (cached !== undefined) {
    return cached;
  }
  const files = walk(root);
  filesByRoot.set(root, files);
  return files;
}

/** The text of `path`. */
export function sourceText(path: string): string {
  const cached = textByPath.get(path);
  if (cached !== undefined) {
    return cached;
  }
  const text = readFileSync(path, 'utf8');
  textByPath.set(path, text);
  return text;
}

const isScript = (path: string): boolean => SCRIPT_EXTENSIONS.some((extension) => path.endsWith(extension));
const isTestOrStory = (path: string): boolean => {
  const name = basename(path);
  return name.includes('.test.') || name.includes('.stories.');
};

/** The .ts and .tsx files under `roots`, tests and stories included. */
export const scriptFiles = (roots: readonly string[] = SOURCE_ROOTS): string[] =>
  roots.flatMap((root) => filesUnder(root)).filter(isScript);

/**
 * Reads every script under `roots` into the cache before any test starts, so the scans' timed
 * bodies only search strings: a loaded mount then slows setup rather than timing out a scan.
 */
export function preloadSources(roots: readonly string[] = SOURCE_ROOTS): void {
  scriptFiles(roots).forEach(sourceText);
}

/** The application's .ts and .tsx files under `roots`: no tests, no stories. */
export const applicationSources = (roots: readonly string[] = SOURCE_ROOTS): string[] =>
  scriptFiles(roots).filter((path) => !isTestOrStory(path));

/** Whether `path` opts into the client bundle with a `'use client'` directive (either quote). */
export const isClientComponent = (path: string): boolean => {
  const text = sourceText(path);
  return text.includes("'use client'") || text.includes('"use client"');
};

/** The application's client components under `roots`. */
export const clientComponents = (roots: readonly string[] = SOURCE_ROOTS): string[] =>
  applicationSources(roots).filter(isClientComponent);
