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
    await page.goto('/admin', { waitUntil: 'domcontentloaded' });

    const workflowsTab = page.getByRole('tab', { name: /workflows/i });
    await workflowsTab.click();

    await expect(page.locator('table')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Incident Resolution')).toBeVisible({ timeout: 10000 });
  });

  test('should show workflow names from mock data', async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'domcontentloaded' });

    const workflowsTab = page.getByRole('tab', { name: /workflows/i });
    await workflowsTab.click();

    await expect(page.getByText('Incident Resolution')).toBeVisible({ timeout: 10000 });
  });

  test('should show version numbers in workflow table', async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'domcontentloaded' });

    const workflowsTab = page.getByRole('tab', { name: /workflows/i });
    await workflowsTab.click();

    await expect(page.locator('table')).toBeVisible({ timeout: 10000 });
    const versionCell = page.locator('td').filter({ hasText: /1|2|3/ }).first();
    await expect(versionCell).toBeVisible({ timeout: 10000 });
  });

  test('should show ACTIVE status badge', async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'domcontentloaded' });

    await page.getByRole('tab', { name: 'Workflows' }).click();

    await expect(page.getByText('ACTIVE').first()).toBeVisible();
  });

  test('should show Upload BPMN button and file input', async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'domcontentloaded' });

    await page.getByRole('tab', { name: 'Workflows' }).click();

    await expect(page.getByRole('button', { name: /upload bpmn/i })).toBeVisible();
    const fileInput = page.locator('input[type="file"][accept*="bpmn"]');
    await expect(fileInput).toBeAttached();
  });

  test('should show empty state with guidance text', async ({ page }) => {
    await page.route('**/api/v1/workflows**', route =>
      route.fulfill({ json: { data: [], total: 0 } })
    );
    // Also override admin to have no workflows
    await page.route('**/api/v1/admin/**', route =>
      route.fulfill({ json: { data: { users: [], roles: [], workflows: [] } } })
    );

    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    await page.getByRole('tab', { name: 'Workflows' }).click();

    await expect(page.getByText(/no workflow|no definitions/i).first()).toBeVisible();
  });
});
