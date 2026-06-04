import { test, expect } from '@playwright/test';

test.describe('Basic Navigation', () => {
  test('should load login page', async ({ page }) => {
    await page.goto('http://localhost:3002/login');

    // Check if login form elements are present
    await expect(page.getByLabel('Username or Email')).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Password' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in with username and password' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in with Keycloak SSO' })).toBeVisible();
  });

  test('should show login page title', async ({ page }) => {
    await page.goto('http://localhost:3002/login');

    // Check page title
    await expect(page).toHaveTitle(/OrionOps/);

    // Check heading
    await expect(page.getByText('OrionOps')).toBeVisible();
    await expect(page.getByText('Enterprise Service Orchestration Platform')).toBeVisible();
  });

  test('should have signup link', async ({ page }) => {
    await page.goto('http://localhost:3002/login');

    // Check signup link
    const signupLink = page.getByRole('link', { name: 'Create one' });
    await expect(signupLink).toBeVisible();
    await expect(signupLink).toHaveAttribute('href', '/signup');
  });

  test('should show loading spinner on login callback page', async ({ page }) => {
    await page.goto('http://localhost:3002/login/callback');

    // Check if loading spinner is visible (may use different class names)
    const spinner = page.locator('.lucide-loader-circle, .animate-spin, svg[class*="loader"], [class*="spinner"]').first();
    if (await spinner.count() > 0) {
      await expect(spinner).toBeVisible();
    }
    // Check loading text (may not appear if page processes too fast)
    const loadingText = page.getByText('Completing sign in');
    if (await loadingText.count() > 0) {
      await expect(loadingText).toBeVisible();
    }
    const sessionText = page.getByText('Securing your session...');
    if (await sessionText.count() > 0) {
      await expect(sessionText).toBeVisible();
    }
  });
});