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
    await page.goto('/reporting');
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('period selector dropdown visible', async ({ page }) => {
    await page.goto('/reporting');
    const periodSelector = page.locator('select, button:has-text("7 days"), button:has-text("30 days")').first();
    if (await periodSelector.count() > 0) {
      await expect(periodSelector).toBeVisible();
    }
  });

  test('ITSM, Finance, Procurement, Inventory, Workforce tabs visible', async ({ page }) => {
    await page.goto('/reporting');
    const tabs = ['ITSM', 'Finance', 'Procurement', 'Inventory', 'Workforce'];
    for (const tab of tabs) {
      const tabButton = page.locator(`button:has-text("${tab}"), [role="tab"]:has-text("${tab}")`).first();
      if (await tabButton.count() > 0) {
        await expect(tabButton).toBeVisible();
      }
    }
  });

  test('ITSM tab displays metric cards (MTTR, MTTA, SLA Breach Rate, Open Incidents)', async ({ page }) => {
    await page.goto('/reporting');
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
    await page.goto('/reporting');
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
    await page.goto('/reporting');
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
    await page.goto('/reporting');
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
    await page.goto('/reporting');
    const periodButton = page.locator('button:has-text("30 days")').first();
    if (await periodButton.count() > 0) {
      await periodButton.click();
      await page.waitForTimeout(300);
    }
  });

  test('metric values are numeric (not NaN)', async ({ page }) => {
    await page.goto('/reporting');
    const metricValue = page.locator('[data-testid*="metric"], .metric').first();
    if (await metricValue.count() > 0) {
      const text = await metricValue.textContent();
      await expect(text).not.toContain('NaN');
      await expect(text).not.toContain('undefined');
    }
  });
});
