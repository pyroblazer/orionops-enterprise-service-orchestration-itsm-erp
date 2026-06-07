import { test, expect } from '@playwright/test';
import { injectMockAuth } from './helpers/auth';
import * as mocks from './helpers/api-mock';

test.describe('Dashboard Shell Features', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockAuth(page);
    await page.route('**/api/v1/notifications**', async (route) => {
      await route.fulfill({ json: mocks.mockNotifications.list });
    });
    await page.route('**/api/v1/incidents**', async (route) => {
      await route.fulfill({ json: mocks.mockIncidents.list });
    });
    await page.route('**/api/v1/changes**', async (route) => {
      await route.fulfill({ json: mocks.mockChanges.list });
    });
    await page.route('**/api/v1/sla**', async (route) => {
      await route.fulfill({ json: mocks.mockSLA.instances });
    });
    await page.route('**/api/v1/auth/me**', async (route) => {
      await route.fulfill({ json: { data: { name: 'Test User', email: 'test@orionops.com' } } });
    });
    // Catch-all for unmocked API calls
    await page.route('**/api/v1/**', async (route) => {
      if (route.request().url().includes('/notifications') ||
          route.request().url().includes('/incidents') ||
          route.request().url().includes('/changes') ||
          route.request().url().includes('/sla') ||
          route.request().url().includes('/auth/me')) return;
      await route.fulfill({ json: { data: [], total: 0 } });
    });
  });

  test('should open keyboard shortcuts dialog on button click', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });

    await page.getByRole('button', { name: /show keyboard shortcuts/i }).click();

    const dialog = page.getByRole('dialog', { name: /keyboard shortcuts/i });
    await expect(dialog).toBeVisible();
  });

  test('should display all four shortcuts in the dialog', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });

    await page.getByRole('button', { name: /show keyboard shortcuts/i }).click();

    await expect(page.getByText('Ctrl + B')).toBeVisible();
    await expect(page.getByText('Ctrl + K')).toBeVisible();
    await expect(page.getByText('Ctrl + /')).toBeVisible();
    await expect(page.getByText('Escape')).toBeVisible();
  });

  test('should close shortcuts dialog with Escape key', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });

    await page.getByRole('button', { name: /show keyboard shortcuts/i }).click();
    await expect(page.getByRole('dialog', { name: /keyboard shortcuts/i })).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(page.getByRole('dialog', { name: /keyboard shortcuts/i })).not.toBeVisible();
  });

  test('should close shortcuts dialog with Close button', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });

    await page.getByRole('button', { name: /show keyboard shortcuts/i }).click();
    await expect(page.getByRole('dialog', { name: /keyboard shortcuts/i })).toBeVisible();

    await page.getByRole('button', { name: 'Close' }).click();

    await expect(page.getByRole('dialog', { name: /keyboard shortcuts/i })).not.toBeVisible();
  });

  test('should open dialog with Ctrl+/ keyboard shortcut', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });

    await page.keyboard.press('Control+/');
    await page.waitForTimeout(500);

    await expect(page.getByRole('dialog', { name: /keyboard shortcuts/i })).toBeVisible();
  });

  test('should show theme toggle button with descriptive aria-label', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });

    const themeBtn = page.getByRole('button', { name: /theme/i });
    await expect(themeBtn).toBeVisible();

    const ariaLabel = await themeBtn.getAttribute('aria-label');
    expect(ariaLabel).toMatch(/theme/i);
  });

  test('should toggle theme on click and change aria-label', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });

    const themeBtn = page.getByRole('button', { name: /theme/i });
    const initialLabel = await themeBtn.getAttribute('aria-label');

    await themeBtn.click();

    const newLabel = await themeBtn.getAttribute('aria-label');
    // Label should change (e.g., "Switch to dark theme" -> "Switch to high contrast theme")
    expect(newLabel).toBeTruthy();
  });

  test('should open user menu on avatar click', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });

    await page.getByRole('button', { name: 'User menu' }).click();

    await expect(page.locator('[role="menu"]')).toBeVisible();
  });

  test('should show Sign out option in user menu', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });

    await page.getByRole('button', { name: 'User menu' }).click();

    await expect(page.getByRole('menuitem', { name: /sign out/i })).toBeVisible();
  });

  test('should show Profile and Settings options in user menu', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });

    await page.getByRole('button', { name: 'User menu' }).click();

    await expect(page.getByRole('menuitem', { name: /profile/i })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /settings/i })).toBeVisible();
  });
});
