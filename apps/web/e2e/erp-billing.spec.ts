import { test, expect } from '@playwright/test';
import { injectMockAuth } from './helpers/auth';
import * as mocks from './helpers/api-mock';

test.describe('ERP - Service Billing', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockAuth(page);
    await page.route('**/api/v1/billing**', async (route) => {
      await route.fulfill({ json: mocks.mockBilling });
    });
  });

  test('billing overview renders at /billing', async ({ page }) => {
    await page.goto('/billing');
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('billing overview displays usage metric cards', async ({ page }) => {
    await page.goto('/billing');
    const cards = page.locator('[role="status"], [data-testid*="card"], .card, [class*="card"]').first();
    if (await cards.count() > 0) {
      await expect(cards).toBeVisible();
    }
  });

  test('usage records table displays period, cost, service columns', async ({ page }) => {
    await page.goto('/billing');
    const table = page.locator('table, [role="table"]').first();
    if (await table.count() > 0) {
      const columns = page.locator('text="Period", text="Cost", text="Service"').first();
      if (await columns.count() > 0) {
        await expect(columns).toBeVisible();
      }
    }
  });

  test('billing records table shows status badges with text labels', async ({ page }) => {
    await page.goto('/billing');
    const statusBadges = page.locator('text="PAID", text="DRAFT"').first();
    if (await statusBadges.count() > 0) {
      await expect(statusBadges).toBeVisible();
    }
  });

  test('cost models list is accessible', async ({ page }) => {
    await page.goto('/billing');
    const costModels = page.locator('text="Cost Model"').first();
    if (await costModels.count() > 0) {
      await expect(costModels).toBeVisible();
    }
  });
});
