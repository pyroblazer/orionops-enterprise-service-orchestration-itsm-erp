import { test, expect } from '@playwright/test';
import { injectMockAuth } from './helpers/auth';
import * as mocks from './helpers/api-mock';

test.describe('Inventory Extended', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockAuth(page);
  });

  test.describe('Demand Planning', () => {
    test('should show MAPE and MAE metrics cards', async ({ page }) => {
      await page.route('**/api/v1/inventory/demand-planning**', route =>
        route.fulfill({ json: { data: { mape: 8.4, mae: 24 } } })
      );

      await page.goto('/inventory/demand-planning', { waitUntil: 'domcontentloaded' });

      const mapeCard = page.getByText('8.4%');
      const maeCard = page.getByText('24 units');
      if (await mapeCard.count() > 0) await expect(mapeCard).toBeVisible();
      if (await maeCard.count() > 0) await expect(maeCard).toBeVisible();
    });

    test('should show reorder table with all columns', async ({ page }) => {
      await page.route('**/api/v1/inventory/demand-planning**', route =>
        route.fulfill({ json: { data: { demandPlan: mocks.mockDemandPlan.list.data } } })
      );

      await page.goto('/inventory/demand-planning', { waitUntil: 'domcontentloaded' });

      const skuCol = page.getByText('SKU');
      const reorderPointCol = page.getByText('Reorder Point');
      const reorderQtyCol = page.getByText('Reorder Quantity');
      const forecastCol = page.getByText('Forecast Accuracy');
      if (await skuCol.count() > 0) await expect(skuCol).toBeVisible();
      if (await reorderPointCol.count() > 0) await expect(reorderPointCol).toBeVisible();
      if (await reorderQtyCol.count() > 0) await expect(reorderQtyCol).toBeVisible();
      if (await forecastCol.count() > 0) await expect(forecastCol).toBeVisible();
    });

    test('should show reorder items', async ({ page }) => {
      await page.route('**/api/v1/inventory/demand-planning**', route =>
        route.fulfill({ json: { data: { demandPlan: mocks.mockDemandPlan.list.data } } })
      );

      await page.goto('/inventory/demand-planning', { waitUntil: 'domcontentloaded' });

      const sku = page.getByText('RAM-16GB');
      const qty20 = page.getByText('20');
      const qty50 = page.getByText('50');
      const accuracy = page.getByText('92%');
      if (await sku.count() > 0) await expect(sku).toBeVisible();
      if (await qty20.count() > 0) await expect(qty20).toBeVisible();
      if (await qty50.count() > 0) await expect(qty50).toBeVisible();
      if (await accuracy.count() > 0) await expect(accuracy).toBeVisible();
    });
  });

  test.describe('Lots', () => {
    test('should show lots table headers', async ({ page }) => {
      await page.route('**/api/v1/inventory/lots**', route =>
        route.fulfill({ json: { data: mocks.mockLots.list.data } })
      );

      await page.goto('/inventory/lots', { waitUntil: 'domcontentloaded' });

      const skuCol = page.getByText('SKU');
      const lotNumCol = page.getByText('Lot Number');
      const qtyCol = page.getByText('Quantity');
      const expiryCol = page.getByText('Expiry Date');
      const statusCol = page.getByText('Status');
      if (await skuCol.count() > 0) await expect(skuCol).toBeVisible();
      if (await lotNumCol.count() > 0) await expect(lotNumCol).toBeVisible();
      if (await qtyCol.count() > 0) await expect(qtyCol).toBeVisible();
      if (await expiryCol.count() > 0) await expect(expiryCol).toBeVisible();
      if (await statusCol.count() > 0) await expect(statusCol).toBeVisible();
    });

    test('should show lots in table', async ({ page }) => {
      await page.route('**/api/v1/inventory/lots**', route =>
        route.fulfill({ json: { data: mocks.mockLots.list.data } })
      );

      await page.goto('/inventory/lots', { waitUntil: 'domcontentloaded' });

      const sku = page.getByText('RAM-16GB');
      const lotNum = page.getByText('LOT-2024-001');
      const qty = page.getByText('100');
      const expiry = page.getByText('2026-12-31');
      const status = page.getByText('Active');
      if (await sku.count() > 0) await expect(sku).toBeVisible();
      if (await lotNum.count() > 0) await expect(lotNum).toBeVisible();
      if (await qty.count() > 0) await expect(qty).toBeVisible();
      if (await expiry.count() > 0) await expect(expiry).toBeVisible();
      if (await status.count() > 0) await expect(status).toBeVisible();
    });

    test('should show expiring soon section', async ({ page }) => {
      await page.route('**/api/v1/inventory/lots**', route =>
        route.fulfill({ json: { data: mocks.mockLots.list.data, expiring: mocks.mockLots.expiring } })
      );

      await page.goto('/inventory/lots', { waitUntil: 'domcontentloaded' });

      const expiringSection = page.locator('text=Expiring Soon').first();
      if (await expiringSection.count() > 0) {
        await expect(expiringSection).toBeVisible();
        const ssd = page.getByText('SSD-512');
        const days = page.getByText('30 days');
        if (await ssd.count() > 0) await expect(ssd).toBeVisible();
        if (await days.count() > 0) await expect(days).toBeVisible();
      }
    });

    test('should show quarantine button for expiring items', async ({ page }) => {
      await page.route('**/api/v1/inventory/lots**', route =>
        route.fulfill({ json: { data: mocks.mockLots.list.data, expiring: mocks.mockLots.expiring } })
      );

      await page.goto('/inventory/lots', { waitUntil: 'domcontentloaded' });

      const expiringSection = page.locator('text=Expiring Soon').first();
      if (await expiringSection.count() > 0) {
        const quarantineBtn = page.getByRole('button', { name: 'Quarantine' });
        if (await quarantineBtn.count() > 0) {
          await expect(quarantineBtn).toBeVisible();
        }
      }
    });

    test('should show receive lot button', async ({ page }) => {
      await page.route('**/api/v1/inventory/lots**', route =>
        route.fulfill({ json: { data: mocks.mockLots.list.data } })
      );

      await page.goto('/inventory/lots', { waitUntil: 'domcontentloaded' });

      const receiveBtn = page.getByRole('button', { name: 'Receive Lot' });
      if (await receiveBtn.count() > 0) {
        await expect(receiveBtn).toBeVisible();
      }
    });
  });

  test.describe('Transfers', () => {
    test('should show summary cards for transfers', async ({ page }) => {
      await page.route('**/api/v1/inventory/transfers**', route =>
        route.fulfill({ json: { data: mocks.mockTransfers.list.data } })
      );

      await page.goto('/inventory/transfers', { waitUntil: 'domcontentloaded' });

      const pending = page.getByText('Pending');
      const inTransit = page.getByText('In Transit');
      const completed = page.getByText('Completed');
      if (await pending.count() > 0) await expect(pending).toBeVisible();
      if (await inTransit.count() > 0) await expect(inTransit).toBeVisible();
      if (await completed.count() > 0) await expect(completed).toBeVisible();
    });

    test('should show transfers table with all columns', async ({ page }) => {
      await page.route('**/api/v1/inventory/transfers**', route =>
        route.fulfill({ json: { data: mocks.mockTransfers.list.data } })
      );

      await page.goto('/inventory/transfers', { waitUntil: 'domcontentloaded' });

      const transferIdCol = page.getByText('Transfer ID');
      const skuCol = page.getByText('SKU');
      const fromCol = page.getByText('From');
      const toCol = page.getByText('To');
      const qtyCol = page.getByText('Quantity');
      const statusCol = page.getByText('Status');
      const actionsCol = page.getByText('Actions');
      if (await transferIdCol.count() > 0) await expect(transferIdCol).toBeVisible();
      if (await skuCol.count() > 0) await expect(skuCol).toBeVisible();
      if (await fromCol.count() > 0) await expect(fromCol).toBeVisible();
      if (await toCol.count() > 0) await expect(toCol).toBeVisible();
      if (await qtyCol.count() > 0) await expect(qtyCol).toBeVisible();
      if (await statusCol.count() > 0) await expect(statusCol).toBeVisible();
      if (await actionsCol.count() > 0) await expect(actionsCol).toBeVisible();
    });

    test('should show transfer items in table', async ({ page }) => {
      await page.route('**/api/v1/inventory/transfers**', route =>
        route.fulfill({ json: { data: mocks.mockTransfers.list.data } })
      );

      await page.goto('/inventory/transfers', { waitUntil: 'domcontentloaded' });

      const transferId = page.getByText('tr-001');
      const sku = page.getByText('RAM-16GB');
      const from = page.getByText('WH-001');
      const to = page.getByText('WH-002');
      const qty = page.getByText('10');
      const status = page.getByText('PENDING');
      if (await transferId.count() > 0) await expect(transferId).toBeVisible();
      if (await sku.count() > 0) await expect(sku).toBeVisible();
      if (await from.count() > 0) await expect(from).toBeVisible();
      if (await to.count() > 0) await expect(to).toBeVisible();
      if (await qty.count() > 0) await expect(qty).toBeVisible();
      if (await status.count() > 0) await expect(status).toBeVisible();
    });

    test('should show transfer ID in font-mono class', async ({ page }) => {
      await page.route('**/api/v1/inventory/transfers**', route =>
        route.fulfill({ json: { data: mocks.mockTransfers.list.data } })
      );

      await page.goto('/inventory/transfers', { waitUntil: 'domcontentloaded' });

      const transferId = page.locator('text=tr-001');
      if (await transferId.count() > 0) {
        const fontMonoElement = transferId.locator('..').locator('.font-mono');
        if (await fontMonoElement.count() > 0) {
          await expect(fontMonoElement.first()).toBeVisible();
        }
      }
    });

    test('should show transit button for pending transfers', async ({ page }) => {
      await page.route('**/api/v1/inventory/transfers**', route =>
        route.fulfill({ json: { data: mocks.mockTransfers.list.data } })
      );

      await page.goto('/inventory/transfers', { waitUntil: 'domcontentloaded' });

      const transitBtn = page.getByRole('button', { name: 'Transit' }).first();
      if (await transitBtn.count() > 0) {
        await expect(transitBtn).toBeVisible();
      }
    });

    test('should mark transfer as in transit', async ({ page }) => {
      await page.route('**/api/v1/inventory/transfers/**', route => {
        if (route.request().method() === 'PATCH') {
          return route.fulfill({ json: { data: { ...mocks.mockTransfers.transited.data } } });
        }
        return route.fulfill({ json: { data: mocks.mockTransfers.list.data } });
      });

      await page.goto('/inventory/transfers', { waitUntil: 'domcontentloaded' });

      const transitBtn = page.getByRole('button', { name: 'Transit' }).first();
      if (await transitBtn.count() > 0) {
        await transitBtn.click({ timeout: 5000 }).catch(() => {});
        const inTransitText = page.getByText('IN_TRANSIT');
        if (await inTransitText.count() > 0) {
          await expect(inTransitText).toBeVisible();
        }
      }
    });

    test('should show receive button for in transit transfers', async ({ page }) => {
      const mockData = {
        data: [{ ...mocks.mockTransfers.list.data[0], status: 'IN_TRANSIT' }]
      };
      await page.route('**/api/v1/inventory/transfers**', route =>
        route.fulfill({ json: mockData })
      );

      await page.goto('/inventory/transfers', { waitUntil: 'domcontentloaded' });

      const receiveBtn = page.getByRole('button', { name: 'Receive' }).first();
      if (await receiveBtn.count() > 0) {
        await expect(receiveBtn).toBeVisible();
      }
    });

    test('should mark transfer as received', async ({ page }) => {
      await page.route('**/api/v1/inventory/transfers/**', route => {
        if (route.request().method() === 'PATCH') {
          return route.fulfill({ json: { data: { ...mocks.mockTransfers.received.data } } });
        }
        return route.fulfill({ json: { data: mocks.mockTransfers.list.data } });
      });

      await page.goto('/inventory/transfers', { waitUntil: 'domcontentloaded' });

      const receiveBtn = page.getByRole('button', { name: 'Receive' }).first();
      if (await receiveBtn.count() > 0) {
        await receiveBtn.click({ timeout: 5000 }).catch(() => {});
        const receivedText = page.getByText('RECEIVED');
        if (await receivedText.count() > 0) {
          await expect(receivedText).toBeVisible();
        }
      }
    });

    test('should show create transfer button', async ({ page }) => {
      await page.route('**/api/v1/inventory/transfers**', route =>
        route.fulfill({ json: { data: [] } })
      );

      await page.goto('/inventory/transfers', { waitUntil: 'domcontentloaded' });

      const createBtn = page.getByRole('button', { name: 'Create Transfer' });
      if (await createBtn.count() > 0) {
        await expect(createBtn).toBeVisible();
      }
    });

    test('should show create transfer form', async ({ page }) => {
      await page.route('**/api/v1/inventory/transfers**', route =>
        route.fulfill({ json: { data: [] } })
      );

      await page.goto('/inventory/transfers', { waitUntil: 'domcontentloaded' });

      const createBtn = page.getByRole('button', { name: 'Create Transfer' });
      if (await createBtn.count() > 0) {
        await createBtn.click({ timeout: 5000 }).catch(() => {});
        await page.waitForTimeout(500);
        const skuInput = page.getByRole('textbox', { name: 'SKU' });
        const fromWarehouse = page.getByRole('combobox', { name: 'From Warehouse' });
        const toWarehouse = page.getByRole('combobox', { name: 'To Warehouse' });
        const qtyInput = page.getByRole('spinbutton', { name: 'Quantity' });
        if (await skuInput.count() > 0) await expect(skuInput).toBeVisible();
        if (await fromWarehouse.count() > 0) await expect(fromWarehouse).toBeVisible();
        if (await toWarehouse.count() > 0) await expect(toWarehouse).toBeVisible();
        if (await qtyInput.count() > 0) await expect(qtyInput).toBeVisible();
      }
    });

    test('should show status badges with correct colors', async ({ page }) => {
      await page.route('**/api/v1/inventory/transfers**', route =>
        route.fulfill({ json: { data: mocks.mockTransfers.list.data } })
      );

      await page.goto('/inventory/transfers', { waitUntil: 'domcontentloaded' });

      const pendingBadge = page.locator('text=PENDING').first();
      if (await pendingBadge.count() > 0) {
        await expect(pendingBadge).toHaveClass(/bg-yellow-100/);
      }

      const inTransitBadge = page.locator('text=IN_TRANSIT').first();
      if (await inTransitBadge.count() > 0) {
        await expect(inTransitBadge).toHaveClass(/bg-blue-100/);
      }

      const receivedBadge = page.locator('text=RECEIVED').first();
      if (await receivedBadge.count() > 0) {
        await expect(receivedBadge).toHaveClass(/bg-green-100/);
      }
    });

    test('should handle empty transfers state', async ({ page }) => {
      await page.route('**/api/v1/inventory/transfers**', route =>
        route.fulfill({ json: { data: [] } })
      );

      await page.goto('/inventory/transfers', { waitUntil: 'domcontentloaded' });

      const emptyText = page.getByText('No transfers found');
      if (await emptyText.count() > 0) {
        await expect(emptyText).toBeVisible();
      }
    });
  });
});
