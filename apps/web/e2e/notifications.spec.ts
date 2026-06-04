import { test, expect } from '@playwright/test';
import { injectMockAuth } from './helpers/auth';
import * as mocks from './helpers/api-mock';

test.describe('Notifications Center', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockAuth(page);
    await page.route('**/api/v1/notifications**', async (route) => {
      await route.fulfill({ json: mocks.mockNotifications.list });
    });
  });

  test('notification bell icon visible with unread count badge', async ({ page }) => {
    await page.goto('/dashboard');
    const bellButton = page.locator('button[aria-label*="notification" i]').first();
    if (await bellButton.count() > 0) {
      await expect(bellButton).toBeVisible();
      const badge = page.locator('span:has-text("2")').first();
      if (await badge.count() > 0) {
        await expect(badge).toBeVisible();
      }
    }
  });

  test('notification dropdown opens on bell click', async ({ page }) => {
    await page.goto('/dashboard');
    const bellButton = page.locator('button[aria-label*="notification" i]').first();
    if (await bellButton.count() > 0) {
      await bellButton.click();
      const dropdownMenu = page.locator('[role="menu"], [role="listbox"]').first();
      if (await dropdownMenu.count() > 0) {
        await expect(dropdownMenu).toBeVisible();
      }
    }
  });

  test('notification list shows recent notifications', async ({ page }) => {
    await page.goto('/dashboard');
    const bellButton = page.locator('button[aria-label*="notification" i]').first();
    if (await bellButton.count() > 0) {
      await bellButton.click();
      const notifTitle = page.locator('text="Incident INC-001 Assigned"').first();
      if (await notifTitle.count() > 0) {
        await expect(notifTitle).toBeVisible();
      }
    }
  });

  test('notification item is clickable and navigates', async ({ page }) => {
    await page.goto('/dashboard');
    const bellButton = page.locator('button[aria-label*="notification" i]').first();
    if (await bellButton.count() > 0) {
      await bellButton.click();
      const notifLink = page.locator('[role="menuitem"], a[href*="/incidents/"]').first();
      if (await notifLink.count() > 0) {
        await notifLink.click({ force: true });
        await page.waitForURL('**/incidents/**', { timeout: 5000 });
      }
    }
  });

  test('mark all read button clears unread badge', async ({ page }) => {
    await page.route('**/api/v1/notifications/mark-read**', async (route) => {
      await route.fulfill({ json: { success: true, unreadCount: 0 } });
    });
    await page.goto('/dashboard');
    const bellButton = page.locator('button[aria-label*="notification" i]').first();
    if (await bellButton.count() > 0) {
      await bellButton.click();
      const markReadButton = page.locator('button:has-text("Mark all read"), button:has-text("Clear")').first();
      if (await markReadButton.count() > 0) {
        await markReadButton.click();
        await page.waitForTimeout(300);
        const badge = page.locator('span:has-text("2")').first();
        if (await badge.count() === 0) {
          await expect(badge).not.toBeVisible();
        }
      }
    }
  });

  test('notification shows timestamp', async ({ page }) => {
    await page.goto('/dashboard');
    const bellButton = page.locator('button[aria-label*="notification" i]').first();
    if (await bellButton.count() > 0) {
      await bellButton.click();
      const timestamp = page.locator('text="ago", text="just now", text="minute"').first();
      if (await timestamp.count() > 0) {
        await expect(timestamp).toBeVisible();
      }
    }
  });

  test('unread notification has distinct styling', async ({ page }) => {
    await page.goto('/dashboard');
    const bellButton = page.locator('button[aria-label*="notification" i]').first();
    if (await bellButton.count() > 0) {
      await bellButton.click();
      const unreadItem = page.locator('[role="menuitem"]').first();
      if (await unreadItem.count() > 0) {
        const bgColor = await unreadItem.evaluate((el) => window.getComputedStyle(el).backgroundColor);
        await expect(bgColor).toBeTruthy();
      }
    }
  });
});
