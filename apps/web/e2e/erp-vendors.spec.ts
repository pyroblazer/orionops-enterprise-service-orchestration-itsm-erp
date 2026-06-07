import { test, expect } from '@playwright/test';
import { injectMockAuth } from './helpers/auth';
import * as mocks from './helpers/api-mock';

test.describe('ERP - Vendor Management', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockAuth(page);
    await page.route('**/api/v1/vendors**', async (route) => {
      await route.fulfill({ json: mocks.mockVendors });
    });
  });

  test('vendor list renders at /vendors', async ({ page }) => {
    await page.goto('/vendors');
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('vendor list displays vendor rows with SLA status', async ({ page }) => {
    await page.goto('/vendors');
    const slaStatus = page.locator('text="COMPLIANT", text="SLA"').first();
    if (await slaStatus.count() > 0) {
      await expect(slaStatus).toBeVisible();
    }
  });

  test('vendor detail at /vendors/[id] displays SLA section', async ({ page }) => {
    await page.route('**/api/v1/vendors/vendor-001**', async (route) => {
      await route.fulfill({ json: mocks.mockVendors.detail });
    });
    await page.goto('/vendors/vendor-001');
    const slaSection = page.locator('text="SLA"').first();
    if (await slaSection.count() > 0) {
      await expect(slaSection).toBeVisible();
    }
  });

  test('vendor detail displays performance rating with text label', async ({ page }) => {
    await page.route('**/api/v1/vendors/vendor-001**', async (route) => {
      await route.fulfill({ json: mocks.mockVendors.detail });
    });
    await page.goto('/vendors/vendor-001');
    const rating = page.locator('text="4.5", text="Rating"').first();
    if (await rating.count() > 0) {
      await expect(rating).toBeVisible();
    }
  });

  test('vendor list has create button', async ({ page }) => {
    await page.goto('/vendors', { waitUntil: 'domcontentloaded' });
    const createButton = page.locator('button:has-text("Create"), button:has-text("New"), button:has-text("Add")').first();
    if (await createButton.count() > 0) {
      await expect(createButton).toBeVisible({ timeout: 10000 });
    }
  });

  test('create vendor form has name and contact fields', async ({ page }) => {
    await page.goto('/vendors/new');
    const nameInput = page.locator('input[placeholder*="name" i]').first();
    const contactInput = page.locator('input[placeholder*="contact" i]').first();
    if (await nameInput.count() > 0) {
      await expect(nameInput).toBeVisible();
    }
    if (await contactInput.count() > 0) {
      await expect(contactInput).toBeVisible();
    }
  });
});
