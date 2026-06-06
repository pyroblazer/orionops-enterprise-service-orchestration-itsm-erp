import { test, expect } from '@playwright/test';
import { injectMockAuth } from './helpers/auth';
import * as mocks from './helpers/api-mock';

test.describe('Finance General Ledger Extended', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockAuth(page);
    await page.route('**/api/v1/finance/gl/**', async (route) => {
      const url = route.request().url();
      if (url.includes('trial-balance')) {
        await route.fulfill({ json: mocks.mockTrialBalance });
      } else if (url.includes('income-statement')) {
        await route.fulfill({ json: mocks.mockIncomeStatement });
      } else {
        await route.fulfill({ json: mocks.mockGLAccounts });
      }
    });
    await page.route('**/api/v1/finance**', async (route) => {
      await route.fulfill({ json: mocks.mockFinance });
    });
  });

  test('should render General Ledger heading', async ({ page }) => {
    await page.goto('/finance/gl', { waitUntil: 'domcontentloaded' });

    await expect(page.getByText('General Ledger')).toBeVisible();
  });

  test('should show three tab buttons', async ({ page }) => {
    await page.goto('/finance/gl', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('button', { name: 'Chart of Accounts' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Trial Balance' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Income Statement' })).toBeVisible();
  });

  test('should show Chart of Accounts table with columns', async ({ page }) => {
    await page.goto('/finance/gl', { waitUntil: 'domcontentloaded' });

    const columns = ['Code', 'Name', 'Type', 'Balance'];
    for (const col of columns) {
      await expect(
        page.getByRole('columnheader', { name: new RegExp(col, 'i') }).first()
      ).toBeVisible();
    }
  });

  test('should display account data from mock', async ({ page }) => {
    await page.goto('/finance/gl', { waitUntil: 'domcontentloaded' });

    await expect(page.getByText('1000')).toBeVisible();
    await expect(page.getByText('Cash')).toBeVisible();
    await expect(page.getByText('ASSET')).toBeVisible();
  });

  test('should switch to Trial Balance and show debits/credits with Balanced badge', async ({ page }) => {
    await page.goto('/finance/gl', { waitUntil: 'domcontentloaded' });

    await page.getByRole('button', { name: 'Trial Balance' }).click();

    await expect(page.getByText(/\$?150,?000/)).toBeVisible();
    await expect(page.getByText(/balanced/i)).toBeVisible();
  });

  test('should switch to Income Statement and show revenue/expenses/net income', async ({ page }) => {
    await page.goto('/finance/gl', { waitUntil: 'domcontentloaded' });

    await page.getByRole('button', { name: 'Income Statement' }).click();

    await expect(page.getByText(/revenue/i)).toBeVisible();
    await expect(page.getByText(/expenses/i)).toBeVisible();
    await expect(page.getByText(/net income/i)).toBeVisible();
  });

  test('should show Unbalanced badge when trial balance is unbalanced', async ({ page }) => {
    await page.route('**/api/v1/finance/gl/trial-balance**', async (route) => {
      await route.fulfill({
        json: { data: { debits: 150000, credits: 145000, balanced: false } },
      });
    });

    await page.goto('/finance/gl', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Trial Balance' }).click();

    await expect(page.getByText(/unbalanced/i)).toBeVisible();
  });

  test('should show additional account types', async ({ page }) => {
    await page.goto('/finance/gl', { waitUntil: 'domcontentloaded' });

    await expect(page.getByText('LIABILITY')).toBeVisible();
    await expect(page.getByText('REVENUE')).toBeVisible();
  });
});
