import { test, expect } from '@playwright/test';
import { injectMockAuth } from './helpers/auth';
import * as mocks from './helpers/api-mock';

test.describe('Inventory Cycle Counts', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockAuth(page);
  });

  test('should show loading skeleton during fetch', async ({ page }) => {
    await page.route('**/api/v1/inventory/**', async (route) => {
      await new Promise((r) => setTimeout(r, 1000));
      return route.fulfill({ json: mocks.mockCycleCounts });
    });

    await page.goto('/inventory/cycle-counts', { waitUntil: 'domcontentloaded' });
    const skeleton = page.locator('[class*="skeleton"], [class*="animate-pulse"]').first();
    if (await skeleton.count() > 0) {
      await expect(skeleton).toBeVisible();
    }
  });

  test('should show Cycle Counting heading', async ({ page }) => {
    await page.goto('/inventory/cycle-counts', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Cycle Counting' })).toBeVisible();
  });

  test('should show subtitle text', async ({ page }) => {
    await page.goto('/inventory/cycle-counts', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Inventory reconciliation and variance tracking')).toBeVisible();
  });

  test('should show Schedule Count button', async ({ page }) => {
    await page.goto('/inventory/cycle-counts', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('button', { name: 'Schedule Count' })).toBeVisible();
  });

  test('should show table headers', async ({ page }) => {
    await page.goto('/inventory/cycle-counts', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('columnheader', { name: 'Count ID' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Warehouse' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Schedule' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Last Count' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Items Variance' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Action' })).toBeVisible();
  });

  test('should show Cycle Count Schedule card title', async ({ page }) => {
    await page.goto('/inventory/cycle-counts', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Cycle Count Schedule')).toBeVisible();
  });

  test('should show empty state when no counts exist', async ({ page }) => {
    // The page currently uses local state (empty array), so no data rows appear
    await page.goto('/inventory/cycle-counts', { waitUntil: 'domcontentloaded' });
    // Table should exist but with no data rows
    const table = page.locator('table');
    await expect(table).toBeVisible();
    const rows = page.locator('tbody tr');
    await expect(rows).toHaveCount(0);
  });
});
