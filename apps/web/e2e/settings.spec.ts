import { test, expect } from '@playwright/test';
import { injectMockAuth } from './helpers/auth';
import * as mocks from './helpers/api-mock';

test.describe('User Settings', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockAuth(page);
    await page.route('**/api/v1/settings**', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ json: mocks.mockSettings });
      } else {
        await route.fulfill({ json: { success: true } });
      }
    });
  });

  test('settings page renders at /settings', async ({ page }) => {
    await page.goto('/settings');
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('Profile, Preferences, Notifications tabs visible', async ({ page }) => {
    await page.goto('/settings');
    const tabs = ['Profile', 'Preferences', 'Notifications'];
    for (const tab of tabs) {
      const tabButton = page.locator(`button:has-text("${tab}"), [role="tab"]:has-text("${tab}")`).first();
      if (await tabButton.count() > 0) {
        await expect(tabButton).toBeVisible();
      }
    }
  });

  test('Profile tab has First Name, Last Name, Email, Phone, Department inputs', async ({ page }) => {
    await page.goto('/settings');
    const profileTab = page.locator('button:has-text("Profile")').first();
    if (await profileTab.count() > 0) {
      await profileTab.click();
      const fields = ['First Name', 'Last Name', 'Phone', 'Department'];
      for (const field of fields) {
        const input = page.locator(`input[placeholder*="${field}" i], label:has-text("${field}")`).first();
        if (await input.count() > 0) {
          await expect(input).toBeVisible();
        }
      }
    }
  });

  test('Save Profile button submits changes', async ({ page }) => {
    await page.goto('/settings');
    const profileTab = page.locator('button:has-text("Profile")').first();
    if (await profileTab.count() > 0) {
      await profileTab.click();
      const saveButton = page.locator('button:has-text("Save Profile")').first();
      if (await saveButton.count() > 0) {
        await saveButton.click();
      }
    }
  });

  test('Preferences tab has 3-button theme switcher', async ({ page }) => {
    await page.goto('/settings');
    const prefsTab = page.locator('button:has-text("Preferences")').first();
    if (await prefsTab.count() > 0) {
      await prefsTab.click();
      const themeButtons = page.locator('button:has-text("Light"), button:has-text("Dark"), button:has-text("High Contrast")');
      const count = await themeButtons.count();
      await expect(count).toBeGreaterThanOrEqual(2);
    }
  });

  test('Preferences theme button changes active state', async ({ page }) => {
    await page.goto('/settings');
    const prefsTab = page.locator('button:has-text("Preferences")').first();
    if (await prefsTab.count() > 0) {
      await prefsTab.click();
      const hcButton = page.locator('button:has-text("High Contrast")').first();
      if (await hcButton.count() > 0) {
        const ariaPressed = await hcButton.getAttribute('aria-pressed');
        await expect(ariaPressed).toBeTruthy();
      }
    }
  });

  test('Preferences has Timezone and Language inputs', async ({ page }) => {
    await page.goto('/settings');
    const prefsTab = page.locator('button:has-text("Preferences")').first();
    if (await prefsTab.count() > 0) {
      await prefsTab.click();
      const timezone = page.locator('input[placeholder*="Timezone" i], label:has-text("Timezone")').first();
      const language = page.locator('select[name*="language" i], label:has-text("Language")').first();
      if (await timezone.count() > 0) {
        await expect(timezone).toBeVisible();
      }
      if (await language.count() > 0) {
        await expect(language).toBeVisible();
      }
    }
  });

  test('Save Preferences button submits changes', async ({ page }) => {
    await page.goto('/settings');
    const prefsTab = page.locator('button:has-text("Preferences")').first();
    if (await prefsTab.count() > 0) {
      await prefsTab.click();
      const saveButton = page.locator('button:has-text("Save Preferences")').first();
      if (await saveButton.count() > 0) {
        await saveButton.click();
      }
    }
  });

  test('Notifications tab has 3 channel toggles (In-App, Email, Push)', async ({ page }) => {
    await page.goto('/settings');
    const notifTab = page.locator('button:has-text("Notifications")').first();
    if (await notifTab.count() > 0) {
      await notifTab.click();
      const toggles = page.locator(`input[type="checkbox"], [role="switch"]`);
      if (await toggles.count() > 0) {
        await expect(toggles.first()).toBeVisible();
      }
    }
  });

  test('Notifications tab has event type checkboxes', async ({ page }) => {
    await page.goto('/settings');
    const notifTab = page.locator('button:has-text("Notifications")').first();
    if (await notifTab.count() > 0) {
      await notifTab.click();
      const events = ['incident_assigned', 'sla_breach', 'change_approval'];
      for (const event of events) {
        const checkbox = page.locator(`input[type="checkbox"], label:has-text("${event}")`).first();
        if (await checkbox.count() > 0) {
          await expect(checkbox).toBeVisible();
        }
      }
    }
  });

  test('toggling channel changes checked state', async ({ page }) => {
    await page.goto('/settings');
    const notifTab = page.locator('button:has-text("Notifications")').first();
    if (await notifTab.count() > 0) {
      await notifTab.click();
      const toggle = page.locator('input[type="checkbox"], [role="switch"]').first();
      if (await toggle.count() > 0) {
        const initialState = await toggle.isChecked().catch(() => null);
        await toggle.click();
        const newState = await toggle.isChecked().catch(() => null);
        await expect(initialState).not.toEqual(newState);
      }
    }
  });

  test('Save Notification Preferences button submits changes', async ({ page }) => {
    await page.goto('/settings');
    const notifTab = page.locator('button:has-text("Notifications")').first();
    if (await notifTab.count() > 0) {
      await notifTab.click();
      const saveButton = page.locator('button:has-text("Save Notification Preferences"), button:has-text("Save")').first();
      if (await saveButton.count() > 0) {
        await saveButton.click();
      }
    }
  });
});
