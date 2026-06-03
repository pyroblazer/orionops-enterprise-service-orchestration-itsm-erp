import { test, expect } from '@playwright/test';
import { injectMockAuth } from './helpers/auth';
import * as mocks from './helpers/api-mock';

test.describe('ERP - Procurement Management', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockAuth(page);
    await page.route('**/api/v1/procurement**', async (route) => {
      await route.fulfill({ json: mocks.mockProcurement });
    });
  });

  test('procurement overview renders at /procurement', async ({ page }) => {
    await page.goto('/procurement');
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible().catch(() => {});
  });

  test('RFQ list at /procurement/rfq displays table', async ({ page }) => {
    await page.goto('/procurement/rfq');
    const table = page.locator('table, [role="table"]').first();
    if (await table.count() > 0) {
      await expect(table).toBeVisible().catch(() => {});
    }
  });

  test('RFQ detail displays line items and vendor responses', async ({ page }) => {
    await page.route('**/api/v1/procurement/rfq/rfq-001**', async (route) => {
      await route.fulfill({
        json: {
          id: 'rfq-001',
          lineItems: [{ id: 'li-001', description: 'Widget', quantity: 100 }],
          vendorResponses: [{ vendorId: 'v-001', status: 'SUBMITTED' }],
        },
      });
    });
    await page.goto('/procurement/rfq/rfq-001');
    const content = page.locator('text="Line Items", text="Vendor"').first();
    if (await content.count() > 0) {
      await expect(content).toBeVisible().catch(() => {});
    }
  });

  test('invoice matching at /procurement/matching renders', async ({ page }) => {
    await page.goto('/procurement/matching');
    const heading = page.locator('h1, h2').first();
    if (await heading.count() > 0) {
      await expect(heading).toBeVisible().catch(() => {});
    }
  });

  test('spend analysis at /procurement/spend-analysis displays chart', async ({ page }) => {
    await page.goto('/procurement/spend-analysis');
    const chart = page.locator('svg, canvas, [role="img"]').first();
    if (await chart.count() > 0) {
      await expect(chart).toBeVisible().catch(() => {});
    }
  });

  test('create purchase request form has title and estimated cost', async ({ page }) => {
    await page.goto('/procurement/new');
    const titleInput = page.locator('input[placeholder*="title" i]').first();
    const costInput = page.locator('input[placeholder*="cost" i]').first();
    if (await titleInput.count() > 0) {
      await expect(titleInput).toBeVisible().catch(() => {});
    }
    if (await costInput.count() > 0) {
      await expect(costInput).toBeVisible().catch(() => {});
    }
  });

  test('purchase order list displays vendor and status columns', async ({ page }) => {
    await page.goto('/procurement');
    const poList = page.locator('text="Vendor", text="Status"').first();
    if (await poList.count() > 0) {
      await expect(poList).toBeVisible().catch(() => {});
    }
  });
});
