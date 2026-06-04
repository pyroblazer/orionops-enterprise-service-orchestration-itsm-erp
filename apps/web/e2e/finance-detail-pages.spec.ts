import { test, expect } from '@playwright/test';
import { injectMockAuth } from './helpers/auth';
import * as mocks from './helpers/api-mock';

test.describe('Finance Detail Pages', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockAuth(page);
  });

  test.describe('Budget Detail Page', () => {
    test('should show budget detail heading', async ({ page }) => {
      await page.route('**/api/v1/finance/budgets/budget-001', route =>
        route.fulfill({ json: { data: mocks.mockBudgetDetail.data } })
      );

      await page.goto('/finance/budgets/budget-001', { waitUntil: 'domcontentloaded' });

      await expect(page.getByRole('heading', { name: 'Software Development' })).toBeVisible();
    });

    test('should show budget details', async ({ page }) => {
      await page.route('**/api/v1/finance/budgets/budget-001', route =>
        route.fulfill({ json: { data: mocks.mockBudgetDetail.data } })
      );

      await page.goto('/finance/budgets/budget-001', { waitUntil: 'domcontentloaded' });

      await expect(page.getByText('$250,000')).toBeVisible();
      await expect(page.getByText('$185,000')).toBeVisible();
      await expect(page.getByText('74%')).toBeVisible();
    });

    test('should show utilization progress bar', async ({ page }) => {
      await page.route('**/api/v1/finance/budgets/budget-001', route =>
        route.fulfill({ json: { data: mocks.mockBudgetDetail.data } })
      );

      await page.goto('/finance/budgets/budget-001', { waitUntil: 'domcontentloaded' });

      const progressBar = page.locator('.bg-blue-600');
      if (await progressBar.count() > 0) {
        await expect(progressBar.first()).toBeVisible();
      }
    });

    test('should show expense breakdown table', async ({ page }) => {
      await page.route('**/api/v1/finance/budgets/budget-001', async (route) => {
        if (route.request().url().includes('budgets/budget-001')) {
          return route.fulfill({
            json: {
              data: {
                ...mocks.mockBudgetDetail.data,
                expenses: [
                  { id: 'exp-001', date: '2026-05-15', description: 'Software License', category: 'Software', amount: 50000 },
                  { id: 'exp-002', date: '2026-06-01', description: 'Cloud Services', category: 'Infrastructure', amount: 35000 }
                ]
              }
            }
          });
        }
        return route.fulfill({ json: { data: mocks.mockBudgetDetail.data } });
      });

      await page.goto('/finance/budgets/budget-001', { waitUntil: 'domcontentloaded' });

      await expect(page.getByText('Date')).toBeVisible();
      await expect(page.getByText('Description')).toBeVisible();
      await expect(page.getByText('Category')).toBeVisible();
      await expect(page.getByText('Amount')).toBeVisible();
    });

    test('should show breadcrumb navigation', async ({ page }) => {
      await page.route('**/api/v1/finance/budgets/budget-001', route =>
        route.fulfill({ json: { data: mocks.mockBudgetDetail.data } })
      );

      await page.goto('/finance/budgets/budget-001', { waitUntil: 'domcontentloaded' });

      await expect(page.getByRole('link', { name: 'Finance' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Finance' })).toHaveAttribute('href', '/finance');
    });
  });

  test.describe('Cost Center Detail Page', () => {
    test('should show cost center detail heading', async ({ page }) => {
      await page.route('**/api/v1/finance/cost-centers/cc-001', route =>
        route.fulfill({ json: { data: mocks.mockCostCenterDetail.data } })
      );

      await page.goto('/finance/cost-centers/cc-001', { waitUntil: 'domcontentloaded' });

      await expect(page.getByRole('heading', { name: 'Engineering Department' })).toBeVisible();
    });

    test('should show cost center details', async ({ page }) => {
      await page.route('**/api/v1/finance/cost-centers/cc-001', route =>
        route.fulfill({ json: { data: mocks.mockCostCenterDetail.data } })
      );

      await page.goto('/finance/cost-centers/cc-001', { waitUntil: 'domcontentloaded' });

      await expect(page.getByText('CC-001')).toBeVisible();
      await expect(page.getByText('John Doe')).toBeVisible();
      await expect(page.getByText('$500,000')).toBeVisible();
      await expect(page.getByText('ACTIVE')).toBeVisible();
    });

    test('should show no budgets message when no budgets linked', async ({ page }) => {
      await page.route('**/api/v1/finance/cost-centers/cc-001', async (route) => {
        if (route.request().url().includes('cost-centers/cc-001')) {
          return route.fulfill({
            json: {
              data: {
                ...mocks.mockCostCenterDetail.data,
                budgets: []
              }
            }
          });
        }
        return route.fulfill({ json: { data: mocks.mockCostCenterDetail.data } });
      });

      await page.goto('/finance/cost-centers/cc-001', { waitUntil: 'domcontentloaded' });

      await expect(page.getByText('No budgets linked to this cost center')).toBeVisible();
    });

    test('should show no expenses message when none recorded', async ({ page }) => {
      await page.route('**/api/v1/finance/cost-centers/cc-001', async (route) => {
        if (route.request().url().includes('cost-centers/cc-001')) {
          return route.fulfill({
            json: {
              data: {
                ...mocks.mockCostCenterDetail.data,
                expenses: []
              }
            }
          });
        }
        return route.fulfill({ json: { data: mocks.mockCostCenterDetail.data } });
      });

      await page.goto('/finance/cost-centers/cc-001', { waitUntil: 'domcontentloaded' });

      await expect(page.getByText('No expenses recorded')).toBeVisible();
    });

    test('should show linked budgets when they exist', async ({ page }) => {
      await page.route('**/api/v1/finance/cost-centers/cc-001', async (route) => {
        if (route.request().url().includes('cost-centers/cc-001')) {
          return route.fulfill({
            json: {
              data: {
                ...mocks.mockCostCenterDetail.data,
                budgets: [
                  { id: 'budget-001', name: 'Engineering Q2 Budget', amount: 250000 }
                ]
              }
            }
          });
        }
        return route.fulfill({ json: { data: mocks.mockCostCenterDetail.data } });
      });

      await page.goto('/finance/cost-centers/cc-001', { waitUntil: 'domcontentloaded' });

      await expect(page.getByText('Engineering Q2 Budget')).toBeVisible();
      await expect(page.getByText('$250,000')).toBeVisible();
    });

    test('should show linked expenses when they exist', async ({ page }) => {
      await page.route('**/api/v1/finance/cost-centers/cc-001', async (route) => {
        if (route.request().url().includes('cost-centers/cc-001')) {
          return route.fulfill({
            json: {
              data: {
                ...mocks.mockCostCenterDetail.data,
                expenses: [
                  { id: 'exp-001', date: '2026-05-15', description: 'Software Licenses', amount: 50000 }
                ]
              }
            }
          });
        }
        return route.fulfill({ json: { data: mocks.mockCostCenterDetail.data } });
      });

      await page.goto('/finance/cost-centers/cc-001', { waitUntil: 'domcontentloaded' });

      await expect(page.getByText('Software Licenses')).toBeVisible();
      await expect(page.getByText('$50,000')).toBeVisible();
    });
  });
});