import { test, expect } from '@playwright/test';
import { injectMockAuth } from './helpers/auth';

test.describe('Error States', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockAuth(page);
  });

  test('incidents list shows fallback on API 500', async ({ page }) => {
    await page.route('**/api/v1/incidents**', (route) =>
      route.fulfill({ status: 500, body: 'Internal Server Error' })
    );

    await page.goto('/incidents', { waitUntil: 'domcontentloaded' });

    // Page should still render — either showing error message or empty state
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('problems list shows fallback on API 500', async ({ page }) => {
    await page.route('**/api/v1/problems**', (route) =>
      route.fulfill({ status: 500, body: 'Internal Server Error' })
    );

    await page.goto('/problems', { waitUntil: 'domcontentloaded' });

    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('changes list shows fallback on API 500', async ({ page }) => {
    await page.route('**/api/v1/changes**', (route) =>
      route.fulfill({ status: 500, body: 'Internal Server Error' })
    );

    await page.goto('/changes', { waitUntil: 'domcontentloaded' });

    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('knowledge list shows fallback on API 500', async ({ page }) => {
    await page.route('**/api/v1/knowledge**', (route) =>
      route.fulfill({ status: 500, body: 'Internal Server Error' })
    );

    await page.goto('/knowledge', { waitUntil: 'domcontentloaded' });

    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('SLA page renders with API 500', async ({ page }) => {
    await page.route('**/api/v1/sla**', (route) =>
      route.fulfill({ status: 500, body: 'Internal Server Error' })
    );

    await page.goto('/sla', { waitUntil: 'domcontentloaded' });

    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('CMDB page renders with empty data', async ({ page }) => {
    await page.route('**/api/v1/cmdb**', (route) =>
      route.fulfill({ json: { data: [], total: 0 } })
    );

    await page.goto('/cmdb', { waitUntil: 'domcontentloaded' });

    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('vendors page renders with API 500', async ({ page }) => {
    await page.route('**/api/v1/vendors**', (route) =>
      route.fulfill({ status: 500, body: 'Internal Server Error' })
    );

    await page.goto('/vendors', { waitUntil: 'domcontentloaded' });

    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('reporting page renders with API 500', async ({ page }) => {
    await page.route('**/api/v1/reporting**', (route) =>
      route.fulfill({ status: 500, body: 'Internal Server Error' })
    );

    await page.goto('/reporting', { waitUntil: 'domcontentloaded' });

    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('audit page renders with empty data', async ({ page }) => {
    await page.route('**/api/v1/audit**', (route) =>
      route.fulfill({ json: { data: [], total: 0 } })
    );

    await page.goto('/audit', { waitUntil: 'domcontentloaded' });

    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('workforce page renders with API 500', async ({ page }) => {
    await page.route('**/api/v1/workforce**', (route) =>
      route.fulfill({ status: 500, body: 'Internal Server Error' })
    );

    await page.goto('/workforce', { waitUntil: 'domcontentloaded' });

    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });
});
