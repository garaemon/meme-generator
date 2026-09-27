import { test, expect, Page } from '@playwright/test';

// New text objects are placed with their top-left corner at (width/4, height/4).
async function clickNewTextPosition(page: Page) {
  const box = await page.locator('canvas').nth(1).boundingBox();
  if (!box) {
    throw new Error('Canvas is not visible');
  }
  await page.mouse.click(box.x + box.width / 4 + 5, box.y + box.height / 4 + 5);
}

test.describe('Undo and Redo', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByText('Two Buttons').click();
    await expect(page.getByText('Editor Tools')).toBeVisible();
  });

  test('should disable undo before any edit', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Undo' })).toBeDisabled();
  });

  test('should revert text content when undo clicked', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Text' }).click();
    const textInput = page.locator('input[type="text"]');
    await textInput.fill('Changed Text');

    await page.getByRole('button', { name: 'Undo' }).click();
    await clickNewTextPosition(page);

    await expect(textInput).toHaveValue('New Text');
  });

  test('should remove added text when undo clicked', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Text' }).click();

    await page.getByRole('button', { name: 'Undo' }).click();
    await clickNewTextPosition(page);

    await expect(page.getByText('Select a text object to edit its properties.')).toBeVisible();
  });

  test('should restore removed text when redo clicked', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Text' }).click();
    await page.getByRole('button', { name: 'Undo' }).click();

    await page.getByRole('button', { name: 'Redo' }).click();
    await clickNewTextPosition(page);

    await expect(page.locator('input[type="text"]')).toHaveValue('New Text');
  });
});
