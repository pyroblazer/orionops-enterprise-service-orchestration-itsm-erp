import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('redirects to Keycloak login page', async ({ page }) => {
    await page.goto('/');

    // The app should redirect to login when not authenticated
    // The URL should contain Keycloak's auth endpoint
    await page.waitForURL(/\/login|realms\/orionops/, {
      timeout: 10000,
    });

    // Verify we are on a login-related page
    const url = page.url();
    const isOnLoginPage = url.includes('/login') || url.includes('realms/orionops');
    expect(isOnLoginPage).toBe(true);
  });

  test('login page has correct elements', async ({ page }) => {
    await page.goto('/login');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Verify login page has the expected structure
    // This depends on the actual login page implementation
    const pageTitle = await page.textContent('h1, h2');
    expect(pageTitle).toBeTruthy();
  });

  test('dashboard loads after successful authentication', async ({ page }) => {
    // Mock authentication by setting tokens
    await page.goto('/login');

    // Inject mock tokens into localStorage to simulate authenticated state
    await page.evaluate(() => {
      localStorage.setItem('orionops_access_token', 'mock-access-token');
      localStorage.setItem('orionops_refresh_token', 'mock-refresh-token');
    });

    // Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Verify dashboard content is present
    await expect(page.locator('text=Dashboard')).toBeVisible({ timeout: 10000 });

    // Verify summary cards are rendered
    await expect(page.locator('text=Open Incidents')).toBeVisible();
    await expect(page.locator('text=SLA at Risk')).toBeVisible();
  });
});
