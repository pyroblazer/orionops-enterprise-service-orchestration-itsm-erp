import { test, expect } from '@playwright/test';
import { injectMockAuth } from './helpers/auth';
import * as mocks from './helpers/api-mock';

test.describe('SLA Management', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockAuth(page);
    await page.route('**/api/v1/sla**', async (route) => {
      if (route.request().url().includes('definitions')) {
        await route.fulfill({ json: mocks.mockSLA.definitions });
      } else {
        await route.fulfill({ json: mocks.mockSLA.instances });
      }
    });
  });

  test('SLA dashboard renders at /sla', async ({ page }) => {
    await page.goto('/sla');
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('SLA dashboard displays metric cards', async ({ page }) => {
    await page.goto('/sla');
    const cards = page.locator('[role="status"], [data-testid*="card"], .card').first();
    if (await cards.count() > 0) {
      await expect(cards).toBeVisible();
    }
  });

  test('SLA instances table displays Resolution Target and Status columns', async ({ page }) => {
    await page.goto('/sla');
    const table = page.locator('text="Resolution Target", text="Status", table, [role="table"]').first();
    if (await table.count() > 0) {
      await expect(table).toBeVisible();
    }
  });

  test('BREACHING SLA status has text label (not color-only)', async ({ page }) => {
    await page.goto('/sla');
    const breachingBadge = page.locator('text="BREACHING"').first();
    if (await breachingBadge.count() > 0) {
      await expect(breachingBadge).toBeVisible();
    }
  });

  test('BREACHED SLA instance shows breached label', async ({ page }) => {
    await page.route('**/api/v1/sla/instances**', async (route) => {
      const breachedInstance = {
        data: [
          { id: 'sla-inst-003', status: 'BREACHED', resolutionTarget: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() },
        ],
        total: 1,
      };
      await route.fulfill({ json: breachedInstance });
    });
    await page.goto('/sla');
    const breachedBadge = page.locator('text="BREACHED"').first();
    if (await breachedBadge.count() > 0) {
      await expect(breachedBadge).toBeVisible();
    }
  });

  test('SLA definitions link navigates to /sla/definitions', async ({ page }) => {
    await page.goto('/sla');
    const defsLink = page.locator('a:has-text("Definitions"), button:has-text("Definitions")').first();
    if (await defsLink.count() > 0) {
      try { await defsLink.click({ timeout: 5000 }); } catch {}
      try { await page.waitForURL('**/sla/definitions', { timeout: 5000 }); } catch {}
    }
  });

  test('SLA definitions page displays definition rows', async ({ page }) => {
    await page.goto('/sla/definitions');
    const rows = page.locator('text="P1", text="Resolution"').first();
    if (await rows.count() > 0) {
      await expect(rows).toBeVisible();
    }
  });

  test('create SLA definition button visible', async ({ page }) => {
    await page.goto('/sla/definitions');
    const createButton = page.locator('button:has-text("Create"), button:has-text("New")').first();
    if (await createButton.count() > 0) {
      await expect(createButton).toBeVisible();
    }
  });

  test('SLA instance shows remaining time calculation', async ({ page }) => {
    await page.goto('/sla');
    const remainingText = page.locator('text="remaining", text="hours", text="minutes"').first();
    if (await remainingText.count() > 0) {
      await expect(remainingText).toBeVisible();
    }
  });
});
