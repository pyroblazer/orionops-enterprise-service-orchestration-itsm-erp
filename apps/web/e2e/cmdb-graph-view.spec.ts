import { test, expect } from '@playwright/test';
import { injectMockAuth } from './helpers/auth';
import * as mocks from './helpers/api-mock';

test.describe('CMDB Graph View', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockAuth(page);
    await page.route('**/api/v1/cmdb**', async (route) => {
      await route.fulfill({ json: mocks.mockCMDB.list });
    });
  });

  test('should show List and Graph toggle tabs', async ({ page }) => {
    await page.goto('/cmdb', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('tab', { name: /list/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /graph/i })).toBeVisible();
  });

  test('should default to list view with CI table', async ({ page }) => {
    await page.goto('/cmdb', { waitUntil: 'domcontentloaded' });

    await expect(page.getByText('Production API Server')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('table')).toBeVisible();
  });

  test('should switch to graph view and show Relationship Graph heading', async ({ page }) => {
    await page.goto('/cmdb', { waitUntil: 'domcontentloaded' });

    await expect(page.getByText('Production API Server')).toBeVisible({ timeout: 15000 });
    await page.getByRole('tab', { name: /graph/i }).click();

    await expect(page.getByText(/relationship graph/i)).toBeVisible();
  });

  test('should show CI cards in graph view', async ({ page }) => {
    await page.goto('/cmdb', { waitUntil: 'domcontentloaded' });

    await expect(page.getByText('Production API Server')).toBeVisible({ timeout: 15000 });
    await page.getByRole('tab', { name: /graph/i }).click();

    await expect(page.getByText('Production API Server')).toBeVisible();
  });

  test('should show CI type badges in graph view', async ({ page }) => {
    await page.goto('/cmdb', { waitUntil: 'domcontentloaded' });

    await expect(page.getByText('Production API Server')).toBeVisible({ timeout: 15000 });
    await page.getByRole('tab', { name: /graph/i }).click();

    await expect(page.getByText('APPLICATION')).toBeVisible();
  });

  test('should navigate to CI detail on graph card click', async ({ page }) => {
    await page.route('**/api/v1/cmdb/ci-001**', async (route) => {
      await route.fulfill({ json: mocks.mockCMDB.detail });
    });

    await page.goto('/cmdb', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Production API Server')).toBeVisible({ timeout: 15000 });
    await page.getByRole('tab', { name: /graph/i }).click();

    await page.getByText('Production API Server').click();

    await page.waitForURL(/\/cmdb\/ci-001/, { timeout: 5000 });
  });
});
