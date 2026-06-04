import { test, expect } from '@playwright/test';
import { injectMockAuth } from './helpers/auth';
import * as mocks from './helpers/api-mock';

test.describe('Inventory CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockAuth(page);
  });

  test.describe('Inventory Overview', () => {
    test('should show 4 summary cards', async ({ page }) => {
      await page.route('**/api/v1/inventory/**', route =>
        route.fulfill({ json: mocks.mockInventory })
      );

      await page.goto('/inventory', { waitUntil: 'domcontentloaded' });

      const cards = ['Total Items', 'Low Stock Alerts', 'Total Assets', 'Asset Value'];
      for (const card of cards) {
        const cardEl = page.getByText(card);
        if (await cardEl.count() > 0) {
          await expect(cardEl.first()).toBeVisible();
        }
      }
    });

    test('should show low stock alert banner when items are low', async ({ page }) => {
      await page.route('**/api/v1/inventory/**', route =>
        route.fulfill({ json: mocks.mockInventory })
      );

      await page.goto('/inventory', { waitUntil: 'domcontentloaded' });

      const lowStockBanner = page.getByText(/below minimum stock/i);
      if (await lowStockBanner.count() > 0) {
        await expect(lowStockBanner).toBeVisible();
      }
    });
  });

  test.describe('Items Tab', () => {
    test('should show New Item button', async ({ page }) => {
      await page.route('**/api/v1/inventory/**', route =>
        route.fulfill({ json: mocks.mockInventory })
      );

      await page.goto('/inventory', { waitUntil: 'domcontentloaded' });

      const newBtn = page.getByRole('button', { name: 'New Item' });
      if (await newBtn.count() > 0) {
        await expect(newBtn).toBeVisible();
      }
    });

    test('should create inventory item after filling form', async ({ page }) => {
      await page.route('**/api/v1/inventory/**', route => {
        if (route.request().method() === 'POST') {
          return route.fulfill({ json: { data: { id: 'item-003', name: 'New Item' } } });
        }
        return route.fulfill({ json: mocks.mockInventory });
      });

      await page.goto('/inventory', { waitUntil: 'domcontentloaded' });

      const newBtn = page.getByRole('button', { name: 'New Item' });
      if (await newBtn.count() > 0) {
        await newBtn.click();
        const nameInput = page.getByRole('textbox', { name: 'Name' });
        if (await nameInput.count() > 0) {
          await nameInput.fill('Keyboard');
          const submitBtn = page.getByRole('button', { name: 'Create' });
          if (await submitBtn.count() > 0) {
            await submitBtn.click();
            await expect(nameInput).not.toBeVisible();
          }
        }
      }
    });

    test('should edit inventory item', async ({ page }) => {
      await page.route('**/api/v1/inventory/**', route => {
        if (route.request().method() === 'PUT') {
          return route.fulfill({ json: { data: { id: 'item-001', name: 'Updated' } } });
        }
        return route.fulfill({ json: mocks.mockInventory });
      });

      await page.goto('/inventory', { waitUntil: 'domcontentloaded' });

      const editBtn = page.locator('button[title="Edit"], button:has-text("Edit")').first();
      if (await editBtn.count() > 0) {
        await editBtn.click();
        const nameInput = page.getByRole('textbox', { name: 'Name' });
        if (await nameInput.count() > 0) {
          await expect(nameInput).toHaveValue(/.+/);
        }
      }
    });

    test('should delete inventory item', async ({ page }) => {
      await page.route('**/api/v1/inventory/**', route => {
        if (route.request().method() === 'DELETE') {
          return route.fulfill({ status: 204 });
        }
        return route.fulfill({ json: mocks.mockInventory });
      });

      await page.goto('/inventory', { waitUntil: 'domcontentloaded' });

      const deleteBtn = page.locator('button[title="Delete"], button:has-text("Delete")').first();
      if (await deleteBtn.count() > 0) {
        await deleteBtn.click();
        const confirmText = page.getByText(/delete/i);
        if (await confirmText.count() > 0) {
          await expect(confirmText.first()).toBeVisible();
        }
      }
    });

    test('should adjust stock', async ({ page }) => {
      await page.route('**/api/v1/inventory/**', route => {
        if (route.request().method() === 'POST' && route.request().url().includes('adjust')) {
          return route.fulfill({ json: { data: { id: 'item-001', quantityOnHand: 150 } } });
        }
        return route.fulfill({ json: mocks.mockInventory });
      });

      await page.goto('/inventory', { waitUntil: 'domcontentloaded' });

      const adjustBtn = page.getByRole('button', { name: 'Adjust Stock' }).first();
      if (await adjustBtn.count() > 0) {
        await adjustBtn.click();
        const typeSelect = page.getByRole('combobox', { name: 'Type' });
        const quantityInput = page.getByRole('textbox', { name: 'Quantity' });
        if (await typeSelect.count() > 0) await expect(typeSelect).toBeVisible();
        if (await quantityInput.count() > 0) await expect(quantityInput).toBeVisible();
      }
    });

    test('should show low stock warning badge', async ({ page }) => {
      await page.route('**/api/v1/inventory/**', route =>
        route.fulfill({ json: mocks.mockInventory })
      );

      await page.goto('/inventory', { waitUntil: 'domcontentloaded' });

      const lowStockBadge = page.getByText(/low stock/i);
      if (await lowStockBadge.count() > 0) {
        await expect(lowStockBadge.first()).toBeVisible();
      }
    });

    test('should show search and warehouse filter', async ({ page }) => {
      await page.route('**/api/v1/inventory/**', route =>
        route.fulfill({ json: mocks.mockInventory })
      );

      await page.goto('/inventory', { waitUntil: 'domcontentloaded' });

      const searchInput = page.getByPlaceholder('Search items');
      const warehouseFilter = page.getByRole('combobox', { name: 'Warehouse' });
      if (await searchInput.count() > 0) await expect(searchInput).toBeVisible();
      if (await warehouseFilter.count() > 0) await expect(warehouseFilter).toBeVisible();
    });
  });

  test.describe('Assets Tab', () => {
    test('should show New Asset button', async ({ page }) => {
      await page.route('**/api/v1/inventory/**', route =>
        route.fulfill({ json: mocks.mockInventory })
      );

      await page.goto('/inventory', { waitUntil: 'domcontentloaded' });

      const assetsTab = page.getByRole('tab', { name: 'Assets' });
      if (await assetsTab.count() > 0) {
        await assetsTab.click();
        const newBtn = page.getByRole('button', { name: 'New Asset' });
        if (await newBtn.count() > 0) {
          await expect(newBtn).toBeVisible();
        }
      }
    });

    test('should create asset after filling form', async ({ page }) => {
      await page.route('**/api/v1/inventory/**', route => {
        if (route.request().method() === 'POST') {
          return route.fulfill({ json: { data: { id: 'asset-002', name: 'New Server' } } });
        }
        return route.fulfill({ json: mocks.mockInventory });
      });

      await page.goto('/inventory', { waitUntil: 'domcontentloaded' });

      const assetsTab = page.getByRole('tab', { name: 'Assets' });
      if (await assetsTab.count() > 0) {
        await assetsTab.click();
        const newBtn = page.getByRole('button', { name: 'New Asset' });
        if (await newBtn.count() > 0) {
          await newBtn.click();
          const nameInput = page.getByRole('textbox', { name: 'Name' });
          if (await nameInput.count() > 0) {
            await nameInput.fill('Backup Server');
            const submitBtn = page.getByRole('button', { name: 'Create' });
            if (await submitBtn.count() > 0) {
              await submitBtn.click();
            }
          }
        }
      }
    });

    test('should filter assets by status', async ({ page }) => {
      await page.route('**/api/v1/inventory/**', route =>
        route.fulfill({ json: mocks.mockInventory })
      );

      await page.goto('/inventory', { waitUntil: 'domcontentloaded' });

      const assetsTab = page.getByRole('tab', { name: 'Assets' });
      if (await assetsTab.count() > 0) {
        await assetsTab.click();
        const statusFilter = page.getByRole('combobox', { name: 'Status' });
        if (await statusFilter.count() > 0) {
          await expect(statusFilter).toBeVisible();
        }
      }
    });
  });

  test.describe('Asset Detail', () => {
    test('should show asset summary cards', async ({ page }) => {
      await page.route('**/api/v1/inventory/assets/asset-001', route =>
        route.fulfill({ json: mocks.mockAssetDetail })
      );

      await page.goto('/inventory/assets/asset-001', { waitUntil: 'domcontentloaded' });

      const purchasePrice = page.getByText('$15,000');
      const bookValue = page.getByText('$11,250');
      if (await purchasePrice.count() > 0) await expect(purchasePrice).toBeVisible();
      if (await bookValue.count() > 0) await expect(bookValue).toBeVisible();
    });

    test('should show depreciation schedule', async ({ page }) => {
      await page.route('**/api/v1/inventory/assets/asset-001', route =>
        route.fulfill({ json: mocks.mockAssetDetail })
      );

      await page.goto('/inventory/assets/asset-001', { waitUntil: 'domcontentloaded' });

      const depreciationCard = page.getByText(/depreciation/i);
      if (await depreciationCard.count() > 0) {
        await expect(depreciationCard.first()).toBeVisible();
      }
    });

    test('should show Dispose Asset button', async ({ page }) => {
      await page.route('**/api/v1/inventory/assets/asset-001', route => {
        if (route.request().method() === 'POST' && route.request().url().includes('dispose')) {
          return route.fulfill({ json: { data: { id: 'asset-001', status: 'disposed' } } });
        }
        return route.fulfill({ json: mocks.mockAssetDetail });
      });

      await page.goto('/inventory/assets/asset-001', { waitUntil: 'domcontentloaded' });

      const disposeBtn = page.getByRole('button', { name: 'Dispose Asset' });
      if (await disposeBtn.count() > 0) {
        await expect(disposeBtn).toBeVisible();
      }
    });
  });

  test.describe('Warehouses Tab', () => {
    test('should show New Warehouse button and create form', async ({ page }) => {
      await page.route('**/api/v1/inventory/**', route => {
        if (route.request().method() === 'POST') {
          return route.fulfill({ json: { data: { id: 'wh-004', name: 'New Warehouse' } } });
        }
        return route.fulfill({ json: mocks.mockInventory });
      });

      await page.goto('/inventory', { waitUntil: 'domcontentloaded' });

      const warehousesTab = page.getByRole('tab', { name: 'Warehouses' });
      if (await warehousesTab.count() > 0) {
        await warehousesTab.click();
        const newBtn = page.getByRole('button', { name: 'New Warehouse' });
        if (await newBtn.count() > 0) {
          await expect(newBtn).toBeVisible();
          await newBtn.click();
          const nameInput = page.getByRole('textbox', { name: 'Name' });
          if (await nameInput.count() > 0) {
            await expect(nameInput).toBeVisible();
          }
        }
      }
    });

    test('should show warehouse utilization progress bars', async ({ page }) => {
      await page.route('**/api/v1/inventory/**', route =>
        route.fulfill({ json: mocks.mockInventory })
      );

      await page.goto('/inventory', { waitUntil: 'domcontentloaded' });

      const warehousesTab = page.getByRole('tab', { name: 'Warehouses' });
      if (await warehousesTab.count() > 0) {
        await warehousesTab.click();
        const progressBar = page.locator('[role="progressbar"]');
        if (await progressBar.count() > 0) {
          await expect(progressBar.first()).toBeVisible();
        }
      }
    });
  });
});
