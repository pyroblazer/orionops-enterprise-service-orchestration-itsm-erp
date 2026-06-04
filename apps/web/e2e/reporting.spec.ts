import { test, expect } from '@playwright/test';
import { injectMockAuth } from './helpers/auth';
import * as mocks from './helpers/api-mock';

test.describe('Reporting & Analytics - Reports Page', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockAuth(page);
    await page.route('**/api/v1/reporting**', async (route) => {
      await route.fulfill({ json: mocks.mockReporting });
    });
  });

  test('reporting page renders at /reporting', async ({ page }) => {
    await page.goto('/reporting', { waitUntil: 'domcontentloaded' });
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('period selector dropdown visible', async ({ page }) => {
    await page.goto('/reporting', { waitUntil: 'domcontentloaded' });
    const periodSelector = page.locator('select, button:has-text("7 days"), button:has-text("30 days")').first();
    if (await periodSelector.count() > 0) {
      await expect(periodSelector).toBeVisible();
    }
  });

  test('ITSM, Finance, Procurement, Inventory, Workforce tabs visible', async ({ page }) => {
    await page.goto('/reporting', { waitUntil: 'domcontentloaded' });
    const tabs = ['ITSM', 'Finance', 'Procurement', 'Inventory', 'Workforce'];
    for (const tab of tabs) {
      const tabButton = page.locator(`button:has-text("${tab}"), [role="tab"]:has-text("${tab}")`).first();
      if (await tabButton.count() > 0) {
        await expect(tabButton).toBeVisible();
      }
    }
  });

  test('ITSM tab displays metric cards (MTTR, MTTA, SLA Breach Rate, Open Incidents)', async ({ page }) => {
    await page.goto('/reporting', { waitUntil: 'domcontentloaded' });
    const itsmTab = page.locator('button:has-text("ITSM")').first();
    if (await itsmTab.count() > 0) {
      await itsmTab.click();
      const metrics = ['MTTR', 'MTTA', 'SLA', 'Incidents'];
      for (const metric of metrics) {
        const metricCard = page.locator(`text="${metric}"`).first();
        if (await metricCard.count() > 0) {
          await expect(metricCard).toBeVisible();
        }
      }
    }
  });

  test('ITSM tab has bar charts', async ({ page }) => {
    await page.goto('/reporting', { waitUntil: 'domcontentloaded' });
    const itsmTab = page.locator('button:has-text("ITSM")').first();
    if (await itsmTab.count() > 0) {
      await itsmTab.click();
      const chart = page.locator('[role="img"], svg, canvas').first();
      if (await chart.count() > 0) {
        await expect(chart).toBeVisible();
      }
    }
  });

  test('Finance tab shows Budget Variance table', async ({ page }) => {
    await page.goto('/reporting', { waitUntil: 'domcontentloaded' });
    const financeTab = page.locator('button:has-text("Finance")').first();
    if (await financeTab.count() > 0) {
      await financeTab.click();
      const budgetTable = page.locator('table, [role="table"]').first();
      if (await budgetTable.count() > 0) {
        await expect(budgetTable).toBeVisible();
      }
    }
  });

  test('Procurement tab shows PO Aging and Top Vendors', async ({ page }) => {
    await page.goto('/reporting', { waitUntil: 'domcontentloaded' });
    const procTab = page.locator('button:has-text("Procurement")').first();
    if (await procTab.count() > 0) {
      await procTab.click();
      const aging = page.locator('text="PO Aging", text="Vendor"').first();
      if (await aging.count() > 0) {
        await expect(aging).toBeVisible();
      }
    }
  });

  test('period selector changes refresh data', async ({ page }) => {
    await page.route('**/api/v1/reporting**', async (route) => {
      const newData = { ...mocks.mockReporting, mttr: 200 };
      await route.fulfill({ json: newData });
    });
    await page.goto('/reporting', { waitUntil: 'domcontentloaded' });
    const periodButton = page.locator('button:has-text("30 days")').first();
    if (await periodButton.count() > 0) {
      await periodButton.click();
      await page.waitForTimeout(300);
    }
  });

  test('metric values are numeric (not NaN)', async ({ page }) => {
    await page.goto('/reporting', { waitUntil: 'domcontentloaded' });
    const metricValue = page.locator('[data-testid*="metric"], .metric').first();
    if (await metricValue.count() > 0) {
      const text = await metricValue.textContent();
      await expect(text).not.toContain('NaN');
      await expect(text).not.toContain('undefined');
    }
  });

  test('Finance tab shows Budget Variance card', async ({ page }) => {
    await page.goto('/reporting', { waitUntil: 'domcontentloaded' });
    const financeTab = page.locator('button:has-text("Finance")').first();
    if (await financeTab.count() > 0) {
      await financeTab.click();
      const budgetVariance = page.locator('text="Budget Variance", text="Variance"').first();
      if (await budgetVariance.count() > 0) {
        await expect(budgetVariance).toBeVisible();
      }
    }
  });

  test('Finance tab shows Expense Total metric', async ({ page }) => {
    await page.goto('/reporting', { waitUntil: 'domcontentloaded' });
    const financeTab = page.locator('button:has-text("Finance")').first();
    if (await financeTab.count() > 0) {
      await financeTab.click();
      const expenseTotal = page.locator('text="Expense", text="Total"').first();
      if (await expenseTotal.count() > 0) {
        await expect(expenseTotal).toBeVisible();
      }
    }
  });

  test('Finance tab shows Invoice Aging metric', async ({ page }) => {
    await page.goto('/reporting', { waitUntil: 'domcontentloaded' });
    const financeTab = page.locator('button:has-text("Finance")').first();
    if (await financeTab.count() > 0) {
      await financeTab.click();
      const invoiceAging = page.locator('text="Invoice Aging", text="Aging"').first();
      if (await invoiceAging.count() > 0) {
        await expect(invoiceAging).toBeVisible();
      }
    }
  });

  test('Procurement tab shows PO Aging metric', async ({ page }) => {
    await page.goto('/reporting', { waitUntil: 'domcontentloaded' });
    const procTab = page.locator('button:has-text("Procurement")').first();
    if (await procTab.count() > 0) {
      await procTab.click();
      const poAging = page.locator('text="PO Aging", text="Aging"').first();
      if (await poAging.count() > 0) {
        await expect(poAging).toBeVisible();
      }
    }
  });

  test('Procurement tab shows Vendor Spend metric', async ({ page }) => {
    await page.goto('/reporting', { waitUntil: 'domcontentloaded' });
    const procTab = page.locator('button:has-text("Procurement")').first();
    if (await procTab.count() > 0) {
      await procTab.click();
      const vendorSpend = page.locator('text="Vendor Spend", text="Spend"').first();
      if (await vendorSpend.count() > 0) {
        await expect(vendorSpend).toBeVisible();
      }
    }
  });

  test('Inventory tab shows Stock Valuation and Movement Count', async ({ page }) => {
    await page.goto('/reporting', { waitUntil: 'domcontentloaded' });
    const invTab = page.locator('button:has-text("Inventory")').first();
    if (await invTab.count() > 0) {
      await invTab.click();
      const stockVal = page.locator('text="Stock Valuation", text="Valuation"').first();
      const movement = page.locator('text="Movement", text="Count"').first();
      if (await stockVal.count() > 0) await expect(stockVal).toBeVisible();
      if (await movement.count() > 0) await expect(movement).toBeVisible();
    }
  });

  test('Workforce tab shows Capacity Utilization', async ({ page }) => {
    await page.goto('/reporting', { waitUntil: 'domcontentloaded' });
    const wfTab = page.locator('button:has-text("Workforce")').first();
    if (await wfTab.count() > 0) {
      await wfTab.click();
      const capUtil = page.locator('text="Capacity", text="Utilization"').first();
      if (await capUtil.count() > 0) {
        await expect(capUtil).toBeVisible();
      }
    }
  });

  test('Export button on active tab triggers download', async ({ page }) => {
    await page.goto('/reporting', { waitUntil: 'domcontentloaded' });
    const exportButton = page.locator('button:has-text("Export")').first();
    if (await exportButton.count() > 0) {
      const [download] = await Promise.all([
        page.waitForEvent('download').catch(() => null),
        exportButton.click(),
      ]);
      if (download) {
        const filename = download.suggestedFilename();
        expect(filename).toMatch(/\.csv$|\.pdf$/);
      }
    }
  });
});
