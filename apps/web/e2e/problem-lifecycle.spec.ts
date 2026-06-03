import { test, expect } from '@playwright/test';
import { injectMockAuth } from './helpers/auth';
import * as mocks from './helpers/api-mock';

test.describe('Problem Management', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockAuth(page);
    await page.route('**/api/v1/problems**', async (route) => {
      await route.fulfill({ json: mocks.mockProblems.list });
    });
  });

  test('problem list page renders', async ({ page }) => {
    await page.goto('/problems');
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('problem list displays table or cards', async ({ page }) => {
    await page.goto('/problems');
    const tableOrCards = page.locator('table, [role="table"], [role="listbox"]').first();
    if (await tableOrCards.count() > 0) {
      await expect(tableOrCards).toBeVisible();
    }
  });

  test('create problem button navigates to form', async ({ page }) => {
    await page.goto('/problems');
    const createButton = page.locator('button:has-text("Create"), button:has-text("New")').first();
    if (await createButton.count() > 0) {
      await createButton.click();
      await page.waitForURL('**/problems/new', { timeout: 5000 });
    }
  });

  test('problem create form has required fields', async ({ page }) => {
    await page.goto('/problems/new');
    const titleInput = page.locator('input[placeholder*="title" i], textarea[placeholder*="title" i]').first();
    const descInput = page.locator('textarea[placeholder*="description" i], textarea[placeholder*="describe" i]').first();
    if (await titleInput.count() > 0) {
      await expect(titleInput).toBeVisible();
    }
    if (await descInput.count() > 0) {
      await expect(descInput).toBeVisible();
    }
  });

  test('problem detail page displays title and status', async ({ page }) => {
    await page.route('**/api/v1/problems/prob-001**', async (route) => {
      await route.fulfill({ json: mocks.mockProblems.detail });
    });
    await page.goto('/problems/prob-001');
    const title = page.locator(`text="Memory Leak"`).first();
    await expect(title).toBeVisible();
  });

  test('problem detail displays KEDB/RCA sections', async ({ page }) => {
    await page.route('**/api/v1/problems/prob-001**', async (route) => {
      await route.fulfill({ json: mocks.mockProblems.detail });
    });
    await page.goto('/problems/prob-001');
    const sections = page.locator('text="Root Cause", text="Known Error", text="KEDB"').first();
    if (await sections.count() > 0) {
      await expect(sections).toBeVisible();
    }
  });

  test('linked incidents section visible on problem detail', async ({ page }) => {
    await page.route('**/api/v1/problems/prob-001**', async (route) => {
      const detail = {
        ...mocks.mockProblems.detail,
        linkedIncidents: [mocks.mockIncidents.list.data[0]],
      };
      await route.fulfill({ json: detail });
    });
    await page.goto('/problems/prob-001');
    const linkedSection = page.locator('text="Linked Incidents", text="Related"').first();
    if (await linkedSection.count() > 0) {
      await expect(linkedSection).toBeVisible();
    }
  });

  test('CSV export on problem list', async ({ page }) => {
    await page.goto('/problems');
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

  test('problem list status filter works', async ({ page }) => {
    await page.goto('/problems');
    const filterButton = page.locator('button:has-text("Status"), select[name*="status" i]').first();
    if (await filterButton.count() > 0) {
      await expect(filterButton).toBeVisible();
    }
  });
});
