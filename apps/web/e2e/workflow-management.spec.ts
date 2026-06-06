import { test, expect } from '@playwright/test';
import { injectMockAuth } from './helpers/auth';
import * as mocks from './helpers/api-mock';

test.describe('Workflow Management', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockAuth(page);
    await page.route('**/api/v1/admin/**', route =>
      route.fulfill({ json: mocks.mockAdmin })
    );
    await page.route('**/api/v1/workflows**', route =>
      route.fulfill({ json: mocks.mockWorkflows.list })
    );
    // Catch-all for unmocked API calls
    await page.route('**/api/v1/**', async (route) => {
      if (route.request().url().includes('/admin/') || route.request().url().includes('/workflows')) return;
      await route.fulfill({ json: { data: [], total: 0 } });
    });
  });

  test('should show workflow table with column headers after clicking Workflows tab', async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'domcontentloaded' });

    await page.getByRole('tab', { name: 'Workflows' }).click();

    await expect(page.getByRole('columnheader', { name: /name/i }).first()).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /version/i }).first()).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /status/i }).first()).toBeVisible();
  });

  test('should show workflow names from mock data', async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'domcontentloaded' });

    await page.getByRole('tab', { name: 'Workflows' }).click();

    await expect(page.getByText('Incident Resolution')).toBeVisible();
  });

  test('should show version numbers in workflow table', async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'domcontentloaded' });

    await page.getByRole('tab', { name: 'Workflows' }).click();

    // At least one version number should appear (e.g., "1" or "v1")
    const versionCell = page.locator('td').filter({ hasText: /^\d+$/ }).first();
    await expect(versionCell).toBeVisible();
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
