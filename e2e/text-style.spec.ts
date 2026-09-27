import { test, expect, Page } from '@playwright/test';

// New text objects are placed with their top-left corner at (width/4, height/4).
async function reselectNewText(page: Page) {
  const box = await page.locator('canvas').nth(1).boundingBox();
  if (!box) {
    throw new Error('Canvas is not visible');
  }
  await page.mouse.click(box.x + 5, box.y + box.height - 5);
  await expect(page.getByText('Select a text object to edit its properties.')).toBeVisible();
  await page.mouse.click(box.x + box.width / 4 + 5, box.y + box.height / 4 + 5);
}

test.describe('Text styling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByText('Two Buttons').click();
    await page.getByRole('button', { name: 'Add Text' }).click();
  });

  test('should keep line breaks in text content', async ({ page }) => {
    await page.getByLabel('Text Content').fill('Line 1\nLine 2');

    await reselectNewText(page);

    await expect(page.getByLabel('Text Content')).toHaveValue('Line 1\nLine 2');
  });
});

test.describe('Text alignment', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByText('Two Buttons').click();
    await page.getByRole('button', { name: 'Add Text' }).click();
  });

  test('should keep right alignment after reselecting text', async ({ page }) => {
    await page.getByRole('button', { name: 'Align right' }).click();

    await reselectNewText(page);

    await expect(page.getByRole('button', { name: 'Align right' })).toHaveAttribute('aria-pressed', 'true');
  });
});
