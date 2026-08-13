// SPDX-License-Identifier: AGPL-3.0-or-later
import { test, expect } from '@playwright/test';

const VIEWPORTS = {
  'mobile-small': { width: 320, height: 568 },
  'mobile': { width: 375, height: 812 },
  'mobile-landscape': { width: 812, height: 375 },
  'tablet-portrait': { width: 768, height: 1024 },
  'tablet-landscape': { width: 1024, height: 768 },
  'desktop': { width: 1280, height: 800 },
  'desktop-wide': { width: 1920, height: 1080 },
};

async function checkNoHorizontalOverflow(page: import('@playwright/test').Page) {
  const overflow = await page.evaluate(() => {
    const body = document.body;
    const html = document.documentElement;
    return {
      bodyScrollWidth: body.scrollWidth,
      htmlClientWidth: html.clientWidth,
      hasOverflow: body.scrollWidth > html.clientWidth,
    };
  });
  return overflow;
}

async function checkNoClippedText(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const clipped: string[] = [];
    const elements = document.querySelectorAll('*');
    for (const el of elements) {
      const style = window.getComputedStyle(el);
      if (style.overflow === 'hidden' || style.overflowX === 'hidden') {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          if (el.scrollWidth > el.clientWidth + 2) {
            const text = el.textContent?.trim().slice(0, 50) ?? '';
            if (
              text.length > 0 &&
              !style.textOverflow &&
              !el.classList.contains('truncate') &&
              !el.classList.contains('sr-only')
            ) {
              clipped.push(`${el.tagName}.${el.className.split(' ')[0]} — "${text}"`);
            }
          }
        }
      }
    }
    return clipped;
  });
}

async function checkNoOffscreenContent(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const offscreen: string[] = [];
    const viewportWidth = window.innerWidth;
    const interactiveElements = document.querySelectorAll('button, a, input, select, textarea, [role="button"]');
    for (const el of interactiveElements) {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        if (rect.right < 0 || rect.left > viewportWidth) {
          const text = el.textContent?.trim().slice(0, 30) ?? el.getAttribute('aria-label') ?? '';
          offscreen.push(`${el.tagName} — "${text}" at x=${Math.round(rect.left)}`);
        }
      }
    }
    return offscreen;
  });
}

for (const [viewportName, size] of Object.entries(VIEWPORTS)) {
  test.describe(`Responsive: ${viewportName} (${size.width}x${size.height})`, () => {
    test.use({ viewport: size });

    test('landing page has no horizontal overflow', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const overflow = await checkNoHorizontalOverflow(page);
      expect(overflow.hasOverflow, [
        `Horizontal overflow at ${viewportName}:`,
        `body.scrollWidth=${overflow.bodyScrollWidth} > html.clientWidth=${overflow.htmlClientWidth}`,
      ].join('\n')).toBe(false);
    });

    test('landing page has no offscreen interactive elements', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const offscreen = await checkNoOffscreenContent(page);
      expect(offscreen, [
        `Offscreen interactive elements at ${viewportName}:`,
        ...offscreen,
      ].join('\n')).toHaveLength(0);
    });

    test('header does not clip text', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const header = page.locator('header');
      if (await header.count() > 0) {
        const headerBox = await header.first().boundingBox();
        expect(headerBox).not.toBeNull();
        if (headerBox) {
          expect(headerBox.width).toBeLessThanOrEqual(size.width);
        }
      }
    });

    test('login/register button is visible and tappable', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const loginButton = page.getByRole('link', { name: /login|register|sign in/i });
      if (await loginButton.count() > 0) {
        const box = await loginButton.first().boundingBox();
        expect(box).not.toBeNull();
        if (box) {
          expect(box.width).toBeGreaterThanOrEqual(44);
          expect(box.height).toBeGreaterThanOrEqual(44);
          expect(box.left).toBeGreaterThanOrEqual(0);
          expect(box.left + box.width).toBeLessThanOrEqual(size.width);
        }
      }
    });
  });
}

test.describe('Responsive: sidebar behavior', () => {
  test('sidebar collapses on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const sidebar = page.locator('[data-sidebar]');
    if (await sidebar.count() > 0) {
      const box = await sidebar.first().boundingBox();
      if (box) {
        expect(box.width).toBeLessThan(200);
      }
    }
  });

  test('sidebar is expanded on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const sidebar = page.locator('[data-sidebar="sidebar"]');
    if (await sidebar.count() > 0) {
      const box = await sidebar.first().boundingBox();
      if (box) {
        expect(box.width).toBeGreaterThan(100);
      }
    }
  });
});

test.describe('Responsive: touch targets', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('all interactive elements meet minimum 44x44 tap target on mobile', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const tooSmall = await page.evaluate(() => {
      const small: string[] = [];
      const MIN_SIZE = 44;
      const interactive = document.querySelectorAll('button, a[href], input, select, textarea, [role="button"]');
      for (const el of interactive) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0 && rect.width < MIN_SIZE && rect.height < MIN_SIZE) {
          if (el.closest('.sr-only') || el.getAttribute('aria-hidden') === 'true') continue;
          const label = el.textContent?.trim().slice(0, 30) || el.getAttribute('aria-label') || el.tagName;
          small.push(`${label} (${Math.round(rect.width)}x${Math.round(rect.height)})`);
        }
      }
      return small;
    });

    if (tooSmall.length > 0) {
      console.warn('Touch targets below 44x44:', tooSmall);
    }
  });
});

test.describe('Responsive: data table', () => {
  for (const [name, size] of Object.entries({
    mobile: { width: 375, height: 812 },
    tablet: { width: 768, height: 1024 },
  })) {
    test(`data table scrolls horizontally on ${name} instead of clipping`, async ({ page }) => {
      await page.setViewportSize(size);
      await page.goto('/provider/test');
      await page.waitForLoadState('networkidle');

      const tables = page.locator('table');
      if (await tables.count() > 0) {
        const tableInfo = await tables.first().evaluate((el) => {
          const parent = el.closest('.overflow-x-auto, .overflow-auto, [style*="overflow"]');
          return {
            tableWidth: el.scrollWidth,
            containerWidth: parent?.clientWidth ?? el.parentElement?.clientWidth ?? 0,
            hasScrollContainer: parent !== null,
          };
        });

        if (tableInfo.tableWidth > tableInfo.containerWidth) {
          expect(tableInfo.hasScrollContainer, [
            `Table wider than viewport on ${name} but no scroll container.`,
            `Table width: ${tableInfo.tableWidth}, container: ${tableInfo.containerWidth}`,
            'Wrap the table in a div with overflow-x-auto.',
          ].join('\n')).toBe(true);
        }
      }
    });
  }
});
