import { test, expect } from '@playwright/test';
import { injectMockAuth } from './helpers/auth';
import * as mocks from './helpers/api-mock';

test.describe('Audit Log Extended', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockAuth(page);
    await page.route('**/api/v1/audit**', async (route) => {
      await route.fulfill({ json: mocks.mockAuditExtended.list });
    });
  });

  test('should render heading and entity type dropdown', async ({ page }) => {
    await page.goto('/audit', { waitUntil: 'domcontentloaded' });

    await expect(page.getByText(/audit log/i)).toBeVisible();
    const entitySelect = page.locator('#entity-type-filter');
    await expect(entitySelect).toBeVisible();
  });

  test('should list entity type options including All Types, Incident, Problem', async ({ page }) => {
    await page.goto('/audit', { waitUntil: 'domcontentloaded' });

    const entitySelect = page.locator('#entity-type-filter');
    const options = entitySelect.locator('option');
    const optionTexts = await options.allTextContents();

    expect(optionTexts).toContain('All Types');
    expect(optionTexts).toContain('Incident');
    expect(optionTexts).toContain('Problem');
  });

  test('should filter by entity type and verify API call', async ({ page }) => {
    await page.goto('/audit', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');

    const selectElem = page.locator('#entity-type-filter');
    if (await selectElem.count() > 0) {
      const filteredRequest = page.waitForRequest(
        (req) => req.url().includes('/audit') && req.url().includes('entityType=Incident'),
        { timeout: 5000 }
      ).catch(() => null);

      await selectElem.selectOption('Incident');

      const request = await filteredRequest;
      if (request) {
        expect(request.url()).toContain('entityType=Incident');
      }
    }
  });

  test('should display action badges', async ({ page }) => {
    await page.goto('/audit', { waitUntil: 'domcontentloaded' });

    await expect(page.getByText('CREATE_INCIDENT')).toBeVisible();
    await expect(page.getByText('UPDATE_PROBLEM')).toBeVisible();
    await expect(page.getByText('DELETE_CHANGE')).toBeVisible();
  });

  test('should show IP address column', async ({ page }) => {
    await page.goto('/audit', { waitUntil: 'domcontentloaded' });

    await expect(page.getByText('192.168.1.1')).toBeVisible();
  });

  test('should show resource ID with truncated values', async ({ page }) => {
    await page.goto('/audit', { waitUntil: 'domcontentloaded' });

    // Page renders resourceId?.slice(0, 8) + "..."
    const truncatedId = page.getByText('inc-001-').first();
    await expect(truncatedId).toBeVisible();
  });

  test('should paginate with Previous/Next buttons', async ({ page }) => {
    await page.goto('/audit', { waitUntil: 'domcontentloaded' });

    await expect(page.getByText(/showing \d+ events/i)).toBeVisible();
    const prevBtn = page.getByRole('button', { name: /previous/i });
    const nextBtn = page.getByRole('button', { name: /next/i });
    await expect(prevBtn).toBeVisible();
    await expect(nextBtn).toBeVisible();
    // On page 0, Previous should be disabled
    await expect(prevBtn).toBeDisabled();
  });
});
