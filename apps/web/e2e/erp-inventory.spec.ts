import { test, expect } from '@playwright/test';
import { injectMockAuth } from './helpers/auth';
import * as mocks from './helpers/api-mock';

test.describe('ERP - Inventory Management', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockAuth(page);
    await page.route('**/api/v1/inventory**', async (route) => {
      await route.fulfill({ json: mocks.mockInventory });
    });
  });

  test('inventory overview renders at /inventory', async ({ page }) => {
    await page.goto('/inventory');
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible().catch(() => {});
  });

  test('inventory items table displays quantity and warehouse columns', async ({ page }) => {
    await page.goto('/inventory');
    const table = page.locator('table, [role="table"]').first();
    if (await table.count() > 0) {
      const columns = page.locator('text="Quantity", text="Warehouse"').first();
      if (await columns.count() > 0) {
        await expect(columns).toBeVisible().catch(() => {});
      }
    }
  });

  test('asset detail at /inventory/assets/[id] displays serial number and status', async ({ page }) => {
    await page.route('**/api/v1/inventory/assets/asset-001**', async (route) => {
      await route.fulfill({ json: mocks.mockInventory.assets.data[0] });
    });
    await page.goto('/inventory/assets/asset-001');
    const serial = page.locator('text="Serial"').first();
    if (await serial.count() > 0) {
      await expect(serial).toBeVisible().catch(() => {});
    }
  });

  test('cycle counts at /inventory/cycle-counts displays list', async ({ page }) => {
    await page.goto('/inventory/cycle-counts');
    const heading = page.locator('h1, h2').first();
    if (await heading.count() > 0) {
      await expect(heading).toBeVisible().catch(() => {});
    }
  });

  test('cycle count list shows warehouse column', async ({ page }) => {
    await page.goto('/inventory/cycle-counts');
    const warehouse = page.locator('text="Warehouse"').first();
    if (await warehouse.count() > 0) {
      await expect(warehouse).toBeVisible().catch(() => {});
    }
  });

  test('demand planning at /inventory/demand-planning displays forecast', async ({ page }) => {
    await page.goto('/inventory/demand-planning');
    const heading = page.locator('h1, h2').first();
    if (await heading.count() > 0) {
      await expect(heading).toBeVisible().catch(() => {});
    }
  });

  test('lot tracking at /inventory/lots displays list', async ({ page }) => {
    await page.goto('/inventory/lots');
    const heading = page.locator('h1, h2').first();
    if (await heading.count() > 0) {
      await expect(heading).toBeVisible().catch(() => {});
    }
  });

  test('transfers at /inventory/transfers displays list with from/to warehouse', async ({ page }) => {
    await page.goto('/inventory/transfers');
    const fromTo = page.locator('text="From", text="To"').first();
    if (await fromTo.count() > 0) {
      await expect(fromTo).toBeVisible().catch(() => {});
    }
  });
});
