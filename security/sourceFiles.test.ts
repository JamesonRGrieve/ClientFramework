// SPDX-License-Identifier: AGPL-3.0-or-later
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterAll, describe, expect, it } from 'vitest';
import { applicationSources, filesUnder, preloadSources, scriptFiles, sourceText } from './sourceFiles';

const PAGE = 'app/page.tsx';
const API = 'lib/api.ts';
const API_TEST = 'lib/api.test.ts';
const STORY = 'lib/Card.stories.tsx';
const NOTES = 'lib/notes.md';
const API_TEXT = 'export const api = 1;';
const CHANGED = 'changed';

const root = mkdtempSync(join(tmpdir(), 'security-source-'));
const write = (file: string, text: string): void => {
  const path = join(root, file);
  mkdirSync(join(path, '..'), { recursive: true });
  writeFileSync(path, text);
};
write(PAGE, 'export default 1;');
write(API, API_TEXT);
write(API_TEST, 'test');
write(STORY, 'story');
write(NOTES, 'notes');
write('node_modules/dep/index.ts', 'dependency');
write('.next/server/page.js', 'built');

afterAll(() => {
  rmSync(root, { recursive: true, force: true });
});

const relative = (paths: readonly string[]): string[] => paths.map((path) => path.slice(root.length + 1)).sort();

describe('the security scans’ source files', () => {
  it('walks a root once, leaving out node_modules and .next', () => {
    const files = filesUnder(root);
    expect(relative(files)).toEqual([PAGE, STORY, API_TEST, API, NOTES]);
    expect(filesUnder(root)).toBe(files);
  });

  it('has no files under a root that does not exist', () => {
    expect(filesUnder(join(root, 'missing'))).toEqual([]);
  });

  it('keeps the scripts, and the application’s without tests and stories', () => {
    expect(relative(scriptFiles([root]))).toEqual([PAGE, STORY, API_TEST, API]);
    expect(relative(applicationSources([root]))).toEqual([PAGE, API]);
  });

  it('reads a file once and serves it from then on', () => {
    expect(sourceText(join(root, API))).toBe(API_TEXT);
    write(API, CHANGED);
    expect(sourceText(join(root, API))).toBe(API_TEXT);
  });

  it('preloads every script under the roots, and only scripts', () => {
    const view = 'preload/view.tsx';
    const readme = 'preload/readme.md';
    write(view, 'view');
    write(readme, 'readme');
    preloadSources([join(root, 'preload')]);
    write(view, CHANGED);
    write(readme, CHANGED);
    expect(sourceText(join(root, view))).toBe('view');
    expect(sourceText(join(root, readme))).toBe(CHANGED);
  });
});
