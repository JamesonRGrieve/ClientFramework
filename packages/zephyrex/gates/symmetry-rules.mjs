// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * What the coverage-symmetry gate counts. One fixed list for every app (operator, 2026-11-20:
 * "Fixed exclusions"), so no app can widen it on its own.
 */

/**
 * Directories never walked: the app router, installs and build output, generated code, test setup
 * (`__tests__`) and story fixtures (`stories`), none of which has anything of its own to unit-test.
 */
export const SKIP_DIRS = new Set(['app', 'node_modules', 'dist', '__generated__', '__tests__', 'stories']);
export const STORY_RE = /\.stories\.(ts|tsx|mdx|js|jsx)$/;
export const TEST_RE = /\.test\.(ts|tsx|js|jsx)$/;
export const SOURCE_RE = /\.(ts|tsx)$/;

// Next.js root convention files (proxy/middleware/instrumentation) are not
// reusable components and get no story/test, same as the app/ dir (see §8).
const CONVENTION_RE = /(^|\/)(proxy|middleware|instrumentation)\.(ts|tsx)$/;
/** Type declarations and config files: nothing in them runs to be tested. */
const UNTESTABLE_RE = /(\.d\.ts|\.config\.ts)$/;

/**
 * Whether a file the walk found is a source that should have a test (and, if .tsx, a story).
 * @param {string} path
 * @returns {boolean}
 */
export function isMeasuredSource(path) {
  return (
    SOURCE_RE.test(path) &&
    !STORY_RE.test(path) &&
    !TEST_RE.test(path) &&
    !CONVENTION_RE.test(path) &&
    !UNTESTABLE_RE.test(path)
  );
}
