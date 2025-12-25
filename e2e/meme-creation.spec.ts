import { test, expect } from '@playwright/test';

test.describe('Meme Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should create a meme from a fixed image template', async ({ page }) => {
    // 1. Select a specific template
    const templateName = 'Two Buttons';
    await page.getByText(templateName).click();

    // 2. Verify we are in the editor
    await expect(page.getByText('Editor Tools')).toBeVisible();

    // 3. Add text
    await page.getByRole('button', { name: 'Add Text' }).click();

    // 4. Edit text content
    const textInput = page.locator('input[type="text"]');
    await textInput.fill('Static Image Test');

    // 5. Download the meme
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
