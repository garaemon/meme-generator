import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the app title', async ({ page }) => {
    // Check if the title is visible on desktop
    const title = page.getByText('MemeGenerator');
    await expect(title).toBeVisible();
  });

  test('should have navigation items', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Gallery' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'History' })).toBeVisible();
  });

  test('should show gallery by default', async ({ page }) => {
    // Gallery should have some content or a heading
    await expect(page.getByRole('heading', { name: 'Template Gallery' })).toBeVisible();
  });

  test('should switch to history tab', async ({ page }) => {
    await page.getByRole('button', { name: 'History' }).click();
    // History should have some content or a message when empty
    await expect(page.getByRole('heading', { name: 'Creation History' }).or(page.getByText('No history yet'))).toBeVisible();
  });
});
