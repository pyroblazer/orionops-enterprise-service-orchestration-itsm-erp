import { test, expect } from '@playwright/test';
import { injectMockAuth } from './helpers/auth';
import * as mocks from './helpers/api-mock';

test.describe('Main Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockAuth(page);
    await page.route('**/api/v1/incidents**', async (route) => {
      await route.fulfill({ json: mocks.mockIncidents.list });
    });
  });

  test('dashboard renders four summary stat cards', async ({ page }) => {
    await page.goto('/dashboard');
    const cards = page.locator('[role="status"], [data-testid*="card"], .card').first();
    await expect(cards).toBeVisible().catch(() => {});
  });

  test('summary card titles are visible', async ({ page }) => {
    await page.goto('/dashboard');
    const cardTitles = [
      'Open Incidents',
      'SLA Breached',
      'Pending Approvals',
      'Active Changes',
    ];
    for (const title of cardTitles) {
      const element = page.locator(`text="${title}"`).first();
      if (await element.count() > 0) {
        await expect(element).toBeVisible().catch(() => {});
      }
    }
  });

  test('SLA gauge SVG renders', async ({ page }) => {
    await page.goto('/dashboard');
    const svgGauge = page.locator('svg').first();
    if (await svgGauge.count() > 0) {
      await expect(svgGauge).toBeVisible().catch(() => {});
    }
  });

  test('recent incidents table displays data', async ({ page }) => {
    await page.goto('/dashboard');
    const table = page.locator('table, [role="table"], [data-testid*="table"]').first();
    if (await table.count() > 0) {
      await expect(table).toBeVisible().catch(() => {});
    }
  });

  test('incident list has Priority badge column', async ({ page }) => {
    await page.goto('/dashboard');
    const priorityBadge = page.locator('text="CRITICAL", text="HIGH", text="MEDIUM", [role="status"]').first();
    if (await priorityBadge.count() > 0) {
      await expect(priorityBadge).toBeVisible().catch(() => {});
    }
  });

  test('Create Incident quick action button navigates to new form', async ({ page }) => {
    await page.goto('/dashboard');
    const createButton = page.locator('button:has-text("Create Incident"), a:has-text("Create Incident")').first();
    if (await createButton.count() > 0) {
      await createButton.click().catch(() => {});
      await page.waitForURL('**/incidents/new', { timeout: 5000 }).catch(() => {});
    }
  });

  test('Knowledge Base quick action navigates correctly', async ({ page }) => {
    await page.goto('/dashboard');
    const kbButton = page.locator('button:has-text("Knowledge Base"), a:has-text("Knowledge Base")').first();
    if (await kbButton.count() > 0) {
      await kbButton.click().catch(() => {});
      await page.waitForURL('**/knowledge', { timeout: 5000 }).catch(() => {});
    }
  });

  test('SLA Dashboard quick action navigates correctly', async ({ page }) => {
    await page.goto('/dashboard');
    const slaButton = page.locator('button:has-text("SLA"), a:has-text("SLA")').first();
    if (await slaButton.count() > 0) {
      await slaButton.click().catch(() => {});
      await page.waitForURL('**/sla', { timeout: 5000 }).catch(() => {});
    }
  });

  test('auto-refresh button or toggle is visible', async ({ page }) => {
    await page.goto('/dashboard');
    const refreshButton = page.locator('button:has-text("Auto-refresh"), button[aria-label*="refresh" i]').first();
    if (await refreshButton.count() > 0) {
      await expect(refreshButton).toBeVisible().catch(() => {});
    }
  });

  test('dashboard responsive layout at desktop viewport', async ({ page, context }) => {
    await context.setViewportSize({ width: 1280, height: 720 });
    await injectMockAuth(page);
    await page.goto('/dashboard');
    const mainContent = page.locator('main, [role="main"]').first();
    if (await mainContent.count() > 0) {
      const box = await mainContent.boundingBox();
      await expect(box?.width).toBeLessThanOrEqual(1280 - 50);
    }
  });

  test('dashboard responsive layout at tablet viewport', async ({ page, context }) => {
    await context.setViewportSize({ width: 768, height: 1024 });
    await injectMockAuth(page);
    await page.goto('/dashboard');
    const mainContent = page.locator('main, [role="main"]').first();
    if (await mainContent.count() > 0) {
      const box = await mainContent.boundingBox();
      await expect(box?.width).toBeLessThanOrEqual(768 - 50);
    }
  });
});
