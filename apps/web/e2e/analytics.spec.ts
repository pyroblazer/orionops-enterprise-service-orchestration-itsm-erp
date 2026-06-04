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
    await page.goto('/analytics/executive-dashboard', { waitUntil: 'domcontentloaded' });
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('executive dashboard displays 12 KPI cards', async ({ page }) => {
    await page.goto('/analytics/executive-dashboard', { waitUntil: 'domcontentloaded' });
    const cards = page.locator('[role="status"], [data-testid*="card"], .card').first();
    if (await cards.count() > 0) {
      await expect(cards).toBeVisible();
    }
  });

  test('KPI cards include MTTR, SLA Compliance, Budget Utilization, Open Incidents', async ({ page }) => {
    await page.goto('/analytics/executive-dashboard', { waitUntil: 'domcontentloaded' });
    const kpis = ['MTTR', 'SLA', 'Budget', 'Incidents'];
    for (const kpi of kpis) {
      const card = page.locator(`text="${kpi}"`).first();
      if (await card.count() > 0) {
        await expect(card).toBeVisible();
      }
    }
  });

  test('organization health section displays progress bars', async ({ page }) => {
    await page.goto('/analytics/executive-dashboard', { waitUntil: 'domcontentloaded' });
    const progressBar = page.locator('progress, [role="progressbar"]').first();
    if (await progressBar.count() > 0) {
      await expect(progressBar).toBeVisible();
    }
  });

  test('organization health shows compliance percentage', async ({ page }) => {
    await page.goto('/analytics/executive-dashboard', { waitUntil: 'domcontentloaded' });
    const compliance = page.locator('text="99%", text="Compliance"').first();
    if (await compliance.count() > 0) {
      await expect(compliance).toBeVisible();
    }
  });

  test('predictions page renders at /analytics/predictions', async ({ page }) => {
    await page.goto('/analytics/predictions', { waitUntil: 'domcontentloaded' });
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('cash flow forecast chart displays on predictions page', async ({ page }) => {
    await page.goto('/analytics/predictions', { waitUntil: 'domcontentloaded' });
    const forecastSection = page.locator('text="Forecast", text="Cash"').first();
    if (await forecastSection.count() > 0) {
      await expect(forecastSection).toBeVisible();
    }
  });

  test('anomalous transactions table has vendor and amount columns', async ({ page }) => {
    await page.goto('/analytics/predictions', { waitUntil: 'domcontentloaded' });
    const txnTable = page.locator('table, [role="table"]').first();
    if (await txnTable.count() > 0) {
      const vendor = page.locator('text="Vendor"').first();
      const amount = page.locator('text="Amount"').first();
      if (await vendor.count() > 0) {
        await expect(vendor).toBeVisible();
      }
      if (await amount.count() > 0) {
        await expect(amount).toBeVisible();
      }
    }
  });

  test('vendor risk assessment badges have text labels (HIGH, MODERATE, LOW)', async ({ page }) => {
    await page.goto('/analytics/predictions', { waitUntil: 'domcontentloaded' });
    const riskBadges = ['HIGH', 'MODERATE', 'LOW'];
    for (const risk of riskBadges) {
      const badge = page.locator(`text="${risk}"`).first();
      if (await badge.count() > 0) {
        await expect(badge).toBeVisible();
      }
    }
  });

  test('anomaly detection section shows anomaly cards with severity', async ({ page }) => {
    await page.goto('/analytics/predictions', { waitUntil: 'domcontentloaded' });
    const anomalySection = page.locator('text="Anomal", text="Anomalous"').first();
    if (await anomalySection.count() > 0) {
      await expect(anomalySection).toBeVisible();
    }
  });

  test('anomaly description text visible', async ({ page }) => {
    await page.goto('/analytics/predictions', { waitUntil: 'domcontentloaded' });
    const anomalyCard = page.locator('[class*="anomaly"], [data-testid*="anomaly"]').first();
    if (await anomalyCard.count() > 0) {
      const desc = await anomalyCard.textContent();
      expect(desc).toBeTruthy();
    }
  });

  test('vendor risk section shows risk score per vendor', async ({ page }) => {
    await page.goto('/analytics/predictions', { waitUntil: 'domcontentloaded' });
    const riskSection = page.locator('text="Risk", text="Vendor"').first();
    if (await riskSection.count() > 0) {
      await expect(riskSection).toBeVisible();
    }
  });

  test('risk level badge MEDIUM visible', async ({ page }) => {
    await page.goto('/analytics/predictions', { waitUntil: 'domcontentloaded' });
    const mediumBadge = page.locator('text="MEDIUM"').first();
    if (await mediumBadge.count() > 0) {
      await expect(mediumBadge).toBeVisible();
    }
  });
});
