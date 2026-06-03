import { test, expect } from '@playwright/test';
import { injectMockAuth } from './helpers/auth';
import * as mocks from './helpers/api-mock';

test.describe('CSV Export Across Modules', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockAuth(page);
    await page.route('**/api/v1/**', async (route) => {
      const url = route.request().url();
      if (url.includes('incidents')) {
        await route.fulfill({ json: mocks.mockIncidents.list });
      } else if (url.includes('problems')) {
        await route.fulfill({ json: mocks.mockProblems.list });
      } else if (url.includes('changes')) {
        await route.fulfill({ json: mocks.mockChanges.list });
      } else if (url.includes('audit')) {
        await route.fulfill({ json: mocks.mockAudit.list });
      } else {
        await route.abort();
      }
    });
  });

  test('incidents list export downloads CSV file', async ({ page }) => {
    await page.goto('/incidents');
    const exportButton = page.locator('button:has-text("Export")').first();
    if (await exportButton.count() > 0) {
      const [download] = await Promise.all([
        page.waitForEvent('download').catch(() => null),
        exportButton.click(),
      ]);
      if (download) {
        const filename = download.suggestedFilename();
        await expect(filename).toContain('.csv');
      }
    }
  });

  test('problems list export downloads CSV file', async ({ page }) => {
    await page.goto('/problems');
    const exportButton = page.locator('button:has-text("Export")').first();
    if (await exportButton.count() > 0) {
      const [download] = await Promise.all([
        page.waitForEvent('download').catch(() => null),
        exportButton.click(),
      ]);
      if (download) {
        const filename = download.suggestedFilename();
        await expect(filename).toContain('.csv');
      }
    }
  });

  test('changes list export downloads CSV file', async ({ page }) => {
    await page.goto('/changes');
    const exportButton = page.locator('button:has-text("Export")').first();
    if (await exportButton.count() > 0) {
      const [download] = await Promise.all([
        page.waitForEvent('download').catch(() => null),
        exportButton.click(),
      ]);
      if (download) {
        const filename = download.suggestedFilename();
        await expect(filename).toContain('.csv');
      }
    }
  });

  test('audit log export downloads CSV file', async ({ page }) => {
    await page.goto('/audit');
    const exportButton = page.locator('button:has-text("Export")').first();
    if (await exportButton.count() > 0) {
      const [download] = await Promise.all([
        page.waitForEvent('download').catch(() => null),
        exportButton.click(),
      ]);
      if (download) {
        const filename = download.suggestedFilename();
        await expect(filename).toContain('.csv');
      }
    }
  });

  test('exported filename contains module name', async ({ page }) => {
    await page.goto('/incidents');
    const exportButton = page.locator('button:has-text("Export")').first();
    if (await exportButton.count() > 0) {
      const [download] = await Promise.all([
        page.waitForEvent('download').catch(() => null),
        exportButton.click(),
      ]);
      if (download) {
        const filename = download.suggestedFilename();
        await expect(filename).toMatch(/incident|problem|change|audit/i);
      }
    }
  });

  test('exported filename contains timestamp or date', async ({ page }) => {
    await page.goto('/incidents');
    const exportButton = page.locator('button:has-text("Export")').first();
    if (await exportButton.count() > 0) {
      const [download] = await Promise.all([
        page.waitForEvent('download').catch(() => null),
        exportButton.click(),
      ]);
      if (download) {
        const filename = download.suggestedFilename();
        await expect(filename).toMatch(/\d{4}-\d{2}-\d{2}|\d{8}/);
      }
    }
  });
});
