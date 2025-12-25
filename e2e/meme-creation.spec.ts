import { test, expect } from '@playwright/test';

test.describe('Meme Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should create a meme from a fixed image template with multiple texts', async ({ page }) => {
    // 1. Select a specific template
    const templateName = 'Two Buttons';
    await page.getByText(templateName).click();

    // 2. Verify we are in the editor
    await expect(page.getByText('Editor Tools')).toBeVisible();

    // 3. Add first text
    await page.getByRole('button', { name: 'Add Text' }).click();
    const textInput = page.locator('input[type="text"]');
    await expect(textInput).toHaveValue('New Text'); // Ensure it's selected and showing the default text
    await textInput.fill('First Text');

    // 4. Add second text
    await page.getByRole('button', { name: 'Add Text' }).click();
    await expect(textInput).toHaveValue('New Text');
    await textInput.fill('Second Text');

    // 5. Move the second text so we can click the first one
    // Both are added at width/4, height/4 by default.
    const canvas = page.locator('canvas').nth(1); // The first one might be a hidden one or from gallery
    const box = await canvas.boundingBox();
    if (box) {
      // Drag from center of the newly added text (width/4, height/4) to somewhere else
      const startX = box.x + box.width / 4;
      const startY = box.y + box.height / 4;
      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(startX + 100, startY + 100);
      await page.mouse.up();
      
      // Small delay to ensure Fabric.js state is updated
      await page.waitForTimeout(500);

      // 6. Click back at the original position to select the first text
      await page.mouse.click(startX, startY);
      
      // 7. Verify and re-edit the first text
      // We expect the input to be updated via selection:created/updated listeners
      await expect(textInput).toHaveValue('First Text');
      await textInput.fill('First Text Updated');
    }

    // 8. Download the meme
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download Meme' }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/^meme-\d+\.png$/);
  });

  test('should create a meme from a GIF template', async ({ page }) => {
    // 1. Select a GIF template
    const templateName = 'Roll Safe (Thinking Guy)';
    await page.getByText(templateName).click();

    // 2. Verify we are in the editor
    await expect(page.getByText('Editor Tools')).toBeVisible();

    // 3. Add text
    await page.getByRole('button', { name: 'Add Text' }).click();
    const textInput = page.locator('input[type="text"]');
    await textInput.fill('GIF Test');

    // 4. Download the GIF
    // GIF generation takes longer, so we increase the timeout for the download event
    const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
    await page.getByRole('button', { name: 'Download GIF' }).click();
    
    // Check if processing state is shown
    await expect(page.getByText('Generating GIF...')).toBeVisible();
    
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^meme-\d+\.gif$/);
  });
});
