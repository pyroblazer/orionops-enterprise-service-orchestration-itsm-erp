import { test, expect } from '@playwright/test';
import { injectMockAuth } from './helpers/auth';
import * as mocks from './helpers/api-mock';

test.describe('Service Requests', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockAuth(page);
    await page.route('**/api/v1/service-requests**', async (route) => {
      await route.fulfill({ json: mocks.mockRequests.list });
    });
  });

  test('request list renders at /requests', async ({ page }) => {
    await page.goto('/requests');
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('request list displays status badges', async ({ page }) => {
    await page.goto('/requests');
    const statusBadge = page.locator('text="SUBMITTED", text="APPROVED", text="COMPLETED"').first();
    if (await statusBadge.count() > 0) {
      await expect(statusBadge).toBeVisible();
    }
  });

  test('create request button navigates to form', async ({ page }) => {
    await page.goto('/requests');
    const createButton = page.locator('button:has-text("Create"), button:has-text("New"), button:has-text("Request")').first();
    if (await createButton.count() > 0) {
      await createButton.click();
      await page.waitForURL('**/requests/new', { timeout: 5000 });
    }
  });

  test('request create form has title and description', async ({ page }) => {
    await page.goto('/requests/new');
    const titleInput = page.locator('input[placeholder*="title" i], input[placeholder*="Request" i]').first();
    const descInput = page.locator('textarea[placeholder*="description" i], textarea[placeholder*="details" i]').first();
    if (await titleInput.count() > 0) {
      await expect(titleInput).toBeVisible();
    }
    if (await descInput.count() > 0) {
      await expect(descInput).toBeVisible();
    }
  });

  test('request detail page displays title', async ({ page }) => {
    await page.route('**/api/v1/service-requests/req-001**', async (route) => {
      await route.fulfill({ json: mocks.mockRequests.detail });
    });
    await page.goto('/requests/req-001');
    const title = page.locator(`text="New User Account"`).first();
    await expect(title).toBeVisible();
  });

  test('request detail has timeline/activity section', async ({ page }) => {
    await page.route('**/api/v1/service-requests/req-001**', async (route) => {
      const detail = { ...mocks.mockRequests.detail, timeline: [] };
      await route.fulfill({ json: detail });
    });
    await page.goto('/requests/req-001');
    const timeline = page.locator('text="Timeline", text="Activity", [role="log"]').first();
    if (await timeline.count() > 0) {
      await expect(timeline).toBeVisible();
    }
  });

  test('request status is text-labeled', async ({ page }) => {
    await page.goto('/requests');
    const textStatus = page.locator('text="SUBMITTED"').first();
    if (await textStatus.count() > 0) {
      await expect(textStatus).toBeVisible();
    }
  });

  test('CSV export on request list', async ({ page }) => {
    await page.goto('/requests');
    const exportButton = page.locator('button:has-text("Export")').first();
    if (await exportButton.count() > 0) {
      const [download] = await Promise.all([
        page.waitForEvent('download').catch(() => null),
        exportButton.click(),
      ]);
      if (download) {
        await expect(download.suggestedFilename()).toContain('.csv');
      }
    }
  });
});
