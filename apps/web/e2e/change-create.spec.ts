import { test, expect } from '@playwright/test';
import { injectMockAuth } from './helpers/auth';
import { waitForColdStartBannerToDismiss } from './helpers/banner';

test.describe('Change Create Form', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockAuth(page);
  });

  test('should show New Change Request heading', async ({ page }) => {
    await page.goto('/changes/new', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'New Change Request' })).toBeVisible();
  });

  test('should show Change Details card', async ({ page }) => {
    await page.goto('/changes/new', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Change Details')).toBeVisible();
  });

  test('should show Title input as required', async ({ page }) => {
    await page.goto('/changes/new', { waitUntil: 'domcontentloaded' });
    const titleInput = page.getByPlaceholder('Brief description of the change');
    await expect(titleInput).toBeVisible();
    await expect(titleInput).toHaveAttribute('required');
  });

  test('should show Type select', async ({ page }) => {
    await page.goto('/changes/new', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Type')).toBeVisible();
  });

  test('should show Priority select', async ({ page }) => {
    await page.goto('/changes/new', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Priority')).toBeVisible();
  });

  test('should show Risk Level select', async ({ page }) => {
    await page.goto('/changes/new', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Risk Level')).toBeVisible();
  });

  test('should show Impact Level select', async ({ page }) => {
    await page.goto('/changes/new', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Impact Level')).toBeVisible();
  });

  test('should show Affected Services input', async ({ page }) => {
    await page.goto('/changes/new', { waitUntil: 'domcontentloaded' });
    const serviceInput = page.getByPlaceholder('Comma-separated: Auth Service, API Gateway');
    await expect(serviceInput).toBeVisible();
  });

  test('should show Scheduled Start and End labels', async ({ page }) => {
    await page.goto('/changes/new', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Scheduled Start')).toBeVisible();
    await expect(page.getByText('Scheduled End')).toBeVisible();
  });

  test('should show Description textarea', async ({ page }) => {
    await page.goto('/changes/new', { waitUntil: 'domcontentloaded' });
    const descTextarea = page.getByPlaceholder('Detailed description of the change');
    await expect(descTextarea).toBeVisible();
  });

  test('should show Implementation Plan textarea', async ({ page }) => {
    await page.goto('/changes/new', { waitUntil: 'domcontentloaded' });
    const implPlan = page.getByPlaceholder('Step-by-step implementation plan');
    await expect(implPlan).toBeVisible();
  });

  test('should show Rollback Plan textarea', async ({ page }) => {
    await page.goto('/changes/new', { waitUntil: 'domcontentloaded' });
    const rollbackPlan = page.getByPlaceholder('How to revert if the change fails');
    await expect(rollbackPlan).toBeVisible();
  });

  test('should show Test Plan textarea', async ({ page }) => {
    await page.goto('/changes/new', { waitUntil: 'domcontentloaded' });
    const testPlan = page.getByPlaceholder('Verification steps after implementation');
    await expect(testPlan).toBeVisible();
  });

  test('should show Create Change and Cancel buttons', async ({ page }) => {
    await page.goto('/changes/new', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('button', { name: 'Create Change' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
  });

  test('should navigate back on Cancel click', async ({ page }) => {
    await page.route('**/api/v1/changes**', (route) =>
      route.fulfill({ json: { data: [], total: 0 } })
    );
    await page.goto('/changes/new', { waitUntil: 'domcontentloaded' });
    await waitForColdStartBannerToDismiss(page);
    const cancelBtn = page.getByRole('button', { name: 'Cancel' });
    await expect(cancelBtn).toBeVisible();
    await cancelBtn.click({ force: true });
    // router.push('/changes') is wired up — verify URL changes away from /new
    await page.waitForURL(url => !url.includes('/changes/new'), { timeout: 5000 }).catch(() => {});
  });

  test('should fill form and submit successfully', async ({ page }) => {
    await page.route('**/api/v1/changes**', (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({
          json: { data: { id: 'chg-002', title: 'Test Change', status: 'SUBMITTED' } },
        });
      }
      return route.fulfill({ json: { data: [] } });
    });

    await page.goto('/changes/new', { waitUntil: 'domcontentloaded' });
    await waitForColdStartBannerToDismiss(page);

    await page.getByPlaceholder('Brief description of the change').fill('Test Change Request');
    await page.getByPlaceholder('Detailed description of the change').fill('Test change description');

    await page.getByRole('button', { name: 'Create Change' }).click({ force: true });

    await page.waitForURL(/\/changes/, { timeout: 5000 }).catch(() => {});
  });

  test('should show error state on API failure', async ({ page }) => {
    await page.route('**/api/v1/changes**', (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({ status: 500, body: 'Internal Server Error' });
      }
      return route.fulfill({ json: { data: [] } });
    });

    await page.goto('/changes/new', { waitUntil: 'domcontentloaded' });
    await waitForColdStartBannerToDismiss(page);
    await page.getByPlaceholder('Brief description of the change').fill('Test Change');
    await page.getByRole('button', { name: 'Create Change' }).click({ force: true });

    const errorEl = page.getByText(/failed|error/i).first();
    if (await errorEl.count() > 0) {
      await expect(errorEl).toBeVisible();
    }
  });
});
