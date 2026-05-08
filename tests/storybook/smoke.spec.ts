import { expect, test } from '@playwright/test';

test('storybook index loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Storybook/i);
});
