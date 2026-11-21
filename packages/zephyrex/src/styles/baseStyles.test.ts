// SPDX-License-Identifier: AGPL-3.0-or-later
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// The stylesheet as text, from wherever Vitest runs (as themeContrast.test reads it).
const css = existsSync('src/styles/zephyrex.css')
  ? readFileSync('src/styles/zephyrex.css', 'utf8')
  : readFileSync('packages/zephyrex/src/styles/zephyrex.css', 'utf8');

/** The `@layer base { … }` blocks, by brace matching. */
function baseLayers(text: string): string[] {
  const blocks: string[] = [];
  let from = text.indexOf('@layer base {');
  while (from !== -1) {
    let depth = 0;
    let at = text.indexOf('{', from);
    const start = at;
    for (; at < text.length; at += 1) {
      if (text[at] === '{') {
        depth += 1;
      } else if (text[at] === '}') {
        depth -= 1;
      }
      if (depth === 0) {
        break;
      }
    }
    blocks.push(text.slice(start, at + 1));
    from = text.indexOf('@layer base {', at);
  }
  return blocks;
}

describe('the base styles', () => {
  it('give a plain grid one shrinkable column, at zero specificity, so grid-cols-* still win', () => {
    const rule = /:where\(\.grid\)\s*{\s*grid-template-columns:\s*minmax\(0,\s*1fr\);\s*}/;
    expect(baseLayers(css).some((block) => rule.test(block))).toBe(true);
    // Nowhere outside a base layer, where it would beat Tailwind's utilities.
    expect(css.match(/:where\(\.grid\)/g)).toHaveLength(1);
  });
});
