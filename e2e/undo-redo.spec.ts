import { test, expect, Page } from '@playwright/test';

// New text objects are placed with their top-left corner at (width/4, height/4).
async function clickNewTextPosition(page: Page) {
  const box = await page.locator('canvas').nth(1).boundingBox();
  if (!box) {
    throw new Error('Canvas is not visible');
  }
  await page.mouse.click(box.x + box.width / 4 + 5, box.y + box.height / 4 + 5);
}

// Drags a selection rectangle from the top-left corner over the new texts.
async function selectTextsByDragging(page: Page) {
  const box = await page.locator('canvas').nth(1).boundingBox();
  if (!box) {
    throw new Error('Canvas is not visible');
  }
  await page.mouse.move(box.x + 2, box.y + 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 4 + 20, box.y + box.height / 4 + 20, { steps: 5 });
  await page.mouse.up();
}

test.describe('Undo and Redo', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByText('Two Buttons').click();
    // Two Buttons is portrait, so the canvas narrows once the template loads.
    // Adding text earlier places it relative to the initial square canvas.
    const canvas = page.locator('canvas').nth(1);
    await expect.poll(async () => (await canvas.boundingBox())?.width ?? 600).toBeLessThan(600);
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

  test('should coalesce typed characters into one undo step', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Text' }).click();
    const textInput = page.locator('input[type="text"]');
    // Typing over a selection avoids a separate clearing edit, which could
    // land in its own step if it ran more than the debounce before typing.
    await textInput.press('ControlOrMeta+a');
    await textInput.pressSequentially('abc');

    await page.getByRole('button', { name: 'Undo' }).click();

    await expect(textInput).toHaveValue('New Text');
  });

  test('should keep text selected after undo', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Text' }).click();
    const textInput = page.locator('input[type="text"]');
    await textInput.fill('Changed Text');

    await page.getByRole('button', { name: 'Undo' }).click();

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

  test('should remove added text when ctrl+z pressed', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Text' }).click();

    await page.keyboard.press('ControlOrMeta+z');
    await clickNewTextPosition(page);

    await expect(page.getByText('Select a text object to edit its properties.')).toBeVisible();
  });

  test('should delete all texts in a drag selection when delete pressed', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Text' }).click();
    await page.getByRole('button', { name: 'Add Text' }).click();
    await selectTextsByDragging(page);

    await page.keyboard.press('Delete');
    await clickNewTextPosition(page);

    await expect(page.getByText('Select a text object to edit its properties.')).toBeVisible();
  });

  test('should restore all deleted texts with one undo', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Text' }).click();
    await page.getByRole('button', { name: 'Add Text' }).click();
    await selectTextsByDragging(page);
    await page.keyboard.press('Delete');

    await page.getByRole('button', { name: 'Undo' }).click();
    await clickNewTextPosition(page);

    await expect(page.locator('input[type="text"]')).toHaveValue('New Text');
  });

  test('should delete selected text when delete pressed', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Text' }).click();

    await page.keyboard.press('Delete');
    await clickNewTextPosition(page);

    await expect(page.getByText('Select a text object to edit its properties.')).toBeVisible();
  });
});
