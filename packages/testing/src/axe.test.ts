// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it, vi } from 'vitest';
import { type AxeRun, type ThemeProbe, violations, WCAG_TAGS } from './axe';

/** A page whose <html> is or isn't dark, as far as `violations` asks. */
const pageIn = (dark: boolean): ThemeProbe => ({ evaluate: vi.fn().mockResolvedValue(dark) });

/** An axe run that reports what it's given, and records the tags it was asked for. */
function axeFinding(found: Awaited<ReturnType<AxeRun['analyze']>>['violations']): { run: () => AxeRun; tags: string[][] } {
  const tags: string[][] = [];
  const run = (): AxeRun => {
    const axe: AxeRun = {
      withTags: (asked) => {
        tags.push(asked);
        return axe;
      },
      analyze: vi.fn().mockResolvedValue({ violations: found }),
    };
    return axe;
  };
  return { run, tags };
}

describe('violations', () => {
  it('runs axe at WCAG 2.1 A and AA and names each failing element by its markup', async () => {
    const axe = axeFinding([
      {
        id: 'color-contrast',
        help: 'Elements must meet minimum color contrast ratio thresholds',
        nodes: [{ target: ['#radix-_r_2_'], html: '<span class="text-muted-foreground">Past</span>' }],
      },
    ]);
    const found = await violations(pageIn(true), 'dark', axe.run);
    expect(axe.tags).toEqual([[...WCAG_TAGS]]);
    expect(found).toEqual([
      'color-contrast: Elements must meet minimum color contrast ratio thresholds (#radix-_r_2_ <span class="text-muted-foreground">Past</span>)',
    ]);
  });

  it('passes a clean page', async () => {
    expect(await violations(pageIn(false), 'light', axeFinding([]).run)).toEqual([]);
  });

  it('refuses a page in the other theme, so a pass is never in the wrong one', async () => {
    await expect(violations(pageIn(false), 'dark', axeFinding([]).run)).rejects.toThrow('light theme, not dark');
  });
});
