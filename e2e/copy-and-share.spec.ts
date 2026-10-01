import { test, expect } from '@playwright/test';

test.describe('Copy to clipboard', () => {
  test('should put a PNG on the clipboard when copy clicked', async ({ page, context, browserName }) => {
    test.skip(browserName !== 'chromium', 'Only Chromium lets Playwright grant clipboard permissions');
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/');
    await page.getByText('Two Buttons').click();
    await page.getByRole('button', { name: 'Add Text' }).click();

    await page.getByRole('button', { name: 'Copy' }).click();
    await expect(page.getByRole('button', { name: 'Copied!' })).toBeVisible();

    const clipboardTypes = await page.evaluate(async () => {
      const [clipboardItem] = await navigator.clipboard.read();
      return clipboardItem.types;
    });
    expect(clipboardTypes).toContain('image/png');
  });

  test('should hide copy button when editing a GIF', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Roll Safe (Thinking Guy)').click();

    await expect(page.getByRole('button', { name: 'Download GIF' })).toBeVisible();

    await expect(page.getByRole('button', { name: 'Copy' })).toHaveCount(0);
  });
});
