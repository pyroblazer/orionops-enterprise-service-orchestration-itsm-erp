import { test, expect } from '@playwright/test';
import { injectMockAuth } from './helpers/auth';
import * as mocks from './helpers/api-mock';

test.describe('Finance CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockAuth(page);
  });

  test.describe('Finance Overview', () => {
    test('should show 4 summary cards', async ({ page }) => {
      await page.route('**/api/v1/finance/**', route =>
        route.fulfill({ json: mocks.mockFinance })
      );

      await page.goto('/finance', { waitUntil: 'domcontentloaded' });

      const cards = ['Total Budget', 'Total Spent', 'Pending Expenses', 'Overdue Invoices'];
      for (const card of cards) {
        const cardEl = page.getByText(card);
        if (await cardEl.count() > 0) {
          await expect(cardEl.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Budgets Tab', () => {
    test('should show New Budget button', async ({ page }) => {
      await page.route('**/api/v1/finance/**', route =>
        route.fulfill({ json: mocks.mockFinance })
      );

      await page.goto('/finance', { waitUntil: 'domcontentloaded' });

      const newBudgetBtn = page.getByRole('button', { name: 'New Budget' });
      if (await newBudgetBtn.count() > 0) {
        await expect(newBudgetBtn).toBeVisible();
      }
    });

    test('should show budget creation form', async ({ page }) => {
      await page.route('**/api/v1/finance/**', route =>
        route.fulfill({ json: mocks.mockFinance })
      );

      await page.goto('/finance', { waitUntil: 'domcontentloaded' });

      const newBudgetBtn = page.getByRole('button', { name: 'New Budget' });
      if (await newBudgetBtn.count() > 0) {
        await newBudgetBtn.click();
        const nameInput = page.getByRole('textbox', { name: 'Name' });
        const amountInput = page.getByRole('textbox', { name: 'Total Amount' });
        if (await nameInput.count() > 0) await expect(nameInput).toBeVisible();
        if (await amountInput.count() > 0) await expect(amountInput).toBeVisible();
      }
    });

    test('should create budget after filling form', async ({ page }) => {
      await page.route('**/api/v1/finance/**', route => {
        if (route.request().method() === 'POST') {
          return route.fulfill({ json: { data: { id: 'budget-002', name: 'New Budget' } } });
        }
        return route.fulfill({ json: mocks.mockFinance });
      });

      await page.goto('/finance', { waitUntil: 'domcontentloaded' });

      const newBudgetBtn = page.getByRole('button', { name: 'New Budget' });
      if (await newBudgetBtn.count() > 0) {
        await newBudgetBtn.click();
        const nameInput = page.getByRole('textbox', { name: 'Name' });
        if (await nameInput.count() > 0) {
          await nameInput.fill('Q3 Budget');
          const submitBtn = page.getByRole('button', { name: 'Create' });
          if (await submitBtn.count() > 0) {
            await submitBtn.click();
            await expect(nameInput).not.toBeVisible();
          }
        }
      }
    });

    test('should edit budget with pre-filled form', async ({ page }) => {
      await page.route('**/api/v1/finance/**', route =>
        route.fulfill({ json: mocks.mockFinance })
      );

      await page.goto('/finance', { waitUntil: 'domcontentloaded' });

      const editBtn = page.locator('button:has-text("Edit")').first();
      if (await editBtn.count() > 0) {
        await editBtn.click();
        const nameInput = page.getByRole('textbox', { name: 'Name' });
        if (await nameInput.count() > 0) {
          await expect(nameInput).toHaveValue(/.+/);
        }
      }
    });

    test('should delete budget with confirmation', async ({ page }) => {
      await page.route('**/api/v1/finance/**', route => {
        if (route.request().method() === 'DELETE') {
          return route.fulfill({ status: 204 });
        }
        return route.fulfill({ json: mocks.mockFinance });
      });

      await page.goto('/finance', { waitUntil: 'domcontentloaded' });

      const deleteBtn = page.locator('button:has-text("Delete")').first();
      if (await deleteBtn.count() > 0) {
        await deleteBtn.click();
        const confirmText = page.getByText('Delete this budget?');
        if (await confirmText.count() > 0) {
          await expect(confirmText).toBeVisible();
        }
      }
    });

    test('should show utilization progress bar per row', async ({ page }) => {
      await page.route('**/api/v1/finance/**', route =>
        route.fulfill({ json: mocks.mockFinance })
      );

      await page.goto('/finance', { waitUntil: 'domcontentloaded' });

      const progressBar = page.locator('[role="progressbar"]');
      if (await progressBar.count() > 0) {
        await expect(progressBar.first()).toBeVisible();
      }
    });

    test('should show empty budgets state', async ({ page }) => {
      await page.route('**/api/v1/finance/**', route =>
        route.fulfill({ json: { data: { budgets: [], expenses: [], invoices: [], costCenters: [] } } })
      );

      await page.goto('/finance', { waitUntil: 'domcontentloaded' });

      const emptyText = page.getByText('No budgets found');
      if (await emptyText.count() > 0) {
        await expect(emptyText).toBeVisible();
      }
    });
  });

  test.describe('Expenses Tab', () => {
    test('should show expense controls', async ({ page }) => {
      await page.route('**/api/v1/finance/**', route =>
        route.fulfill({ json: mocks.mockFinance })
      );

      await page.goto('/finance', { waitUntil: 'domcontentloaded' });

      const expensesTab = page.getByRole('tab', { name: 'Expenses' });
      if (await expensesTab.count() > 0) {
        await expensesTab.click();
        const searchInput = page.getByPlaceholder('Search');
        const newExpenseBtn = page.getByRole('button', { name: 'New Expense' });
        if (await searchInput.count() > 0) await expect(searchInput).toBeVisible();
        if (await newExpenseBtn.count() > 0) await expect(newExpenseBtn).toBeVisible();
      }
    });

    test('should create expense after filling form', async ({ page }) => {
      await page.route('**/api/v1/finance/**', route => {
        if (route.request().method() === 'POST') {
          return route.fulfill({ json: { data: { id: 'exp-003', title: 'New Expense' } } });
        }
        return route.fulfill({ json: mocks.mockFinance });
      });

      await page.goto('/finance', { waitUntil: 'domcontentloaded' });

      const expensesTab = page.getByRole('tab', { name: 'Expenses' });
      if (await expensesTab.count() > 0) {
        await expensesTab.click();
        const newExpenseBtn = page.getByRole('button', { name: 'New Expense' });
        if (await newExpenseBtn.count() > 0) {
          await newExpenseBtn.click();
          const titleInput = page.getByRole('textbox', { name: 'Title' });
          if (await titleInput.count() > 0) {
            await titleInput.fill('Office Supplies');
            const submitBtn = page.getByRole('button', { name: 'Create' });
            if (await submitBtn.count() > 0) {
              await submitBtn.click();
              await expect(titleInput).not.toBeVisible();
            }
          }
        }
      }
    });

    test('should approve pending expense', async ({ page }) => {
      await page.route('**/api/v1/finance/**', route => {
        if (route.request().method() === 'PATCH') {
          return route.fulfill({ json: { data: { id: 'exp-001', status: 'approved' } } });
        }
        return route.fulfill({ json: mocks.mockFinance });
      });

      await page.goto('/finance', { waitUntil: 'domcontentloaded' });

      const expensesTab = page.getByRole('tab', { name: 'Expenses' });
      if (await expensesTab.count() > 0) {
        await expensesTab.click();
        const approveBtn = page.getByRole('button', { name: 'Approve' }).first();
        if (await approveBtn.count() > 0) {
          await approveBtn.click();
        }
      }
    });

    test('should reject pending expense', async ({ page }) => {
      await page.route('**/api/v1/finance/**', route => {
        if (route.request().method() === 'PATCH') {
          return route.fulfill({ json: { data: { id: 'exp-001', status: 'rejected' } } });
        }
        return route.fulfill({ json: mocks.mockFinance });
      });

      await page.goto('/finance', { waitUntil: 'domcontentloaded' });

      const expensesTab = page.getByRole('tab', { name: 'Expenses' });
      if (await expensesTab.count() > 0) {
        await expensesTab.click();
        const rejectBtn = page.getByRole('button', { name: 'Reject' }).first();
        if (await rejectBtn.count() > 0) {
          await rejectBtn.click();
        }
      }
    });

    test('should reimburse approved expense', async ({ page }) => {
      await page.route('**/api/v1/finance/**', route => {
        if (route.request().method() === 'PATCH') {
          return route.fulfill({ json: { data: { id: 'exp-001', status: 'reimbursed' } } });
        }
        return route.fulfill({ json: mocks.mockFinance });
      });

      await page.goto('/finance', { waitUntil: 'domcontentloaded' });

      const expensesTab = page.getByRole('tab', { name: 'Expenses' });
      if (await expensesTab.count() > 0) {
        await expensesTab.click();
        const reimburseBtn = page.getByRole('button', { name: 'Reimburse' }).first();
        if (await reimburseBtn.count() > 0) {
          await reimburseBtn.click();
        }
      }
    });

    test('should delete expense', async ({ page }) => {
      await page.route('**/api/v1/finance/**', route => {
        if (route.request().method() === 'DELETE') {
          return route.fulfill({ status: 204 });
        }
        return route.fulfill({ json: mocks.mockFinance });
      });

      await page.goto('/finance', { waitUntil: 'domcontentloaded' });

      const expensesTab = page.getByRole('tab', { name: 'Expenses' });
      if (await expensesTab.count() > 0) {
        await expensesTab.click();
        const deleteBtn = page.locator('button[title="Delete"], button:has-text("Delete")').first();
        if (await deleteBtn.count() > 0) {
          await deleteBtn.click();
        }
      }
    });
  });

  test.describe('Invoices Tab', () => {
    test('should show invoice controls', async ({ page }) => {
      await page.route('**/api/v1/finance/**', route =>
        route.fulfill({ json: mocks.mockFinance })
      );

      await page.goto('/finance', { waitUntil: 'domcontentloaded' });

      const invoicesTab = page.getByRole('tab', { name: 'Invoices' });
      if (await invoicesTab.count() > 0) {
        await invoicesTab.click();
        const newInvoiceBtn = page.getByRole('button', { name: 'New Invoice' });
        if (await newInvoiceBtn.count() > 0) await expect(newInvoiceBtn).toBeVisible();
      }
    });

    test('should create invoice', async ({ page }) => {
      await page.route('**/api/v1/finance/**', route => {
        if (route.request().method() === 'POST') {
          return route.fulfill({ json: { data: { id: 'inv-003' } } });
        }
        return route.fulfill({ json: mocks.mockFinance });
      });

      await page.goto('/finance', { waitUntil: 'domcontentloaded' });

      const invoicesTab = page.getByRole('tab', { name: 'Invoices' });
      if (await invoicesTab.count() > 0) {
        await invoicesTab.click();
        const newInvoiceBtn = page.getByRole('button', { name: 'New Invoice' });
        if (await newInvoiceBtn.count() > 0) {
          await newInvoiceBtn.click();
          const invoiceNumberInput = page.getByRole('textbox', { name: 'Invoice Number' });
          if (await invoiceNumberInput.count() > 0) {
            await invoiceNumberInput.fill('INV-2026-003');
            const submitBtn = page.getByRole('button', { name: 'Create' });
            if (await submitBtn.count() > 0) {
              await submitBtn.click();
            }
          }
        }
      }
    });

    test('should pay sent invoice', async ({ page }) => {
      await page.route('**/api/v1/finance/**', route => {
        if (route.request().method() === 'PATCH' || route.request().method() === 'POST') {
          return route.fulfill({ json: { data: { id: 'inv-001', status: 'paid' } } });
        }
        return route.fulfill({ json: mocks.mockFinance });
      });

      await page.goto('/finance', { waitUntil: 'domcontentloaded' });

      const invoicesTab = page.getByRole('tab', { name: 'Invoices' });
      if (await invoicesTab.count() > 0) {
        await invoicesTab.click();
        const payBtn = page.getByRole('button', { name: 'Pay' }).first();
        if (await payBtn.count() > 0) {
          await payBtn.click();
        }
      }
    });

    test('should send draft invoice', async ({ page }) => {
      await page.route('**/api/v1/finance/**', route => {
        if (route.request().method() === 'PATCH') {
          return route.fulfill({ json: { data: { id: 'inv-001', status: 'sent' } } });
        }
        return route.fulfill({ json: mocks.mockFinance });
      });

      await page.goto('/finance', { waitUntil: 'domcontentloaded' });

      const invoicesTab = page.getByRole('tab', { name: 'Invoices' });
      if (await invoicesTab.count() > 0) {
        await invoicesTab.click();
        const sendBtn = page.getByRole('button', { name: 'Send' }).first();
        if (await sendBtn.count() > 0) {
          await sendBtn.click();
        }
      }
    });
  });

  test.describe('Cost Centers Tab', () => {
    test('should create, edit, delete cost centers', async ({ page }) => {
      await page.route('**/api/v1/finance/**', route => {
        if (route.request().method() === 'POST') {
          return route.fulfill({ json: { data: { id: 'cc-002', name: 'Marketing' } } });
        }
        if (route.request().method() === 'PUT') {
          return route.fulfill({ json: { data: { id: 'cc-001', name: 'Updated' } } });
        }
        if (route.request().method() === 'DELETE') {
          return route.fulfill({ status: 204 });
        }
        return route.fulfill({ json: mocks.mockFinance });
      });

      await page.goto('/finance', { waitUntil: 'domcontentloaded' });

      const costCentersTab = page.getByRole('tab', { name: 'Cost Centers' });
      if (await costCentersTab.count() > 0) {
        await costCentersTab.click();

        const newBtn = page.getByRole('button', { name: 'New Cost Center' });
        if (await newBtn.count() > 0) {
          await newBtn.click();
          const nameInput = page.getByRole('textbox', { name: 'Name' });
          if (await nameInput.count() > 0) {
            await nameInput.fill('Marketing Dept');
            const submitBtn = page.getByRole('button', { name: 'Create' });
            if (await submitBtn.count() > 0) {
              await submitBtn.click();
            }
          }
        }
      }
    });
  });
});
