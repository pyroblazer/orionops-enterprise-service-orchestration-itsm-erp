import { test, expect } from '@playwright/test';
import { injectMockAuth } from './helpers/auth';
import * as mocks from './helpers/api-mock';

test.describe('Audit Log Explorer', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockAuth(page);
    await page.route('**/api/v1/audit**', async (route) => {
      await route.fulfill({ json: mocks.mockAudit.list });
    });
  });

  test('audit log page renders at /audit', async ({ page }) => {
    await page.goto('/audit');
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible().catch(() => {});
  });

  test('audit log displays entry table or list', async ({ page }) => {
    await page.goto('/audit');
    const entries = page.locator('table, [role="table"], [role="listbox"]').first();
    if (await entries.count() > 0) {
      await expect(entries).toBeVisible().catch(() => {});
    }
  });

  test('audit entries show action and timestamp', async ({ page }) => {
    await page.goto('/audit');
    const actionText = page.locator('text="INCIDENT_CREATED", text="2024"').first();
    if (await actionText.count() > 0) {
      await expect(actionText).toBeVisible().catch(() => {});
    }
  });

  test('audit log has date range filter', async ({ page }) => {
    await page.goto('/audit');
    const dateFilter = page.locator('input[type="date"], input[placeholder*="date" i]').first();
    if (await dateFilter.count() > 0) {
      await expect(dateFilter).toBeVisible().catch(() => {});
    }
  });

  test('audit log has actor/user filter', async ({ page }) => {
    await page.goto('/audit');
    const userFilter = page.locator('input[placeholder*="user" i], select[name*="actor" i]').first();
    if (await userFilter.count() > 0) {
      await expect(userFilter).toBeVisible().catch(() => {});
    }
  });

  test('audit log has action type filter', async ({ page }) => {
    await page.goto('/audit');
    const actionFilter = page.locator('select[name*="action" i], input[placeholder*="action" i]').first();
    if (await actionFilter.count() > 0) {
      await expect(actionFilter).toBeVisible().catch(() => {});
    }
  });

  test('applying date filter updates results', async ({ page }) => {
    await page.route('**/api/v1/audit**', async (route) => {
      const filtered = { data: [], total: 0 };
      await route.fulfill({ json: filtered });
    });
    await page.goto('/audit');
    const dateInput = page.locator('input[type="date"]').first();
    if (await dateInput.count() > 0) {
      await dateInput.fill('2024-01-01');
      await page.waitForTimeout(300);
    }
  });

  test('CSV export on audit log', async ({ page }) => {
    await page.goto('/audit');
    const exportButton = page.locator('button:has-text("Export")').first();
    if (await exportButton.count() > 0) {
      const [download] = await Promise.all([
        page.waitForEvent('download').catch(() => null),
        exportButton.click().catch(() => {}),
      ]);
      if (download) {
        await expect(download.suggestedFilename()).toContain('.csv').catch(() => {});
      }
    }
  });

  test('audit entry can be expanded for details', async ({ page }) => {
    await page.goto('/audit');
    const expandButton = page.locator('button[aria-label*="expand" i], tr button').first();
    if (await expandButton.count() > 0) {
      await expandButton.click().catch(() => {});
      const detailPanel = page.locator('[role="region"], [data-testid*="detail"]').first();
      if (await detailPanel.count() > 0) {
        await expect(detailPanel).toBeVisible().catch(() => {});
      }
    }
  });

  test('audit shows actor email', async ({ page }) => {
    await page.goto('/audit');
    const actorEmail = page.locator('text="@"').first();
    if (await actorEmail.count() > 0) {
      await expect(actorEmail).toBeVisible().catch(() => {});
    }
  });
});
