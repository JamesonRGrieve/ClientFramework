# @zephyrex/testing

End-to-end test helpers every Zephyrex app shares, so each app's Playwright suite holds its pages to the same bar.

## The accessibility pass

```ts
import { violations, withTheme } from '@zephyrex/testing';

for (const theme of ['light', 'dark'] as const) {
  test(`the pages meet WCAG 2.1 AA in ${theme}`, async ({ page, context }) => {
    await withTheme(context, theme, APP_URL);
    for (const path of PAGES) {
      await page.goto(path);
      expect(await violations(page, theme), path).toEqual([]);
    }
  });
}
```

- `violations(page, theme)` runs axe at WCAG 2.0 and 2.1, A and AA, with no rule disabled and no element excluded. It first checks the page is in the theme under test (the framework's `dark` class on `<html>`), and names every failing element by its markup as well as its selector.
- `withTheme(context, theme, url)` sets the framework's `theme` cookie before the page loads.

`@axe-core/playwright` 4.11.0 and `@playwright/test` 1.63.0 are peer dependencies: the app's own pinned copies are used, so no second Playwright is installed.
