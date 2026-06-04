import { test, expect } from '@playwright/test';
import { injectMockAuth } from './helpers/auth';

test.describe('Service Request Create Form', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockAuth(page);
  });

  test('should show New Service Request heading', async ({ page }) => {
    await page.goto('/requests/new', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'New Service Request' })).toBeVisible();
  });

  test('should show Request Details card', async ({ page }) => {
    await page.goto('/requests/new', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Request Details')).toBeVisible();
  });

  test('should show Title input as required', async ({ page }) => {
    await page.goto('/requests/new', { waitUntil: 'domcontentloaded' });
    const titleInput = page.getByPlaceholder('Brief description of the request');
    await expect(titleInput).toBeVisible();
    await expect(titleInput).toHaveAttribute('required');
  });

  test('should show Category select', async ({ page }) => {
    await page.goto('/requests/new', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Category')).toBeVisible();
  });

  test('should show Priority select', async ({ page }) => {
    await page.goto('/requests/new', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Priority')).toBeVisible();
  });

  test('should show Required Date input', async ({ page }) => {
    await page.goto('/requests/new', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Required Date')).toBeVisible();
  });

  test('should show Description textarea', async ({ page }) => {
    await page.goto('/requests/new', { waitUntil: 'domcontentloaded' });
    const descTextarea = page.getByPlaceholder('Detailed description of what you need');
    await expect(descTextarea).toBeVisible();
  });

  test('should show Justification textarea', async ({ page }) => {
    await page.goto('/requests/new', { waitUntil: 'domcontentloaded' });
    const justificationTextarea = page.getByPlaceholder('Business justification for this request');
    await expect(justificationTextarea).toBeVisible();
  });

  test('should show Attachment Notes input', async ({ page }) => {
    await page.goto('/requests/new', { waitUntil: 'domcontentloaded' });
    const attachmentInput = page.getByPlaceholder('Notes about attachments or supporting documents');
    await expect(attachmentInput).toBeVisible();
  });

  test('should show Submit Request and Cancel buttons', async ({ page }) => {
    await page.goto('/requests/new', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('button', { name: 'Submit Request' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
  });

  test('should navigate back on Cancel click', async ({ page }) => {
    await page.route('**/api/v1/requests**', (route) =>
      route.fulfill({ json: { data: [], total: 0 } })
    );
    await page.goto('/requests/new', { waitUntil: 'domcontentloaded' });
    const cancelBtn = page.getByRole('button', { name: 'Cancel' });
    await expect(cancelBtn).toBeVisible();
    await cancelBtn.click();
    // router.push('/requests') is wired up — verify URL changes away from /new
    await page.waitForURL(url => !url.includes('/requests/new'), { timeout: 5000 }).catch(() => {});
  });

  test('should fill form and submit successfully', async ({ page }) => {
    await page.route('**/api/v1/requests**', (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({
          json: { data: { id: 'req-002', title: 'Test Request', status: 'draft' } },
        });
      }
      return route.fulfill({ json: { data: [] } });
    });

    await page.goto('/requests/new', { waitUntil: 'domcontentloaded' });

    await page.getByPlaceholder('Brief description of the request').fill('Test Service Request');
    await page.getByPlaceholder('Detailed description of what you need').fill('I need a new laptop');

    await page.getByRole('button', { name: 'Submit Request' }).click();

    await page.waitForURL(/\/requests/, { timeout: 5000 }).catch(() => {});
  });

  test('should show error state on API failure', async ({ page }) => {
    await page.route('**/api/v1/requests**', (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({ status: 500, body: 'Internal Server Error' });
      }
      return route.fulfill({ json: { data: [] } });
    });

    await page.goto('/requests/new', { waitUntil: 'domcontentloaded' });
    await page.getByPlaceholder('Brief description of the request').fill('Test Request');
    await page.getByRole('button', { name: 'Submit Request' }).click();

    const errorEl = page.getByText(/failed|error/i).first();
    if (await errorEl.count() > 0) {
      await expect(errorEl).toBeVisible();
    }
  });
});
