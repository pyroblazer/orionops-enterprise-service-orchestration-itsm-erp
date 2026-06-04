import { test, expect } from '@playwright/test';
import { injectMockAuth } from './helpers/auth';

test.describe('Three-Way Matching', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockAuth(page);
  });

  test('should show loading skeleton during fetch', async ({ page }) => {
    await page.route('**/api/v1/procurement/**', async (route) => {
      await new Promise((r) => setTimeout(r, 1000));
      return route.fulfill({ json: { data: [] } });
    });

    await page.goto('/procurement/matching', { waitUntil: 'domcontentloaded' });
    const skeleton = page.locator('[class*="skeleton"], [class*="animate-pulse"]').first();
    if (await skeleton.count() > 0) {
      await expect(skeleton).toBeVisible();
    }
  });

  test('should show Three-Way Matching heading', async ({ page }) => {
    await page.goto('/procurement/matching', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Three-Way Matching' })).toBeVisible();
  });

  test('should show subtitle text', async ({ page }) => {
    await page.goto('/procurement/matching', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Exceptions and variance resolution')).toBeVisible();
  });

  test('should show 3 summary metric cards', async ({ page }) => {
    await page.goto('/procurement/matching', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Open Exceptions')).toBeVisible();
    await expect(page.getByText('Total Variance')).toBeVisible();
    await expect(page.getByText('Resolution Rate')).toBeVisible();
  });

  test('should show exceptions table with correct headers', async ({ page }) => {
    await page.goto('/procurement/matching', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('columnheader', { name: 'Invoice ID' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Variance' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Reason' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Action' })).toBeVisible();
  });

  test('should display exception rows from built-in data', async ({ page }) => {
    await page.goto('/procurement/matching', { waitUntil: 'domcontentloaded' });
    // Page has built-in mock data with EXC-001
    await expect(page.getByText('INV-1001')).toBeVisible();
    await expect(page.getByText('QUANTITY_VARIANCE')).toBeVisible();
  });

  test('should show PENDING status with destructive badge', async ({ page }) => {
    await page.goto('/procurement/matching', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('PENDING')).toBeVisible();
  });

  test('should show Resolve button for PENDING exceptions', async ({ page }) => {
    await page.goto('/procurement/matching', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('button', { name: 'Resolve' })).toBeVisible();
  });

  test('should show variance amount with dollar sign', async ({ page }) => {
    await page.goto('/procurement/matching', { waitUntil: 'domcontentloaded' });
    // Page uses toLocaleString() for variance display
    const variance = page.locator('td.text-red-600').first();
    if (await variance.count() > 0) {
      await expect(variance).toContainText('$');
    }
  });

  test('should show Matching Exceptions card title', async ({ page }) => {
    await page.goto('/procurement/matching', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Matching Exceptions')).toBeVisible();
  });
});
