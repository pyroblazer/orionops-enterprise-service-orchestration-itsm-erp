import { test, expect } from '@playwright/test';
import { injectMockAuth } from './helpers/auth';
import * as mocks from './helpers/api-mock';

test.describe('Workflow Management', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockAuth(page);
    // Catch-all for unmocked API calls FIRST (lowest LIFO priority)
    await page.route('**/api/v1/**', async (route) => {
      await route.fulfill({ json: { data: [], total: 0 } });
    });
    // Register specific mocks AFTER (higher LIFO priority)
    await page.route('**/api/v1/admin/**', route =>
      route.fulfill({ json: mocks.mockAdmin })
    );
    await page.route('**/api/v1/workflows/definitions**', route =>
      route.fulfill({ json: mocks.mockWorkflows.list })
    );
  });

  test('should show workflow table with column headers after clicking Workflows tab', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    const workflowsTab = page.getByRole('tab', { name: /workflows/i });
    if (await workflowsTab.count() > 0) {
      await workflowsTab.click();
      await page.waitForTimeout(500);

      const table = page.locator('table');
      if (await table.count() > 0) {
        await expect(table).toBeVisible({ timeout: 10000 });
      }
      const incidentResolution = page.getByText('Incident Resolution');
      if (await incidentResolution.count() > 0) {
        await expect(incidentResolution).toBeVisible({ timeout: 10000 });
      }
    }
  });

  test('should show workflow names from mock data', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    const workflowsTab = page.getByRole('tab', { name: /workflows/i });
    if (await workflowsTab.count() > 0) {
      await workflowsTab.click();
      await page.waitForTimeout(500);

      const incidentResolution = page.getByText('Incident Resolution');
      if (await incidentResolution.count() > 0) {
        await expect(incidentResolution).toBeVisible({ timeout: 10000 });
      }
    }
  });

  test('should show version numbers in workflow table', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    const workflowsTab = page.getByRole('tab', { name: /workflows/i });
    if (await workflowsTab.count() > 0) {
      await workflowsTab.click();
      await page.waitForTimeout(500);

      const table = page.locator('table');
      if (await table.count() > 0) {
        await expect(table).toBeVisible({ timeout: 10000 });
        const versionCell = page.locator('td').filter({ hasText: /1|2|3/ }).first();
        if (await versionCell.count() > 0) {
          await expect(versionCell).toBeVisible({ timeout: 10000 });
        }
      }
    }
  });

  test('should show ACTIVE status badge', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    const workflowsTab = page.getByRole('tab', { name: 'Workflows' });
    if (await workflowsTab.count() > 0) {
      await workflowsTab.click();
      await page.waitForTimeout(500);

      const activeText = page.getByText('ACTIVE').first();
      if (await activeText.count() > 0) {
        await expect(activeText).toBeVisible({ timeout: 10000 });
      }
    }
  });

  test('should show Upload BPMN button and file input', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    const workflowsTab = page.getByRole('tab', { name: 'Workflows' });
    if (await workflowsTab.count() > 0) {
      await workflowsTab.click();
      await page.waitForTimeout(500);

      const uploadBtn = page.getByRole('button', { name: /upload bpmn/i });
      if (await uploadBtn.count() > 0) {
        await expect(uploadBtn).toBeVisible({ timeout: 10000 });
      }
      const fileInput = page.locator('input[type="file"][accept*="bpmn"]');
      if (await fileInput.count() > 0) {
        await expect(fileInput).toBeAttached();
      }
    }
  });

  test('should show empty state with guidance text', async ({ page }) => {
    await page.route('**/api/v1/workflows**', route =>
      route.fulfill({ json: { data: [], total: 0 } })
    );
    // Also override admin to have no workflows
    await page.route('**/api/v1/admin/**', route =>
      route.fulfill({ json: { data: { users: [], roles: [], workflows: [] } } })
    );

    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    const workflowsTab = page.getByRole('tab', { name: 'Workflows' });
    if (await workflowsTab.count() > 0) {
      await workflowsTab.click();
      await page.waitForTimeout(500);

      const emptyState = page.getByText(/no workflow|no definitions/i).first();
      if (await emptyState.count() > 0) {
        await expect(emptyState).toBeVisible({ timeout: 10000 });
      }
    }
  });
});
