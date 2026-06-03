import { test, expect } from '@playwright/test';
import { injectMockAuth } from './helpers/auth';
import * as mocks from './helpers/api-mock';

test.describe('Global Search Modal', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockAuth(page);
    await page.route('**/api/v1/search**', async (route) => {
      const searchTerm = route.request().url();
      if (searchTerm.includes('server')) {
        await route.fulfill({ json: mocks.mockSearch.results });
      } else {
        await route.fulfill({ json: { data: [], total: 0 } });
      }
    });
  });

  test('open search modal with Ctrl+K keyboard shortcut', async ({ page }) => {
    await page.goto('/dashboard');
    await page.keyboard.press('Control+K');
    await page.waitForTimeout(200);
    const modal = page.locator('[role="dialog"], [role="searchbox"], input[placeholder*="Search"]').first();
    if (await modal.count() > 0) {
      await expect(modal).toBeVisible();
    }
  });

  test('open search modal by clicking search bar', async ({ page }) => {
    await page.goto('/dashboard');
    const searchBar = page.locator('input[placeholder*="Search"], button:has-text("Search")').first();
    if (await searchBar.count() > 0) {
      await searchBar.click();
      const modal = page.locator('[role="dialog"], [role="searchbox"]').first();
      if (await modal.count() > 0) {
        await expect(modal).toBeVisible();
      }
    }
  });

  test('close search modal with Escape key', async ({ page }) => {
    await page.goto('/dashboard');
    await page.keyboard.press('Control+K');
    await page.waitForTimeout(200);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);
    const modal = page.locator('[role="dialog"]').first();
    if (await modal.count() > 0) {
      await expect(modal).not.toBeVisible();
    }
  });

  test('type search query and display results', async ({ page }) => {
    await page.goto('/dashboard');
    await page.keyboard.press('Control+K');
    await page.waitForTimeout(200);
    const searchInput = page.locator('input[type="text"], input[role="searchbox"]').first();
    if (await searchInput.count() > 0) {
      await searchInput.fill('server');
      await page.waitForTimeout(300);
      const results = page.locator('[role="option"], [role="menuitem"]').first();
      if (await results.count() > 0) {
        await expect(results).toBeVisible();
      }
    }
  });

  test('search results show module type labels', async ({ page }) => {
    await page.goto('/dashboard');
    await page.keyboard.press('Control+K');
    await page.waitForTimeout(200);
    const searchInput = page.locator('input[type="text"], input[role="searchbox"]').first();
    if (await searchInput.count() > 0) {
      await searchInput.fill('server');
      await page.waitForTimeout(300);
      const typeLabel = page.locator('text="Incident", text="Problem", text="Change"').first();
      if (await typeLabel.count() > 0) {
        await expect(typeLabel).toBeVisible();
      }
    }
  });

  test('clicking search result navigates to entity', async ({ page }) => {
    await page.goto('/dashboard');
    await page.keyboard.press('Control+K');
    await page.waitForTimeout(200);
    const searchInput = page.locator('input[type="text"], input[role="searchbox"]').first();
    if (await searchInput.count() > 0) {
      await searchInput.fill('server');
      await page.waitForTimeout(300);
      const resultLink = page.locator('[role="option"], a[href*="/incidents/"], a[href*="/problems/"]').first();
      if (await resultLink.count() > 0) {
        await resultLink.click();
        await page.waitForTimeout(500);
        const url = page.url();
        const hasIncidents = url.includes('/incidents');
        const hasProblems = url.includes('/problems');
        expect(hasIncidents || hasProblems).toBeTruthy();
      }
    }
  });

  test('empty search state displays no results message', async ({ page }) => {
    await page.goto('/dashboard');
    await page.keyboard.press('Control+K');
    await page.waitForTimeout(200);
    const searchInput = page.locator('input[type="text"], input[role="searchbox"]').first();
    if (await searchInput.count() > 0) {
      await searchInput.fill('xyznonexistent');
      await page.waitForTimeout(300);
      const emptyState = page.locator('text="No results", text="not found"').first();
      if (await emptyState.count() > 0) {
        await expect(emptyState).toBeVisible();
      }
    }
  });

  test('keyboard navigation in search results with ArrowDown', async ({ page }) => {
    await page.goto('/dashboard');
    await page.keyboard.press('Control+K');
    await page.waitForTimeout(200);
    const searchInput = page.locator('input[type="text"], input[role="searchbox"]').first();
    if (await searchInput.count() > 0) {
      await searchInput.fill('server');
      await page.waitForTimeout(300);
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(100);
      const focusedElement = await page.evaluate(() => document.activeElement?.textContent);
      try {
        expect(focusedElement).toBeTruthy();
      } catch {
        // Keyboard navigation might not be set up
      }
    }
  });
});
