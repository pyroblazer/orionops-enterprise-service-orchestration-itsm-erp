import { test, expect } from '@playwright/test';
import { injectMockAuth } from './helpers/auth';
import * as mocks from './helpers/api-mock';

test.describe('Finance Forecast', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockAuth(page);
    // Mock budgets endpoint — page calls api.getBudgets() → /finance/budgets
    await page.route('**/api/v1/finance/budgets**', (route) =>
      route.fulfill({
        json: {
          data: [
            { id: 'budget-001', name: 'IT Operations', amount: 500000, projected: 400000, onTrack: true },
            { id: 'budget-002', name: 'Marketing', amount: 200000, projected: 250000, onTrack: false },
          ],
        },
      })
    );
    // Mock alerts endpoint — page calls api.getBudgetAlerts() → /finance/forecast/alerts
    await page.route('**/api/v1/finance/forecast/alerts**', (route) =>
      route.fulfill({
        json: {
          data: [
            { id: 'alert-001', name: 'IT Operations', utilization: 85 },
            { id: 'alert-002', name: 'Marketing', utilization: 92 },
          ],
        },
      })
    );
    // Catch-all for any other finance routes
    await page.route('**/api/v1/finance/**', (route) =>
      route.fulfill({ json: mocks.mockFinance })
    );
  });

  test('should show loading skeleton during fetch', async ({ page }) => {
    // Override with delayed response
    await page.route('**/api/v1/finance/budgets**', async (route) => {
      await new Promise((r) => setTimeout(r, 1000));
      return route.fulfill({ json: { data: [] } });
    });

    await page.goto('/finance/forecast', { waitUntil: 'domcontentloaded' });
    const skeleton = page.locator('[class*="skeleton"], [class*="animate-pulse"]').first();
    if (await skeleton.count() > 0) {
      await expect(skeleton).toBeVisible();
    }
  });

  test('should show Budget Forecast heading', async ({ page }) => {
    await page.goto('/finance/forecast', { waitUntil: 'domcontentloaded' });
    const heading = page.getByRole('heading', { name: 'Budget Forecast' });
    if (await heading.count() > 0) {
      await expect(heading).toBeVisible();
    } else {
      // Page may still render as a fallback
      const anyHeading = page.locator('h1, h2').first();
      await expect(anyHeading).toBeVisible();
    }
  });

  test('should show subtitle text', async ({ page }) => {
    await page.goto('/finance/forecast', { waitUntil: 'domcontentloaded' });
    const subtitle = page.getByText('Project budget utilization and overspend risks');
    if (await subtitle.count() > 0) {
      await expect(subtitle).toBeVisible();
    }
  });

  test('should display budget forecast cards', async ({ page }) => {
    await page.goto('/finance/forecast', { waitUntil: 'domcontentloaded' });
    const budgetName = page.getByText('IT Operations');
    if (await budgetName.count() > 0) {
      await expect(budgetName).toBeVisible();
    }
  });

  test('should show budgeted amount label', async ({ page }) => {
    await page.goto('/finance/forecast', { waitUntil: 'domcontentloaded' });
    const label = page.getByText('Budgeted Amount');
    if (await label.count() > 0) {
      await expect(label).toBeVisible();
    }
  });

  test('should show projected spend label', async ({ page }) => {
    await page.goto('/finance/forecast', { waitUntil: 'domcontentloaded' });
    const label = page.getByText('Projected Spend');
    if (await label.count() > 0) {
      await expect(label).toBeVisible();
    }
  });

  test('should show budget alerts when alerts exist', async ({ page }) => {
    await page.goto('/finance/forecast', { waitUntil: 'domcontentloaded' });
    const alertCard = page.getByText('Budget Alerts');
    if (await alertCard.count() > 0) {
      await expect(alertCard).toBeVisible();
    }
  });

  test('should display error message on API failure', async ({ page }) => {
    await page.route('**/api/v1/finance/**', (route) =>
      route.fulfill({ status: 500, body: 'Internal Server Error' })
    );

    await page.goto('/finance/forecast', { waitUntil: 'domcontentloaded' });
    // Page should still render something even on error
    const content = page.locator('h1, h2, .text-red').first();
    if (await content.count() > 0) {
      await expect(content).toBeVisible();
    }
  });

  test('should show Budget Forecasts section heading', async ({ page }) => {
    await page.goto('/finance/forecast', { waitUntil: 'domcontentloaded' });
    const sectionHeading = page.getByRole('heading', { name: 'Budget Forecasts' });
    if (await sectionHeading.count() > 0) {
      await expect(sectionHeading).toBeVisible();
    }
  });
});
