import { test, expect } from '@playwright/test';
import { setupCallbackAuth, clearAuth } from './helpers/auth';

test.describe('Authentication Callback Flow', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuth(page);
  });

  test('should show loading spinner on mount', async ({ page }) => {
    const callbackUrl = 'http://localhost:3002/login/callback?code=mock-auth-code&state=mock-state-value';
    await page.goto(callbackUrl);

    // Check for loading spinner using lucide Loader2 class
    await expect(page.locator('.lucide-loader-2, .animate-spin, [class*="spinner"]')).toBeVisible();
    await expect(page.getByText('Completing sign in')).toBeVisible();
    await expect(page.getByText('Securing your session...')).toBeVisible();
  });

  test('should successfully callback and redirect to dashboard', async ({ page }) => {
    const callbackUrl = 'http://localhost:3002/login/callback?code=mock-auth-code&state=mock-state-value';

    // Mock token endpoint
    await page.route('**/realms/**/token', route =>
      route.fulfill({ json: { access_token: 'mock-token' } })
    );

    // Mock user sync
    await page.route('**/api/v1/auth/sync-user', route =>
      route.fulfill({ json: { user: { id: 'u1', name: 'Test User' } } })
    );

    await page.goto(callbackUrl);

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText('Welcome to OrionOps Dashboard')).toBeVisible();
  });

  test('should show error when error param is present', async ({ page }) => {
    await page.goto('http://localhost:3002/login/callback?error=access_denied');

    await expect(page.getByText('Authentication Failed')).toBeVisible();
    await expect(page.getByText('access_denied' || 'Access was denied')).toBeVisible();
    await expect(page.locator('a[href="/login"]')).toBeVisible();
  });

  test('should show error when no params', async ({ page }) => {
    await page.goto('http://localhost:3002/login/callback');

    // Should show error message for missing code
    await expect(page.getByText('No authorization code received.')).toBeVisible();
    await expect(page.getByText('Authentication Failed')).toBeVisible();
  });

  test('should show error on state mismatch', async ({ page }) => {
    await page.goto('http://localhost:3002/');
    await page.evaluate(() => {
      sessionStorage.setItem('orionops_oauth_state', 'different-state');
    });

    await page.goto('http://localhost:3002/login/callback?code=mock-code&state=mock-state-value');

    await expect(page.getByText('Authentication Failed')).toBeVisible();
    await expect(page.getByText('Invalid state parameter. Possible CSRF attack.')).toBeVisible();
  });

  test('should set localStorage tokens after successful callback', async ({ page }) => {
    const callbackUrl = 'http://localhost:3002/login/callback?code=mock-auth-code&state=mock-state-value';

    // Mock token endpoint
    await page.route('**/realms/**/token', route =>
      route.fulfill({ json: { access_token: 'mock-token' } })
    );

    // Mock user sync
    await page.route('**/api/v1/auth/sync-user', route =>
      route.fulfill({ json: { user: { id: 'u1', name: 'Test User' } } })
    );

    await page.goto(callbackUrl);

    const localStorageToken = await page.evaluate(() => {
      return localStorage.getItem('orionops_access_token');
    });

    expect(localStorageToken).toBe('mock-token');
  });

  test('should set authentication cookie after successful callback', async ({ page }) => {
    const callbackUrl = 'http://localhost:3002/login/callback?code=mock-auth-code&state=mock-state-value';

    // Mock token endpoint
    await page.route('**/realms/**/token', route =>
      route.fulfill({ json: { access_token: 'mock-token' } })
    );

    // Mock user sync
    await page.route('**/api/v1/auth/sync-user', route =>
      route.fulfill({ json: { user: { id: 'u1', name: 'Test User' } } })
    );

    await page.goto(callbackUrl);

    const cookies = await page.context().cookies();
    const authCookie = cookies.find(c => c.name === 'orionops_authenticated');

    expect(authCookie).toBeTruthy();
    expect(authCookie.value).toBe('true');
  });
});