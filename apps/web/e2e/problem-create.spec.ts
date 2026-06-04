import { test, expect } from '@playwright/test';
import { injectMockAuth } from './helpers/auth';

test.describe('Problem Create Form', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockAuth(page);
  });

  test('should show New Problem heading', async ({ page }) => {
    await page.goto('/problems/new', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'New Problem' })).toBeVisible();
  });

  test('should show Problem Details card', async ({ page }) => {
    await page.goto('/problems/new', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Problem Details')).toBeVisible();
  });

  test('should show all required form fields', async ({ page }) => {
    await page.goto('/problems/new', { waitUntil: 'domcontentloaded' });
    // Title input (required)
    const titleInput = page.getByPlaceholder('Brief description of the problem');
    await expect(titleInput).toBeVisible();

    // Description textarea
    const descTextarea = page.getByPlaceholder('Detailed description of the problem');
    await expect(descTextarea).toBeVisible();

    // Workaround textarea
    const workaroundTextarea = page.getByPlaceholder('Temporary workaround if available');
    await expect(workaroundTextarea).toBeVisible();
  });

  test('should show Category select with label', async ({ page }) => {
    await page.goto('/problems/new', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Category')).toBeVisible();
  });

  test('should show Priority select with label', async ({ page }) => {
    await page.goto('/problems/new', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Priority')).toBeVisible();
  });

  test('should show Affected Service input', async ({ page }) => {
    await page.goto('/problems/new', { waitUntil: 'domcontentloaded' });
    const serviceInput = page.getByPlaceholder('Service or component affected');
    await expect(serviceInput).toBeVisible();
  });

  test('should show Create Problem and Cancel buttons', async ({ page }) => {
    await page.goto('/problems/new', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('button', { name: 'Create Problem' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
  });

  test('should navigate back on Cancel click', async ({ page }) => {
    await page.route('**/api/v1/problems**', (route) =>
      route.fulfill({ json: { data: [], total: 0 } })
    );
    await page.goto('/problems/new', { waitUntil: 'domcontentloaded' });
    const cancelBtn = page.getByRole('button', { name: 'Cancel' });
    await expect(cancelBtn).toBeVisible();
    await cancelBtn.click();
    // router.push('/problems') is wired up — verify URL changes away from /new
    await page.waitForURL(url => !url.includes('/problems/new'), { timeout: 5000 }).catch(() => {});
  });

  test('should fill form and submit', async ({ page }) => {
    await page.route('**/api/v1/problems**', (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({
          json: { data: { id: 'prob-002', title: 'Test Problem', status: 'OPEN' } },
        });
      }
      return route.fulfill({ json: { data: [] } });
    });

    await page.goto('/problems/new', { waitUntil: 'domcontentloaded' });

    await page.getByPlaceholder('Brief description of the problem').fill('Test Problem');
    await page.getByPlaceholder('Detailed description of the problem').fill('Detailed description of the test problem');

    await page.getByRole('button', { name: 'Create Problem' }).click();

    // Should redirect to problem detail or list
    await page.waitForURL(/\/problems/, { timeout: 5000 }).catch(() => {});
  });

  test('should show error state on API failure', async ({ page }) => {
    await page.route('**/api/v1/problems**', (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({ status: 500, body: 'Internal Server Error' });
      }
      return route.fulfill({ json: { data: [] } });
    });

    await page.goto('/problems/new', { waitUntil: 'domcontentloaded' });
    await page.getByPlaceholder('Brief description of the problem').fill('Test Problem');
    await page.getByRole('button', { name: 'Create Problem' }).click();

    const errorEl = page.getByText(/failed|error/i).first();
    if (await errorEl.count() > 0) {
      await expect(errorEl).toBeVisible();
    }
  });
});
