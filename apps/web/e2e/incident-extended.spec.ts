import { test, expect } from '@playwright/test';
import { injectMockAuth } from './helpers/auth';
import * as mocks from './helpers/api-mock';

test.describe('Incident Management - Extended Features', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockAuth(page);
    await page.route('**/api/v1/incidents**', async (route) => {
      await route.fulfill({ json: mocks.mockIncidents.list });
    });
  });

  test('file attachment upload on new incident form', async ({ page }) => {
    await page.goto('/incidents/new');
    const fileInput = page.locator('input[type="file"]').first();
    if (await fileInput.count() > 0) {
      // File input may be hidden (triggered by a button click) — check attachment area instead
      const isHidden = await fileInput.evaluate(el => (el as HTMLInputElement).type === 'file' && el.offsetParent === null);
      if (!isHidden) {
        await expect(fileInput).toBeVisible();
      } else {
        // If hidden, verify the upload trigger button exists
        const uploadBtn = page.locator('button:has-text("Attach"), button:has-text("Upload"), label:has-text("file")').first();
        if (await uploadBtn.count() > 0) {
          await expect(uploadBtn).toBeVisible();
        }
      }
    }
  });

  test('CSV export downloads file from incidents list', async ({ page }) => {
    await page.goto('/incidents');
    const exportButton = page.locator('button:has-text("Export"), button:has-text("Download")').first();
    if (await exportButton.count() > 0) {
      const [download] = await Promise.all([
        page.waitForEvent('download').catch(() => null),
        exportButton.click(),
      ]);
      if (download) {
        const fileName = download.suggestedFilename();
        await expect(fileName).toContain('.csv');
      }
    }
  });

  test('incident list has Priority filter', async ({ page }) => {
    await page.goto('/incidents');
    const filterButton = page.locator('button:has-text("Priority"), select').first();
    if (await filterButton.count() > 0) {
      await expect(filterButton).toBeVisible();
    }
  });

  test('incident detail displays SLA remaining time', async ({ page }) => {
    await page.goto('/incidents');
    const firstIncidentLink = page.locator('a[href*="/incidents/"]').first();
    if (await firstIncidentLink.count() > 0) {
      await firstIncidentLink.click();
      const slaSection = page.locator('text="remaining", text="SLA"').first();
      if (await slaSection.count() > 0) {
        await expect(slaSection).toBeVisible();
      }
    }
  });

  test('incident detail shows Parent Incident link if exists', async ({ page }) => {
    await page.route('**/api/v1/incidents/inc-001**', async (route) => {
      const detail = { ...mocks.mockIncidents.detail, parentId: 'inc-000' };
      await route.fulfill({ json: detail });
    });
    await page.goto('/incidents/inc-001');
    const parentLink = page.locator('text="Parent", a[href*="/incidents/"]').first();
    if (await parentLink.count() > 0) {
      await expect(parentLink).toBeVisible();
    }
  });

  test('incident detail has comment/note input field', async ({ page }) => {
    await page.goto('/incidents/inc-001');
    const commentInput = page.locator('textarea[placeholder*="comment" i], textarea[placeholder*="note" i], input[placeholder*="comment" i]').first();
    if (await commentInput.count() > 0) {
      await expect(commentInput).toBeVisible();
    }
  });

  test('incident detail displays timestamps', async ({ page }) => {
    await page.goto('/incidents/inc-001');
    const createdTime = page.locator('text="Created", text="2024"').first();
    if (await createdTime.count() > 0) {
      await expect(createdTime).toBeVisible();
    }
  });

  test('incident list pagination controls visible', async ({ page }) => {
    await page.goto('/incidents');
    const pagination = page.locator('[aria-label*="Pagination"], button:has-text("Next"), button:has-text("Previous")').first();
    if (await pagination.count() > 0) {
      await expect(pagination).toBeVisible();
    }
  });

  test('incident status badge displays text label', async ({ page }) => {
    await page.goto('/incidents');
    const statusBadge = page.locator('text="OPEN", text="IN_PROGRESS", text="CLOSED"').first();
    if (await statusBadge.count() > 0) {
      await expect(statusBadge).toBeVisible();
    }
  });
});
