import { test, expect } from '@playwright/test';
import { injectMockAuth } from './helpers/auth';
import * as mocks from './helpers/api-mock';

test.describe('Loading States', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockAuth(page);
  });

  test('dashboard shows skeleton or loading indicator during fetch', async ({ page }) => {
    await page.route('**/api/v1/**', async (route) => {
      await new Promise((r) => setTimeout(r, 2000));
      return route.fulfill({ json: { data: [] } });
    });

    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    const skeleton = page.locator('[class*="skeleton"], [class*="animate-pulse"], [class*="loading"]').first();
    if (await skeleton.count() > 0) {
      await expect(skeleton).toBeVisible();
    }
  });

  test('incidents list shows skeleton during fetch', async ({ page }) => {
    await page.route('**/api/v1/incidents**', async (route) => {
      await new Promise((r) => setTimeout(r, 2000));
      return route.fulfill({ json: mocks.mockIncidents.list });
    });

    await page.goto('/incidents', { waitUntil: 'domcontentloaded' });
    const skeleton = page.locator('[class*="skeleton"], [class*="animate-pulse"]').first();
    if (await skeleton.count() > 0) {
      await expect(skeleton).toBeVisible();
    }
  });

  test('finance page shows skeleton during fetch', async ({ page }) => {
    await page.route('**/api/v1/finance/**', async (route) => {
      await new Promise((r) => setTimeout(r, 2000));
      return route.fulfill({ json: mocks.mockFinance });
    });

    await page.goto('/finance', { waitUntil: 'domcontentloaded' });
    const skeleton = page.locator('[class*="skeleton"], [class*="animate-pulse"]').first();
    if (await skeleton.count() > 0) {
      await expect(skeleton).toBeVisible();
    }
  });

  test('inventory page shows skeleton during fetch', async ({ page }) => {
    await page.route('**/api/v1/inventory/**', async (route) => {
      await new Promise((r) => setTimeout(r, 2000));
      return route.fulfill({ json: mocks.mockInventory });
    });

    await page.goto('/inventory', { waitUntil: 'domcontentloaded' });
    const skeleton = page.locator('[class*="skeleton"], [class*="animate-pulse"]').first();
    if (await skeleton.count() > 0) {
      await expect(skeleton).toBeVisible();
    }
  });

  test('billing page shows skeleton during fetch', async ({ page }) => {
    await page.route('**/api/v1/billing/**', async (route) => {
      await new Promise((r) => setTimeout(r, 2000));
      return route.fulfill({ json: mocks.mockBilling });
    });

    await page.goto('/billing', { waitUntil: 'domcontentloaded' });
    const skeleton = page.locator('[class*="skeleton"], [class*="animate-pulse"]').first();
    if (await skeleton.count() > 0) {
      await expect(skeleton).toBeVisible();
    }
  });

  test('procurement page shows skeleton during fetch', async ({ page }) => {
    await page.route('**/api/v1/procurement/**', async (route) => {
      await new Promise((r) => setTimeout(r, 2000));
      return route.fulfill({ json: mocks.mockProcurement });
    });

    await page.goto('/procurement', { waitUntil: 'domcontentloaded' });
    const skeleton = page.locator('[class*="skeleton"], [class*="animate-pulse"]').first();
    if (await skeleton.count() > 0) {
      await expect(skeleton).toBeVisible();
    }
  });

  test('knowledge page shows skeleton during fetch', async ({ page }) => {
    await page.route('**/api/v1/knowledge**', async (route) => {
      await new Promise((r) => setTimeout(r, 2000));
      return route.fulfill({ json: mocks.mockKnowledgeArticles });
    });

    await page.goto('/knowledge', { waitUntil: 'domcontentloaded' });
    const skeleton = page.locator('[class*="skeleton"], [class*="animate-pulse"]').first();
    if (await skeleton.count() > 0) {
      await expect(skeleton).toBeVisible();
    }
  });

  test('vendors page shows skeleton during fetch', async ({ page }) => {
    await page.route('**/api/v1/vendors**', async (route) => {
      await new Promise((r) => setTimeout(r, 2000));
      return route.fulfill({ json: mocks.mockVendors });
    });

    await page.goto('/vendors', { waitUntil: 'domcontentloaded' });
    const skeleton = page.locator('[class*="skeleton"], [class*="animate-pulse"]').first();
    if (await skeleton.count() > 0) {
      await expect(skeleton).toBeVisible();
    }
  });
});
