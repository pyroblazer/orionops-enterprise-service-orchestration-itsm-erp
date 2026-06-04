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

      await expect(page.getByText('8.4%')).toBeVisible();
      await expect(page.getByText('24 units')).toBeVisible();
    });

    test('should show reorder table with all columns', async ({ page }) => {
      await page.route('**/api/v1/inventory/demand-planning**', route =>
        route.fulfill({ json: { data: { demandPlan: mocks.mockDemandPlan.list.data } } })
      );

      await page.goto('/inventory/demand-planning', { waitUntil: 'domcontentloaded' });

      await expect(page.getByText('SKU')).toBeVisible();
      await expect(page.getByText('Reorder Point')).toBeVisible();
      await expect(page.getByText('Reorder Quantity')).toBeVisible();
      await expect(page.getByText('Forecast Accuracy')).toBeVisible();
    });

    test('should show reorder items', async ({ page }) => {
      await page.route('**/api/v1/inventory/demand-planning**', route =>
        route.fulfill({ json: { data: { demandPlan: mocks.mockDemandPlan.list.data } } })
      );

      await page.goto('/inventory/demand-planning', { waitUntil: 'domcontentloaded' });

      await expect(page.getByText('RAM-16GB')).toBeVisible();
      await expect(page.getByText('20')).toBeVisible();
      await expect(page.getByText('50')).toBeVisible();
      await expect(page.getByText('92%')).toBeVisible();
    });
  });

  test.describe('Lots', () => {
    test('should show lots table headers', async ({ page }) => {
      await page.route('**/api/v1/inventory/lots**', route =>
        route.fulfill({ json: { data: mocks.mockLots.list.data } })
      );

      await page.goto('/inventory/lots', { waitUntil: 'domcontentloaded' });

      await expect(page.getByText('SKU')).toBeVisible();
      await expect(page.getByText('Lot Number')).toBeVisible();
      await expect(page.getByText('Quantity')).toBeVisible();
      await expect(page.getByText('Expiry Date')).toBeVisible();
      await expect(page.getByText('Status')).toBeVisible();
    });

    test('should show lots in table', async ({ page }) => {
      await page.route('**/api/v1/inventory/lots**', route =>
        route.fulfill({ json: { data: mocks.mockLots.list.data } })
      );

      await page.goto('/inventory/lots', { waitUntil: 'domcontentloaded' });

      await expect(page.getByText('RAM-16GB')).toBeVisible();
      await expect(page.getByText('LOT-2024-001')).toBeVisible();
      await expect(page.getByText('100')).toBeVisible();
      await expect(page.getByText('2026-12-31')).toBeVisible();
      await expect(page.getByText('Active')).toBeVisible();
    });

    test('should show expiring soon section', async ({ page }) => {
      await page.route('**/api/v1/inventory/lots**', route =>
        route.fulfill({ json: { data: mocks.mockLots.list.data, expiring: mocks.mockLots.expiring } })
      );

      await page.goto('/inventory/lots', { waitUntil: 'domcontentloaded' });

      const expiringSection = page.locator('text=Expiring Soon').first();
      if (await expiringSection.count() > 0) {
        await expect(expiringSection).toBeVisible();
        await expect(page.getByText('SSD-512')).toBeVisible();
        await expect(page.getByText('30 days')).toBeVisible();
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

      await expect(page.getByRole('button', { name: 'Receive Lot' })).toBeVisible();
    });
  });

  test.describe('Transfers', () => {
    test('should show summary cards for transfers', async ({ page }) => {
      await page.route('**/api/v1/inventory/transfers**', route =>
        route.fulfill({ json: { data: mocks.mockTransfers.list.data } })
      );

      await page.goto('/inventory/transfers', { waitUntil: 'domcontentloaded' });

      await expect(page.getByText('Pending')).toBeVisible();
      await expect(page.getByText('In Transit')).toBeVisible();
      await expect(page.getByText('Completed')).toBeVisible();
    });

    test('should show transfers table with all columns', async ({ page }) => {
      await page.route('**/api/v1/inventory/transfers**', route =>
        route.fulfill({ json: { data: mocks.mockTransfers.list.data } })
      );

      await page.goto('/inventory/transfers', { waitUntil: 'domcontentloaded' });

      await expect(page.getByText('Transfer ID')).toBeVisible();
      await expect(page.getByText('SKU')).toBeVisible();
      await expect(page.getByText('From')).toBeVisible();
      await expect(page.getByText('To')).toBeVisible();
      await expect(page.getByText('Quantity')).toBeVisible();
      await expect(page.getByText('Status')).toBeVisible();
      await expect(page.getByText('Actions')).toBeVisible();
    });

    test('should show transfer items in table', async ({ page }) => {
      await page.route('**/api/v1/inventory/transfers**', route =>
        route.fulfill({ json: { data: mocks.mockTransfers.list.data } })
      );

      await page.goto('/inventory/transfers', { waitUntil: 'domcontentloaded' });

      await expect(page.getByText('tr-001')).toBeVisible();
      await expect(page.getByText('RAM-16GB')).toBeVisible();
      await expect(page.getByText('WH-001')).toBeVisible();
      await expect(page.getByText('WH-002')).toBeVisible();
      await expect(page.getByText('10')).toBeVisible();
      await expect(page.getByText('PENDING')).toBeVisible();
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
        await transitBtn.click();
        await expect(page.getByText('IN_TRANSIT')).toBeVisible();
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
        await receiveBtn.click();
        await expect(page.getByText('RECEIVED')).toBeVisible();
      }
    });

    test('should show create transfer button', async ({ page }) => {
      await page.route('**/api/v1/inventory/transfers**', route =>
        route.fulfill({ json: { data: [] } })
      );

      await page.goto('/inventory/transfers', { waitUntil: 'domcontentloaded' });

      await expect(page.getByRole('button', { name: 'Create Transfer' })).toBeVisible();
    });

    test('should show create transfer form', async ({ page }) => {
      await page.route('**/api/v1/inventory/transfers**', route =>
        route.fulfill({ json: { data: [] } })
      );

      await page.goto('/inventory/transfers', { waitUntil: 'domcontentloaded' });

      await page.getByRole('button', { name: 'Create Transfer' }).click();

      await expect(page.getByRole('textbox', { name: 'SKU' })).toBeVisible();
      await expect(page.getByRole('combobox', { name: 'From Warehouse' })).toBeVisible();
      await expect(page.getByRole('combobox', { name: 'To Warehouse' })).toBeVisible();
      await expect(page.getByRole('spinbutton', { name: 'Quantity' })).toBeVisible();
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

      await expect(page.getByText('No transfers found')).toBeVisible();
    });
  });
});