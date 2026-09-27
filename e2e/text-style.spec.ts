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

// Two Buttons is portrait, so the canvas narrows once the template loads.
// Adding text earlier places it relative to the initial square canvas.
async function openTwoButtonsTemplate(page: Page) {
  await page.goto('/');
  await page.getByText('Two Buttons').click();
  const canvas = page.locator('canvas').nth(1);
  await expect.poll(async () => (await canvas.boundingBox())?.width ?? 600).toBeLessThan(600);
}

test.describe('Text styling', () => {
  test.beforeEach(async ({ page }) => {
    await openTwoButtonsTemplate(page);
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
    await openTwoButtonsTemplate(page);
    await page.getByRole('button', { name: 'Add Text' }).click();
  });

  test('should keep right alignment after reselecting text', async ({ page }) => {
    await page.getByRole('button', { name: 'Align right' }).click();

    await reselectNewText(page);

    await expect(page.getByRole('button', { name: 'Align right' })).toHaveAttribute('aria-pressed', 'true');
  });
});

test.describe('All caps', () => {
  test.beforeEach(async ({ page }) => {
    await openTwoButtonsTemplate(page);
    await page.getByRole('button', { name: 'Add Text' }).click();
  });

  test('should uppercase existing text when all caps checked', async ({ page }) => {
    await page.getByLabel('All caps').check();

    await expect(page.getByLabel('Text Content')).toHaveValue('NEW TEXT');
  });

  test('should uppercase typed text while all caps checked', async ({ page }) => {
    await page.getByLabel('All caps').check();

    await page.getByLabel('Text Content').fill('such meme');

    await expect(page.getByLabel('Text Content')).toHaveValue('SUCH MEME');
  });

  test('should uppercase text typed directly on the canvas', async ({ page }) => {
    await page.getByLabel('All caps').check();
    const box = await page.locator('canvas').nth(1).boundingBox();
    if (!box) {
      throw new Error('Canvas is not visible');
    }

    await page.mouse.dblclick(box.x + box.width / 4 + 5, box.y + box.height / 4 + 5);
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.type('wow');

    await expect(page.getByLabel('Text Content')).toHaveValue('WOW');
  });

  test('should keep all caps after reselecting text', async ({ page }) => {
    await page.getByLabel('All caps').check();

    await reselectNewText(page);

    await expect(page.getByLabel('All caps')).toBeChecked();
  });
});
