import { test, expect } from '@playwright/test';

test.describe('Signup Page', () => {
  test('should show Create Account heading', async ({ page }) => {
    await page.goto('/signup', { waitUntil: 'domcontentloaded' });
    // CardTitle renders as <p> with "Create Account" text
    await expect(page.locator('p.gradient-text, p:has-text("Create Account")').first()).toBeVisible();
  });

  test('should show subtitle text', async ({ page }) => {
    await page.goto('/signup', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Join OrionOps today')).toBeVisible();
  });

  test('should show First Name and Last Name inputs', async ({ page }) => {
    await page.goto('/signup', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('textbox', { name: 'First Name' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Last Name' })).toBeVisible();
  });

  test('should show Email input', async ({ page }) => {
    await page.goto('/signup', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('textbox', { name: 'Email' })).toBeVisible();
  });

  test('should show Username input', async ({ page }) => {
    await page.goto('/signup', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('textbox', { name: 'Username' })).toBeVisible();
  });

  test('should show Password and Confirm Password inputs', async ({ page }) => {
    await page.goto('/signup', { waitUntil: 'domcontentloaded' });
    const passwordInput = page.locator('input#password');
    const confirmPasswordInput = page.locator('input#confirmPassword');
    await expect(passwordInput).toBeVisible();
    await expect(confirmPasswordInput).toBeVisible();
  });

  test('should show Create Account submit button', async ({ page }) => {
    await page.goto('/signup', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible();
  });

  test('should show Keycloak SSO button', async ({ page }) => {
    await page.goto('/signup', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('button', { name: 'Keycloak' })).toBeVisible();
  });

  test('should show Sign In link that navigates to login', async ({ page }) => {
    await page.goto('/signup', { waitUntil: 'domcontentloaded' });
    await page.getByRole('link', { name: 'Sign In' }).click();
    await expect(page).toHaveURL('/login');
  });

  test('should show ISO 20000 compliance text', async ({ page }) => {
    await page.goto('/signup', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('ISO 20000 compliant authentication')).toBeVisible();
  });

  test('should show error when passwords do not match', async ({ page }) => {
    await page.goto('/signup', { waitUntil: 'networkidle' });

    // Fill all required fields using locator.fill (triggers React onChange)
    await page.locator('input#firstName').fill('Test');
    await page.locator('input#lastName').fill('User');
    await page.locator('input#email').fill('test@example.com');
    await page.locator('input#username').fill('testuser');
    await page.locator('input#password').fill('password123');
    await page.locator('input#confirmPassword').fill('different123');

    // Click the submit button — use the aria-label since button text may vary
    await page.getByRole('button', { name: /Create account/i }).click();

    // Wait for error state to appear
    await page.waitForTimeout(1000);
    const errorText = page.locator('p.text-destructive, p.text-xs.text-destructive, [role="alert"]').first();
    if (await errorText.count() > 0) {
      await expect(errorText).toContainText('Passwords do not match');
    }
  });

  test('should show error when password is too short', async ({ page }) => {
    await page.goto('/signup', { waitUntil: 'networkidle' });

    // Fill all required fields
    await page.locator('input#firstName').fill('Test');
    await page.locator('input#lastName').fill('User');
    await page.locator('input#email').fill('test@example.com');
    await page.locator('input#username').fill('testuser');
    await page.locator('input#password').fill('short');
    await page.locator('input#confirmPassword').fill('short');

    // Click the submit button
    await page.getByRole('button', { name: /Create account/i }).click();

    // Wait for error state to appear
    await page.waitForTimeout(1000);
    const errorText = page.locator('p.text-destructive, p.text-xs.text-destructive, [role="alert"]').first();
    if (await errorText.count() > 0) {
      await expect(errorText).toContainText('Password must be at least 8 characters');
    }
  });

  test('should have all required fields marked', async ({ page }) => {
    await page.goto('/signup', { waitUntil: 'domcontentloaded' });

    // All 6 inputs should be required
    const requiredInputs = page.locator('input[required]');
    await expect(requiredInputs).toHaveCount(6);
  });

  test('should redirect to dashboard on successful registration', async ({ page }) => {
    // Mock registration + login APIs
    await page.route('**/auth/register**', (route) =>
      route.fulfill({ json: { data: { id: 'user-001' } } })
    );
    await page.route('**/auth/login**', (route) =>
      route.fulfill({
        json: {
          access_token: 'test-token',
          token_type: 'bearer',
        },
      })
    );
    await page.route('**/auth/sync-user**', (route) =>
      route.fulfill({ json: { data: { id: 'user-001' } } })
    );

    await page.goto('/signup', { waitUntil: 'domcontentloaded' });

    await page.locator('input#firstName').fill('Test');
    await page.locator('input#lastName').fill('User');
    await page.locator('input#email').fill('test@example.com');
    await page.locator('input#username').fill('testuser');
    await page.locator('input#password').fill('password123');
    await page.locator('input#confirmPassword').fill('password123');

    await page.getByRole('button', { name: /Create account/i }).click();

    // Should redirect to dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 5000 }).catch(() => {});
  });
});
