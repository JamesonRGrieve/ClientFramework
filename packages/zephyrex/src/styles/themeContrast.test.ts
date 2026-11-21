// SPDX-License-Identifier: AGPL-3.0-or-later
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// The stylesheet as text, from wherever Vitest runs (this package or the repo root). Not imported:
// an import of it (even with `?raw`) arrived empty under this package's Vitest setup.
const css = existsSync('src/styles/zephyrex.css')
  ? readFileSync('src/styles/zephyrex.css', 'utf8')
  : readFileSync('packages/zephyrex/src/styles/zephyrex.css', 'utf8');

/** The four themes a person can choose (useTheme), each a block of HSL tokens in zephyrex.css. */
const THEMES = [':root', '.dark', '.colorblind', '.colorblind-dark'] as const;
/** WCAG 2.1 1.4.11: a control's edge and state against what is next to it. */
const NON_TEXT = 3;

/** A theme's tokens: the last block for that selector that sets --background (the colour tokens). */
function tokensOf(selector: string): Map<string, string> {
  const blocks = [...css.matchAll(/^\s*([:.][\w-]+)\s*{([^}]*)}/gm)].filter(
    (block) => block[1] === selector && block[2].includes('--background:'),
  );
  const body = blocks.at(-1)?.[2] ?? '';
  return new Map([...body.matchAll(/--([\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
}

/** Relative luminance of an `h s% l%` token (WCAG 2.1). */
function luminance(token: string): number {
  const [h = 0, s = 0, l = 0] = token.replaceAll('%', '').split(/\s+/).map(Number);
  const k = (n: number): number => (n + h / 30) % 12;
  const a = (s / 100) * Math.min(l / 100, 1 - l / 100);
  const channel = (n: number): number => {
    const c = l / 100 - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
    return c <= 0.039_28 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(0) + 0.7152 * channel(8) + 0.0722 * channel(4);
}

function contrast(one: string, other: string): number {
  const [hi, lo] = [luminance(one), luminance(other)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe('theme contrast for controls', () => {
  it.each(THEMES)('%s: an off switch (muted foreground) and an on one (primary) stand out from the page', (theme) => {
    const tokens = tokensOf(theme);
    const background = tokens.get('background') ?? '';
    expect(background).not.toBe('');
    expect(contrast(tokens.get('muted-foreground') ?? '', background)).toBeGreaterThanOrEqual(NON_TEXT);
    expect(contrast(tokens.get('primary') ?? '', background)).toBeGreaterThanOrEqual(NON_TEXT);
  });

  it('measures as WCAG does: black on white is 21:1', () => {
    expect(contrast('0 0% 0%', '0 0% 100%')).toBeCloseTo(21, 5);
  });
});
