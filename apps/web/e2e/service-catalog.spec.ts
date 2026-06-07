import { test, expect } from '@playwright/test';
import { injectMockAuth } from './helpers/auth';
import * as mocks from './helpers/api-mock';

test.describe('Service Catalog', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockAuth(page);
    await page.route('**/api/v1/service-requests**', async (route) => {
      await route.fulfill({ json: mocks.mockRequests.list });
    });
    await page.route('**/api/v1/requests**', async (route) => {
      await route.fulfill({ json: mocks.mockRequests.list });
    });
  });

  test('should show Service Requests heading and catalog toggle', async ({ page }) => {
    await page.goto('/requests', { waitUntil: 'domcontentloaded' });

    await expect(page.getByText('Service Requests').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Catalog' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'My Requests' })).toBeVisible();
  });

  test('should default to catalog view with all 6 category cards', async ({ page }) => {
    await page.goto('/requests', { waitUntil: 'domcontentloaded' });

    const categories = ['Hardware', 'Software', 'Access', 'Support', 'Training', 'Facilities'];
    for (const cat of categories) {
      await expect(page.getByText(cat, { exact: true }).first()).toBeVisible();
    }
  });

  test('should show Request button on each category card', async ({ page }) => {
    await page.goto('/requests', { waitUntil: 'domcontentloaded' });

    const requestButtons = page.getByRole('button', { name: /request/i });
    const count = await requestButtons.count();
    expect(count).toBeGreaterThanOrEqual(6);
  });

  test('should navigate to /requests/new with category on Hardware card click', async ({ page }) => {
    await page.goto('/requests', { waitUntil: 'domcontentloaded' });

    const hardwareButton = page.getByText('Hardware', { exact: true }).first();
    await hardwareButton.waitForElementState('visible');

    await Promise.all([
      page.waitForNavigation(),
      hardwareButton.click()
    ]);

    expect(page.url()).toContain('category');
  });

  test('should switch to My Requests list on toggle', async ({ page }) => {
    await page.goto('/requests', { waitUntil: 'domcontentloaded' });

    await page.getByRole('button', { name: 'My Requests' }).click();

    await expect(page.locator('table')).toBeVisible();
  });

  test('should show empty state when no requests', async ({ page }) => {
    await page.route('**/api/v1/requests**', async (route) => {
      await route.fulfill({ json: { data: [], total: 0 } });
    });
    await page.route('**/api/v1/service-requests**', async (route) => {
      await route.fulfill({ json: { data: [], total: 0 } });
    });

    await page.goto('/requests', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'My Requests' }).click();

    await expect(page.getByText(/no requests found/i)).toBeVisible();
  });

  test('should show search input in catalog view', async ({ page }) => {
    await page.goto('/requests', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('textbox', { name: 'Search catalog' })).toBeVisible();
  });

  test('should show request table with columns in list view', async ({ page }) => {
    await page.goto('/requests', { waitUntil: 'domcontentloaded' });

    await page.getByRole('button', { name: 'My Requests' }).click();

    const columns = ['ID', 'Title', 'Status'];
    for (const col of columns) {
      await expect(page.getByRole('columnheader', { name: new RegExp(col, 'i') }).first()).toBeVisible();
    }
  });
});
