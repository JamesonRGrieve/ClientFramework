// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { isMeasuredSource, SKIP_DIRS } from '../packages/zephyrex/gates/symmetry-rules.mjs';

describe('coverage-symmetry rules', () => {
  it('counts ordinary sources', () => {
    expect(isMeasuredSource('src/lib/format.ts')).toBe(true);
    expect(isMeasuredSource('src/components/Card.tsx')).toBe(true);
  });

  it('leaves out what has nothing to unit-test', () => {
    for (const path of [
      'src/env.d.ts',
      'src/zephyrex.config.ts',
      'src/Card.test.tsx',
      'src/Card.stories.tsx',
      'src/middleware.ts',
    ]) {
      expect(isMeasuredSource(path), path).toBe(false);
    }
  });

  it('never walks test setup, story fixtures, the app router or generated code', () => {
    for (const dir of ['__tests__', 'stories', 'app', '__generated__', 'node_modules', 'dist']) {
      expect(SKIP_DIRS.has(dir), dir).toBe(true);
    }
    expect(SKIP_DIRS.has('lib')).toBe(false);
  });
});
