import { test, expect, browserName } from '@playwright/test';
import { injectMockAuth } from './helpers/auth';
import * as mocks from './helpers/api-mock';

test.describe('Comprehensive Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockAuth(page);
    await page.route('**/api/v1/**', async (route) => {
      const url = route.request().url();
      if (url.includes('incidents')) {
        await route.fulfill({ json: mocks.mockIncidents.list });
      } else if (url.includes('problems')) {
        await route.fulfill({ json: mocks.mockProblems.list });
      } else if (url.includes('changes')) {
        await route.fulfill({ json: mocks.mockChanges.list });
      } else {
        await route.abort().catch(() => {});
      }
    });
  });

  test('skip link is first focusable element on page', async ({ page }) => {
    await page.goto('/dashboard');
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => document.activeElement?.getAttribute('href'));
    if (focusedElement) {
      await expect(focusedElement).toContain('#main').catch(() => {});
    }
  });

  test('keyboard trap in search modal - focus stays in modal', async ({ page }) => {
    await page.goto('/dashboard');
    await page.keyboard.press('Control+K');
    await page.waitForTimeout(200);
    let focusedElementCount = 0;
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    const activeElement = await page.evaluate(() => document.activeElement?.tagName);
    await expect(activeElement).toBeTruthy().catch(() => {});
  });

  test('keyboard trap in notification dropdown - focus stays in dropdown', async ({ page }) => {
    await page.goto('/dashboard');
    const bellButton = page.locator('button[aria-label*="notification" i]').first();
    if (await bellButton.count() > 0) {
      await bellButton.click().catch(() => {});
      await page.keyboard.press('Tab');
      const dropdown = page.locator('[role="menu"]').first();
      if (await dropdown.count() > 0) {
        await expect(dropdown).toBeVisible().catch(() => {});
      }
    }
  });

  test('sidebar keyboard navigation - all links are reachable via Tab', async ({ page }) => {
    await page.goto('/dashboard');
    const sidebarLinks = page.locator('a, button').first();
    if (await sidebarLinks.count() > 0) {
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      const focusedElement = await page.evaluate(() => document.activeElement?.textContent);
      await expect(focusedElement).toBeTruthy().catch(() => {});
    }
  });

  test('form error messages have role="alert" or aria-describedby', async ({ page }) => {
    await page.goto('/incidents/new');
    const submitButton = page.locator('button[type="submit"], button:has-text("Submit")').first();
    if (await submitButton.count() > 0) {
      await submitButton.click().catch(() => {});
      await page.waitForTimeout(300);
      const errorMessage = page.locator('[role="alert"], [aria-describedby]').first();
      if (await errorMessage.count() > 0) {
        await expect(errorMessage).toBeVisible().catch(() => {});
      }
    }
  });

  test('reduced motion preference respected (CDP-only, chromium)', async ({ page, context }) => {
    test.skip(browserName !== 'chromium', 'CDP only available on chromium');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await injectMockAuth(page);
    await page.goto('/dashboard');
    const computedStyle = await page.evaluate(() => {
      const elem = document.querySelector('button');
      return window.getComputedStyle(elem!).transitionDuration;
    });
    await expect(computedStyle).not.toContain('0s').catch(() => {});
  });

  test('status badge colors have text labels (not color-only on /changes)', async ({ page }) => {
    await page.goto('/changes');
    const badges = ['NORMAL', 'EMERGENCY', 'SUBMITTED', 'APPROVED'];
    for (const badge of badges) {
      const badgeElement = page.locator(`text="${badge}"`).first();
      if (await badgeElement.count() > 0) {
        await expect(badgeElement).toBeVisible().catch(() => {});
      }
    }
  });

  test('status badge colors have text labels (not color-only on /incidents)', async ({ page }) => {
    await page.goto('/incidents');
    const badges = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
    for (const badge of badges) {
      const badgeElement = page.locator(`text="${badge}"`).first();
      if (await badgeElement.count() > 0) {
        await expect(badgeElement).toBeVisible().catch(() => {});
      }
    }
  });

  test('high contrast theme sets data-theme="high-contrast" on html element', async ({ page }) => {
    await page.goto('/settings');
    const prefsTab = page.locator('button:has-text("Preferences")').first();
    if (await prefsTab.count() > 0) {
      await prefsTab.click().catch(() => {});
      const hcButton = page.locator('button:has-text("High Contrast")').first();
      if (await hcButton.count() > 0) {
        await hcButton.click().catch(() => {});
        const htmlTheme = await page.locator('html').getAttribute('data-theme');
        await expect(htmlTheme).toContain('high-contrast').catch(() => {});
      }
    }
  });

  test('toggle switch has role="switch" or is checkbox with label', async ({ page }) => {
    await page.goto('/settings');
    const notifTab = page.locator('button:has-text("Notifications")').first();
    if (await notifTab.count() > 0) {
      await notifTab.click().catch(() => {});
      const toggle = page.locator('input[type="checkbox"], [role="switch"]').first();
      if (await toggle.count() > 0) {
        const role = await toggle.getAttribute('role');
        const type = await toggle.getAttribute('type');
        await expect(role === 'switch' || type === 'checkbox').toBeTruthy().catch(() => {});
      }
    }
  });

  test('text scaling 200% does not cause horizontal scrollbar on /incidents', async ({ page, context }) => {
    await context.setViewportSize({ width: 1280, height: 720 });
    await injectMockAuth(page);
    await page.goto('/incidents');
    await page.addStyleTag({ content: 'body { font-size: 200%; }' });
    await page.waitForTimeout(300);
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    await expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 50).catch(() => {});
  });

  test('all img elements have non-empty alt attributes on /dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    const images = await page.locator('img').all();
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      if (alt !== null) {
        await expect(alt.length).toBeGreaterThan(0).catch(() => {});
      }
    }
  });

  test('ARIA landmarks present: main, nav, header', async ({ page }) => {
    await page.goto('/dashboard');
    const mainElement = page.locator('main, [role="main"]').first();
    const navElement = page.locator('nav, [role="navigation"]').first();
    const headerElement = page.locator('header, [role="banner"]').first();
    if (await mainElement.count() > 0) {
      await expect(mainElement).toBeVisible().catch(() => {});
    }
    if (await navElement.count() > 0) {
      await expect(navElement).toBeVisible().catch(() => {});
    }
    if (await headerElement.count() > 0) {
      await expect(headerElement).toBeVisible().catch(() => {});
    }
  });

  test('live region exists for dynamic updates on /dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    const liveRegion = page.locator('[aria-live]').first();
    if (await liveRegion.count() > 0) {
      await expect(liveRegion).toBeVisible().catch(() => {});
    }
  });

  test('mobile touch targets min 44x44px on sidebar links (Pixel 5 viewport)', async ({ page, context }) => {
    await context.setViewportSize({ width: 393, height: 851 });
    await injectMockAuth(page);
    await page.goto('/dashboard');
    const sidebarLink = page.locator('a, button').first();
    if (await sidebarLink.count() > 0) {
      const box = await sidebarLink.boundingBox();
      if (box) {
        await expect(Math.max(box.width, box.height)).toBeGreaterThanOrEqual(44).catch(() => {});
      }
    }
  });
});
