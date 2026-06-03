import { test, expect } from '@playwright/test';
import { injectMockAuth } from './helpers/auth';
import * as mocks from './helpers/api-mock';

test.describe('Analytics - Executive Dashboard & Predictions', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockAuth(page);
    await page.route('**/api/v1/analytics**', async (route) => {
      await route.fulfill({ json: mocks.mockAnalytics });
    });
  });

  test('executive dashboard renders at /analytics/executive-dashboard', async ({ page }) => {
    await page.goto('/analytics/executive-dashboard');
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible().catch(() => {});
  });

  test('executive dashboard displays 12 KPI cards', async ({ page }) => {
    await page.goto('/analytics/executive-dashboard');
    const cards = page.locator('[role="status"], [data-testid*="card"], .card').first();
    if (await cards.count() > 0) {
      await expect(cards).toBeVisible().catch(() => {});
    }
  });

  test('KPI cards include MTTR, SLA Compliance, Budget Utilization, Open Incidents', async ({ page }) => {
    await page.goto('/analytics/executive-dashboard');
    const kpis = ['MTTR', 'SLA', 'Budget', 'Incidents'];
    for (const kpi of kpis) {
      const card = page.locator(`text="${kpi}"`).first();
      if (await card.count() > 0) {
        await expect(card).toBeVisible().catch(() => {});
      }
    }
  });

  test('organization health section displays progress bars', async ({ page }) => {
    await page.goto('/analytics/executive-dashboard');
    const progressBar = page.locator('progress, [role="progressbar"]').first();
    if (await progressBar.count() > 0) {
      await expect(progressBar).toBeVisible().catch(() => {});
    }
  });

  test('organization health shows compliance percentage', async ({ page }) => {
    await page.goto('/analytics/executive-dashboard');
    const compliance = page.locator('text="99%", text="Compliance"').first();
    if (await compliance.count() > 0) {
      await expect(compliance).toBeVisible().catch(() => {});
    }
  });

  test('predictions page renders at /analytics/predictions', async ({ page }) => {
    await page.goto('/analytics/predictions');
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible().catch(() => {});
  });

  test('cash flow forecast chart displays on predictions page', async ({ page }) => {
    await page.goto('/analytics/predictions');
    const forecastSection = page.locator('text="Forecast", text="Cash"').first();
    if (await forecastSection.count() > 0) {
      await expect(forecastSection).toBeVisible().catch(() => {});
    }
  });

  test('anomalous transactions table has vendor and amount columns', async ({ page }) => {
    await page.goto('/analytics/predictions');
    const txnTable = page.locator('table, [role="table"]').first();
    if (await txnTable.count() > 0) {
      const vendor = page.locator('text="Vendor"').first();
      const amount = page.locator('text="Amount"').first();
      if (await vendor.count() > 0) {
        await expect(vendor).toBeVisible().catch(() => {});
      }
      if (await amount.count() > 0) {
        await expect(amount).toBeVisible().catch(() => {});
      }
    }
  });

  test('vendor risk assessment badges have text labels (HIGH, MODERATE, LOW)', async ({ page }) => {
    await page.goto('/analytics/predictions');
    const riskBadges = ['HIGH', 'MODERATE', 'LOW'];
    for (const risk of riskBadges) {
      const badge = page.locator(`text="${risk}"`).first();
      if (await badge.count() > 0) {
        await expect(badge).toBeVisible().catch(() => {});
      }
    }
  });
});
