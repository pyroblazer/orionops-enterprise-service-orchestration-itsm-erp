import { test, expect } from '@playwright/test';
import { injectMockAuth } from './helpers/auth';
import * as mocks from './helpers/api-mock';

test.describe('Asset Depreciation Detail', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockAuth(page);
    // Register general route FIRST (lowest LIFO priority)
    await page.route('**/api/v1/inventory**', async (route) => {
      await route.fulfill({ json: mocks.mockInventory });
    });
    // Register specific asset-001 routes AFTER (higher LIFO priority)
    await page.route('**/api/v1/inventory/assets/asset-001**', async (route) => {
      await route.fulfill({ json: mocks.mockAssetDetail });
    });
    await page.route('**/api/v1/inventory/assets/asset-001/depreciation**', async (route) => {
      await route.fulfill({
        json: {
          data: {
            annualDepreciation: 3750,
            usefulLifeYears: 4,
            schedule: [
              { year: 1, depreciation: 3750, bookValue: 11250 },
              { year: 2, depreciation: 3750, bookValue: 7500 },
            ],
          },
        },
      });
    });
    await page.route('**/api/v1/inventory/assets/asset-001/book-value**', async (route) => {
      await route.fulfill({ json: { data: 11250 } });
    });
  });

  test('should render asset detail heading with asset name', async ({ page }) => {
    await page.goto('/inventory/assets/asset-001', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('h1')).toHaveText('Production Server');
  });

  test('should display Purchase Price card with formatted dollar amount', async ({ page }) => {
    await page.goto('/inventory/assets/asset-001', { waitUntil: 'domcontentloaded' });

    await expect(page.getByText('Purchase Price')).toBeVisible();
    await expect(page.getByText('$15,000')).toBeVisible();
  });

  test('should display Book Value card', async ({ page }) => {
    await page.goto('/inventory/assets/asset-001', { waitUntil: 'domcontentloaded' });

    await expect(page.getByText('Book Value')).toBeVisible();
    await expect(page.getByText('$11,250')).toBeVisible();
  });

  test('should display Depreciation Method', async ({ page }) => {
    await page.goto('/inventory/assets/asset-001', { waitUntil: 'domcontentloaded' });

    await expect(page.getByText('Depreciation Method')).toBeVisible();
    await expect(page.getByText('STRAIGHT_LINE')).toBeVisible();
  });

  test('should display depreciation schedule from API', async ({ page }) => {
    await page.goto('/inventory/assets/asset-001', { waitUntil: 'domcontentloaded' });

    await expect(page.getByText('Depreciation Schedule')).toBeVisible();
    await expect(page.getByText(/annual depreciation/i)).toBeVisible();
    await expect(page.getByText(/\$3,750/)).toBeVisible();
    await expect(page.getByText(/useful life/i)).toBeVisible();
  });

  test('should show Dispose Asset button', async ({ page }) => {
    await page.goto('/inventory/assets/asset-001', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('button', { name: /dispose asset/i })).toBeVisible();
  });

  test('should dispose asset with confirmation dialog', async ({ page }) => {
    const disposeRequest = page.waitForRequest(
      (req) => req.url().includes('/dispose') && req.method() === 'POST'
    );

    await page.goto('/inventory/assets/asset-001', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /dispose asset/i }).click();

    await expect(page.getByText(/dispose asset/i)).toBeVisible();
    await expect(page.getByLabel('Reason')).toBeVisible();

    await page.getByLabel('Reason').fill('Asset end of life');
    await page.getByRole('button', { name: /confirm disposal/i }).click();

    const request = await disposeRequest;
    expect(request).toBeTruthy();
  });

  test('should show Asset not found state when data is null', async ({ page }) => {
    await page.route('**/api/v1/inventory/assets/nonexistent**', async (route) => {
      await route.fulfill({ json: { data: null } });
    });

    await page.goto('/inventory/assets/nonexistent', { waitUntil: 'domcontentloaded' });

    await expect(page.getByText(/asset not found/i)).toBeVisible();
  });
});
