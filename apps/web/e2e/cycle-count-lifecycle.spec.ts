import { test, expect } from '@playwright/test';
import { injectMockAuth } from './helpers/auth';
import * as mocks from './helpers/api-mock';

test.describe('Cycle Count Lifecycle', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockAuth(page);
    await page.route('**/api/v1/inventory/cycle-counts**', async (route) => {
      const method = route.request().method();
      if (method === 'POST' && route.request().url().includes('/schedule')) {
        return route.fulfill({ json: { data: null } });
      }
      if (method === 'POST' && route.request().url().includes('/record')) {
        return route.fulfill({ json: { data: null } });
      }
      return route.fulfill({ json: mocks.mockCycleCounts.list });
    });
    await page.route('**/api/v1/inventory**', async (route) => {
      await route.fulfill({ json: mocks.mockInventory });
    });
  });

  test('should show Cycle Counting heading and Schedule Count button', async ({ page }) => {
    await page.goto('/inventory/cycle-counts', { waitUntil: 'domcontentloaded' });

    await expect(page.getByText(/cycle count/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /schedule count/i })).toBeVisible();
  });

  test('should open schedule dialog on Schedule Count click', async ({ page }) => {
    await page.goto('/inventory/cycle-counts', { waitUntil: 'domcontentloaded' });

    await page.getByRole('button', { name: /schedule count/i }).click();

    await expect(page.getByText('Schedule New Count')).toBeVisible();
    await expect(page.getByLabel('Warehouse ID')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible();
  });

  test('should schedule a new count and close dialog', async ({ page }) => {
    const scheduleRequest = page.waitForRequest(
      (req) => req.url().includes('/cycle-counts/schedule') && req.method() === 'POST'
    );

    await page.goto('/inventory/cycle-counts', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /schedule count/i }).click();

    const warehouseInput = page.getByLabel('Warehouse ID');
    await warehouseInput.fill('WH-001');
    await page.getByRole('button', { name: 'Submit' }).click();

    const request = await scheduleRequest;
    expect(request).toBeTruthy();
    await expect(page.getByText('Schedule New Count')).not.toBeVisible();
  });

  test('should show cycle count rows from API data', async ({ page }) => {
    await page.goto('/inventory/cycle-counts', { waitUntil: 'domcontentloaded' });

    await expect(page.getByText('cc-001')).toBeVisible();
    await expect(page.getByText('WH-001')).toBeVisible();
  });

  test('should open record count dialog', async ({ page }) => {
    await page.goto('/inventory/cycle-counts', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('button', { name: /record count/i })).toBeVisible();
    await page.getByRole('button', { name: /record count/i }).click();

    await expect(page.getByText(/record count/i)).toBeVisible();
    await expect(page.getByLabel('Actual Quantity')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible();
  });

  test('should submit a recorded count', async ({ page }) => {
    const recordRequest = page.waitForRequest(
      (req) => req.url().includes('/record') && req.method() === 'POST'
    );

    await page.goto('/inventory/cycle-counts', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /record count/i }).click();

    await page.getByLabel('Actual Quantity').fill('42');
    await page.getByRole('button', { name: 'Submit' }).click();

    const request = await recordRequest;
    expect(request).toBeTruthy();
    await expect(page.getByLabel('Actual Quantity')).not.toBeVisible();
  });

  test('should show table with correct column headers', async ({ page }) => {
    await page.goto('/inventory/cycle-counts', { waitUntil: 'domcontentloaded' });

    const columns = ['Count', 'Warehouse', 'Schedule', 'Variance'];
    for (const col of columns) {
      await expect(
        page.getByRole('columnheader', { name: new RegExp(col, 'i') }).first()
      ).toBeVisible();
    }
  });
});
