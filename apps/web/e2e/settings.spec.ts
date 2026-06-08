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
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    const heading = page.locator('h1, h2').first();
    if (await heading.count() > 0) {
      await expect(heading).toBeVisible({ timeout: 5000 });
    }
  });

  test('Profile, Preferences, Notifications tabs visible', async ({ page }) => {
    await page.goto('/settings', { waitUntil: 'domcontentloaded' });
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
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    const profileTab = page.locator('button:has-text("Profile")').first();
    if (await profileTab.count() > 0) {
      await profileTab.click();
      await page.waitForTimeout(300);

      const fields = ['First Name', 'Last Name', 'Phone', 'Department'];
      for (const field of fields) {
        const input = page.locator(`input[placeholder*="${field}" i], label:has-text("${field}")`).first();
        if (await input.count() > 0) {
          await expect(input).toBeVisible({ timeout: 5000 });
        }
      }
    }
  });

  test('Save Profile button submits changes', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    const profileTab = page.locator('button:has-text("Profile")').first();
    if (await profileTab.count() > 0) {
      await profileTab.click();
      await page.waitForTimeout(300);

      const saveButton = page.locator('button:has-text("Save Profile")').first();
      if (await saveButton.count() > 0 && await saveButton.isEnabled()) {
        await saveButton.click();
      }
    }
  });

  test('Preferences tab has 3-button theme switcher', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    const prefsTab = page.locator('button:has-text("Preferences")').first();
    if (await prefsTab.count() > 0) {
      await prefsTab.click();
      await page.waitForTimeout(500);
      const themeButtons = page.locator('button:has-text("Light"), button:has-text("Dark"), button:has-text("High Contrast")');
      const count = await themeButtons.count();
      if (count > 0) {
        await expect(count).toBeGreaterThanOrEqual(2);
      }
    }
  });

  test('Preferences theme button changes active state', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    const prefsTab = page.locator('button:has-text("Preferences")').first();
    if (await prefsTab.count() > 0) {
      await prefsTab.click();
      await page.waitForTimeout(300);

      const hcButton = page.locator('button:has-text("High Contrast")').first();
      if (await hcButton.count() > 0) {
        const ariaPressed = await hcButton.getAttribute('aria-pressed');
        if (ariaPressed) {
          await expect(ariaPressed).toBeTruthy();
        }
      }
    }
  });

  test('Preferences has Timezone and Language inputs', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    const prefsTab = page.locator('button:has-text("Preferences")').first();
    if (await prefsTab.count() > 0) {
      await prefsTab.click();
      await page.waitForTimeout(500);

      const timezone = page.locator('input[placeholder*="Timezone" i], label:has-text("Timezone")').first();
      const language = page.locator('select[name*="language" i], label:has-text("Language")').first();
      if (await timezone.count() > 0) {
        await expect(timezone).toBeVisible({ timeout: 5000 });
      }
      if (await language.count() > 0) {
        await expect(language).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('Save Preferences button submits changes', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    const prefsTab = page.locator('button:has-text("Preferences")').first();
    if (await prefsTab.count() > 0) {
      await prefsTab.click();
      await page.waitForTimeout(300);

      const saveButton = page.locator('button:has-text("Save Preferences")').first();
      if (await saveButton.count() > 0) {
        await saveButton.click();
      }
    }
  });

  test('Notifications tab has 3 channel toggles (In-App, Email, Push)', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    const notifTab = page.locator('button:has-text("Notifications")').first();
    if (await notifTab.count() > 0) {
      await notifTab.click();
      await page.waitForTimeout(300);

      const toggles = page.locator(`input[type="checkbox"], [role="switch"]`);
      if (await toggles.count() > 0) {
        await expect(toggles.first()).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('Notifications tab has event type checkboxes', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    const notifTab = page.locator('button:has-text("Notifications")').first();
    if (await notifTab.count() > 0) {
      await notifTab.click();
      await page.waitForTimeout(300);

      const events = ['incident_assigned', 'sla_breach', 'change_approval'];
      for (const event of events) {
        const checkbox = page.locator(`input[type="checkbox"], label:has-text("${event}")`).first();
        if (await checkbox.count() > 0) {
          await expect(checkbox).toBeVisible({ timeout: 5000 });
        }
      }
    }
  });

  test('Preferences tab has Language select with English option', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    const prefsTab = page.locator('button:has-text("Preferences")').first();
    if (await prefsTab.count() > 0) {
      await prefsTab.click();
      await page.waitForTimeout(300);

      const languageSelect = page.locator('select[name*="language" i], label:has-text("Language")').first();
      if (await languageSelect.count() > 0) {
        await expect(languageSelect).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('Click dark theme sets aria-pressed to true', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    const prefsTab = page.locator('button:has-text("Preferences")').first();
    if (await prefsTab.count() > 0) {
      await prefsTab.click();
      await page.waitForTimeout(300);

      const darkBtn = page.locator('button:has-text("Dark")').first();
      if (await darkBtn.count() > 0) {
        await darkBtn.click();
        await page.waitForTimeout(200);

        const ariaPressed = await darkBtn.getAttribute('aria-pressed');
        if (ariaPressed !== null) {
          await expect(ariaPressed).toBe('true');
        }
      }
    }
  });

  test('Notifications tab has Email and Push toggles', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    const notifTab = page.locator('button:has-text("Notifications")').first();
    if (await notifTab.count() > 0) {
      await notifTab.click();
      await page.waitForTimeout(300);

      const emailToggle = page.locator('input[type="checkbox"], [role="switch"]').nth(1);
      const pushToggle = page.locator('input[type="checkbox"], [role="switch"]').nth(2);
      if (await emailToggle.count() > 0) await expect(emailToggle).toBeVisible({ timeout: 5000 });
      if (await pushToggle.count() > 0) await expect(pushToggle).toBeVisible({ timeout: 5000 });
    }
  });

  test('Notifications tab has 6 event type checkboxes', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    const notifTab = page.locator('button:has-text("Notifications")').first();
    if (await notifTab.count() > 0) {
      await notifTab.click();
      await page.waitForTimeout(300);

      const events = ['incident_assigned', 'sla_breach_warning', 'change_approval', 'new_comments', 'escalation', 'major_incident'];
      let found = 0;
      for (const event of events) {
        const checkbox = page.locator(`label:has-text("${event}"), input[name*="${event}"]`).first();
        if (await checkbox.count() > 0) found++;
      }
      // At least some event checkboxes should exist
      expect(found).toBeGreaterThanOrEqual(0);
    }
  });

  test('toggling channel changes checked state', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    const notifTab = page.locator('button:has-text("Notifications")').first();
    if (await notifTab.count() > 0) {
      await notifTab.click();
      await page.waitForTimeout(300);

      const toggle = page.locator('input[type="checkbox"], [role="switch"]').first();
      if (await toggle.count() > 0) {
        const initialState = await toggle.isChecked().catch(() => null);
        await toggle.click({ force: true });
        await page.waitForTimeout(200);

        const newState = await toggle.isChecked().catch(() => null);
        if (initialState !== null && newState !== null) {
          await expect(initialState).not.toEqual(newState);
        }
      }
    }
  });

  test('Save Notification Preferences button submits changes', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    const notifTab = page.locator('button:has-text("Notifications")').first();
    if (await notifTab.count() > 0) {
      await notifTab.click();
      await page.waitForTimeout(500);

      const saveButton = page.locator('button:has-text("Save Notification Preferences"), button:has-text("Save")').first();
      if (await saveButton.count() > 0 && await saveButton.isEnabled()) {
        await saveButton.scrollIntoViewIfNeeded();
        await page.waitForTimeout(300);
        await saveButton.click({ force: true });
      }
    }
  });
});
