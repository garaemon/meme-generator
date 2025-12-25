import { test, expect } from '@playwright/test';

test.describe('Meme Creation Flow', () => {
  test('should create a meme and download it', async ({ page }) => {
    await page.goto('/');

    // 1. Select a template from gallery
    // Wait for images to load
    const galleryItems = page.locator('.grid > div');
    await expect(galleryItems.first()).toBeVisible();
    await galleryItems.first().click();

    // 2. Verify we are in the editor
    await expect(page.getByText('Editor Tools')).toBeVisible();

    // 3. Add text
    await page.getByRole('button', { name: 'Add Text' }).click();

    // 4. Edit text content
    const textInput = page.locator('input[type="text"]');
    await expect(textInput).toBeVisible();
    await textInput.fill('Playwright Test Meme');

    // 5. Change color (optional but good for testing interaction)
    const colorInput = page.locator('input[type="color"]').first();
    await colorInput.fill('#ff0000');

    // 6. Download the meme
    // Note: In some environments, we might need to mock the image/gif processing
    // but here we just check if the download is triggered.
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download Meme' }).click();
    const download = await downloadPromise;

    // Verify download filename
    expect(download.suggestedFilename()).toMatch(/^meme-\d+\.png$/);
  });
});
