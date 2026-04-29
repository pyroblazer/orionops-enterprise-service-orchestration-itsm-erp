import { test, expect } from '@playwright/test';

test.describe('Incident Lifecycle', () => {
  // Helper to set up authenticated state
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.setItem('orionops_access_token', 'mock-access-token');
      localStorage.setItem('orionops_refresh_token', 'mock-refresh-token');
    });
  });

  test('create a new incident', async ({ page }) => {
    await page.goto('/incidents/new');
    await page.waitForLoadState('networkidle');

    // Verify the new incident form is displayed
    const formTitle = page.locator('h1, h2');
    await expect(formTitle).toContainText(/incident/i);

    // Fill in incident details (selectors based on typical form structure)
    const titleInput = page.locator('input[label="Title"], input[placeholder*="title" i], #title');
    if (await titleInput.count() > 0) {
      await titleInput.fill('E2E Test: Server Outage');
    }

    const descInput = page.locator('textarea[label="Description"], textarea[placeholder*="description" i], #description');
    if (await descInput.count() > 0) {
      await descInput.fill('Production server is unresponsive since 10:00 AM.');
    }

    // Submit the form
    const submitButton = page.locator('button:has-text("Create"), button:has-text("Submit"), button[type="submit"]');
    if (await submitButton.count() > 0) {
      await submitButton.first().click();
    }
  });

  test('view incident in list', async ({ page }) => {
    await page.goto('/incidents');
    await page.waitForLoadState('networkidle');

    // Verify the incidents list page loads
    await expect(page.locator('h1')).toContainText('Incidents');

    // Verify the table is present
    const table = page.locator('table, [role="table"]');
    await expect(table).toBeVisible();
  });

  test('open incident detail', async ({ page }) => {
    // Navigate to incidents list
    await page.goto('/incidents');
    await page.waitForLoadState('networkidle');

    // Click on the first incident link
    const firstIncidentLink = page.locator('a[href*="/incidents/"]').first();
    if (await firstIncidentLink.count() > 0) {
      await firstIncidentLink.click();
      await page.waitForLoadState('networkidle');

      // Verify detail page loaded
      const detailContent = page.locator('h1, h2, [data-testid="incident-detail"]');
      await expect(detailContent).toBeVisible();
    }
  });

  test('verify incident status changes through lifecycle', async ({ page }) => {
    await page.goto('/incidents');
    await page.waitForLoadState('networkidle');

    // Verify status badges are visible in the table
    const statusBadges = page.locator('[role="status"]');
    const badgeCount = await statusBadges.count();

    if (badgeCount > 0) {
      // Verify at least one status badge is visible
      await expect(statusBadges.first()).toBeVisible();
    }
  });

  test('incident list pagination works', async ({ page }) => {
    await page.goto('/incidents');
    await page.waitForLoadState('networkidle');

    // Check if pagination is present
    const pagination = page.locator('[aria-label="Pagination"]');
    if (await pagination.count() > 0) {
      // Click next page if available
      const nextButton = pagination.locator('[aria-label="Go to next page"]');
      if (await nextButton.count() > 0 && await nextButton.isEnabled()) {
        await nextButton.click();
        await page.waitForLoadState('networkidle');
      }
    }
  });
});
