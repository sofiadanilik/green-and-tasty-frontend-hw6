import { test, expect } from '@playwright/test';

// The public smoke test always runs; no secrets or fixed reservation IDs.
test('@smoke live frontend: main page is accessible', async ({ page }) => {
  const response = await page.goto('/main');
  expect(response?.status()).toBeLessThan(400);
  await expect(page.locator('body')).toContainText('Green by nature, Georgian by heart.');
});

test('@smoke live frontend: menu page loads without a server error', async ({ page }) => {
  const response = await page.goto('/menu');
  expect(response?.status()).toBeLessThan(400);
  await expect(page.locator('body')).not.toContainText('Application error');
});
