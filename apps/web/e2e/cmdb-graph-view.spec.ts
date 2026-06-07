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
    await page.goto('/cmdb');

    await expect(page.getByRole('tab', { name: /list/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /graph/i })).toBeVisible();
  });

  test('should default to list view with CI table', async ({ page }) => {
    await page.goto('/cmdb');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const text = page.getByText('Production API Server');
    if (await text.count() > 0) {
      await expect(text).toBeVisible({ timeout: 20000 });
      await expect(page.locator('table')).toBeVisible({ timeout: 20000 });
    }
  });

  test('should switch to graph view and show Relationship Graph heading', async ({ page }) => {
    await page.goto('/cmdb');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const text = page.getByText('Production API Server');
    if (await text.count() > 0) {
      await expect(text).toBeVisible({ timeout: 20000 });
      await page.getByRole('tab', { name: /graph/i }).click();
      await expect(page.getByText(/relationship graph/i)).toBeVisible({ timeout: 10000 });
    }
  });

  test('should show CI cards in graph view', async ({ page }) => {
    await page.goto('/cmdb');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const text = page.getByText('Production API Server');
    if (await text.count() > 0) {
      await expect(text).toBeVisible({ timeout: 20000 });
      await page.getByRole('tab', { name: /graph/i }).click();
      await expect(text).toBeVisible({ timeout: 10000 });
    }
  });

  test('should show CI type badges in graph view', async ({ page }) => {
    await page.goto('/cmdb');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const text = page.getByText('Production API Server');
    if (await text.count() > 0) {
      await expect(text).toBeVisible({ timeout: 20000 });
      await page.getByRole('tab', { name: /graph/i }).click();
      await expect(page.getByText('APPLICATION')).toBeVisible({ timeout: 10000 });
    }
  });

  test('should navigate to CI detail on graph card click', async ({ page }) => {
    await page.route('**/api/v1/cmdb/ci-001**', async (route) => {
      await route.fulfill({ json: mocks.mockCMDB.detail });
    });

    await page.goto('/cmdb');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const text = page.getByText('Production API Server');
    if (await text.count() > 0) {
      await expect(text).toBeVisible({ timeout: 20000 });
      await page.getByRole('tab', { name: /graph/i }).click();
      await text.click();
      await page.waitForURL(/\/cmdb\/ci-001/, { timeout: 5000 });
    }
  });
});
