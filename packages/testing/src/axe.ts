// SPDX-License-Identifier: AGPL-3.0-or-later
import { AxeBuilder } from '@axe-core/playwright';
import type { BrowserContext, Page } from '@playwright/test';

/** The WCAG levels every Zephyrex app is held to: 2.0 and 2.1, A and AA. */
export const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] as const;

export type Theme = 'light' | 'dark';

/** What `violations` needs of an axe run: the tags, then the results' violations. */
export interface AxeRun {
  withTags: (tags: string[]) => AxeRun;
  analyze: () => Promise<{ violations: { id: string; help: string; nodes: { target: unknown[]; html: string }[] }[] }>;
}

/** All `violations` asks of a page itself: whether its <html> carries the `dark` class. */
export interface ThemeProbe {
  evaluate: (check: () => boolean) => Promise<boolean>;
}

/** Sets the framework's `theme` cookie for `url`, so the next page load renders in that theme. */
export async function withTheme(context: BrowserContext, theme: Theme, url: string): Promise<void> {
  await context.addCookies([{ name: 'theme', value: theme, url }]);
}

/**
 * The page's WCAG 2.1 A and AA violations, one line each, after checking the page really is in
 * `theme` (the framework puts `dark` on <html>), so a pass can't come from the wrong theme. Each
 * failing element is named by its markup as well as its selector: a generated id alone
 * (#radix-_r_2_) names nothing. Expect `[]`: no rule is disabled and no element excluded.
 */
export async function violations(page: Page, theme: Theme): Promise<string[]>;
/** The same, with the axe run supplied (as a test does, with no browser). */
export async function violations(page: ThemeProbe, theme: Theme, axe: (page: ThemeProbe) => AxeRun): Promise<string[]>;
export async function violations(
  page: Page | ThemeProbe,
  theme: Theme,
  axe?: (page: ThemeProbe) => AxeRun,
): Promise<string[]> {
  const dark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
  if (dark !== (theme === 'dark')) {
    throw new Error(`The page is in the ${dark ? 'dark' : 'light'} theme, not ${theme}: set it with withTheme first.`);
  }
  const run = axe === undefined ? new AxeBuilder({ page: page as Page }) : axe(page);
  const results = await run.withTags([...WCAG_TAGS]).analyze();
  return results.violations.map(
    (violation) =>
      `${violation.id}: ${violation.help} (${violation.nodes.map((node) => `${node.target.map(String).join(' ')} ${node.html}`).join(', ')})`,
  );
}
