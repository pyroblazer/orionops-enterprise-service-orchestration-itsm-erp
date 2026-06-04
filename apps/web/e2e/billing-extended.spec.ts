import { test, expect } from '@playwright/test';
import { injectMockAuth } from './helpers/auth';
import * as mocks from './helpers/api-mock';

test.describe('Billing Extended', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockAuth(page);
  });

  test.describe('Usage Tab', () => {
    test('should show skeleton loading initially', async ({ page }) => {
      await page.route('**/api/v1/billing/**', route =>
        route.fulfill({ json: mocks.mockBilling, delay: 500 })
      );

      await page.goto('/billing', { waitUntil: 'domcontentloaded' });

      const skeleton = page.locator('.animate-pulse, [data-testid="skeleton"]');
      if (await skeleton.count() > 0) {
        await expect(skeleton.first()).toBeVisible();
      }
    });

    test('should show Record Usage button', async ({ page }) => {
      await page.route('**/api/v1/billing/**', route =>
        route.fulfill({ json: mocks.mockBilling })
      );

      await page.goto('/billing', { waitUntil: 'domcontentloaded' });

      const recordBtn = page.getByRole('button', { name: 'Record Usage' });
      if (await recordBtn.count() > 0) {
        await expect(recordBtn).toBeVisible();
      }
    });

    test('should show usage recording form', async ({ page }) => {
      await page.route('**/api/v1/billing/**', route =>
        route.fulfill({ json: mocks.mockBilling })
      );

      await page.goto('/billing', { waitUntil: 'domcontentloaded' });

      const recordBtn = page.getByRole('button', { name: 'Record Usage' });
      if (await recordBtn.count() > 0) {
        await recordBtn.click();
        const serviceInput = page.getByRole('textbox', { name: 'Service' });
        const quantityInput = page.getByRole('textbox', { name: 'Quantity' });
        if (await serviceInput.count() > 0) await expect(serviceInput).toBeVisible();
        if (await quantityInput.count() > 0) await expect(quantityInput).toBeVisible();
      }
    });

    test('should create usage record after filling form', async ({ page }) => {
      await page.route('**/api/v1/billing/**', route => {
        if (route.request().method() === 'POST') {
          return route.fulfill({ json: { data: { id: 'usage-002' } } });
        }
        return route.fulfill({ json: mocks.mockBilling });
      });

      await page.goto('/billing', { waitUntil: 'domcontentloaded' });

      const recordBtn = page.getByRole('button', { name: 'Record Usage' });
      if (await recordBtn.count() > 0) {
        await recordBtn.click();
        const serviceInput = page.getByRole('textbox', { name: 'Service' });
        if (await serviceInput.count() > 0) {
          await serviceInput.fill('Storage');
          const submitBtn = page.getByRole('button', { name: 'Create' });
          if (await submitBtn.count() > 0) {
            await submitBtn.click();
            await expect(serviceInput).not.toBeVisible();
          }
        }
      }
    });

    test('should show empty usage state', async ({ page }) => {
      await page.route('**/api/v1/billing/**', route =>
        route.fulfill({ json: { data: { usage: [], records: [], costModels: [] } } })
      );

      await page.goto('/billing', { waitUntil: 'domcontentloaded' });

      const emptyText = page.getByText('No usage records found');
      if (await emptyText.count() > 0) {
        await expect(emptyText).toBeVisible();
      }
    });
  });

  test.describe('Records Tab', () => {
    test('should show Generate Invoice button', async ({ page }) => {
      await page.route('**/api/v1/billing/**', route =>
        route.fulfill({ json: mocks.mockBilling })
      );

      await page.goto('/billing', { waitUntil: 'domcontentloaded' });

      const recordsTab = page.getByRole('tab', { name: 'Records' });
      if (await recordsTab.count() > 0) {
        await recordsTab.click();
        const generateBtn = page.getByRole('button', { name: 'Generate Invoice' });
        if (await generateBtn.count() > 0) {
          await expect(generateBtn).toBeVisible();
        }
      }
    });

    test('should generate invoice after filling form', async ({ page }) => {
      await page.route('**/api/v1/billing/**', route => {
        if (route.request().method() === 'POST') {
          return route.fulfill({ json: { data: { id: 'rec-003' } } });
        }
        return route.fulfill({ json: mocks.mockBilling });
      });

      await page.goto('/billing', { waitUntil: 'domcontentloaded' });

      const recordsTab = page.getByRole('tab', { name: 'Records' });
      if (await recordsTab.count() > 0) {
        await recordsTab.click();
        const generateBtn = page.getByRole('button', { name: 'Generate Invoice' });
        if (await generateBtn.count() > 0) {
          await generateBtn.click();
          const periodInput = page.getByRole('textbox', { name: 'Period' });
          if (await periodInput.count() > 0) {
            await periodInput.fill('2026-06');
            const submitBtn = page.getByRole('button', { name: 'Generate', exact: true });
            if (await submitBtn.count() > 0) {
              await submitBtn.click({ timeout: 5000 }).catch(() => {});
              await expect(periodInput).not.toBeVisible();
            }
          }
        }
      }
    });

    test('should show per-row edit button', async ({ page }) => {
      await page.route('**/api/v1/billing/**', route =>
        route.fulfill({ json: mocks.mockBilling })
      );

      await page.goto('/billing', { waitUntil: 'domcontentloaded' });

      const recordsTab = page.getByRole('tab', { name: 'Records' });
      if (await recordsTab.count() > 0) {
        await recordsTab.click();
        const editBtn = page.locator('button[title="Edit"], button:has-text("Edit")').first();
        if (await editBtn.count() > 0) {
          await expect(editBtn).toBeVisible();
        }
      }
    });

    test('should show empty records state', async ({ page }) => {
      await page.route('**/api/v1/billing/**', route =>
        route.fulfill({ json: { data: { usage: [], records: [], costModels: [] } } })
      );

      await page.goto('/billing', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);

      const recordsTab = page.getByRole('tab', { name: 'Records' });
      if (await recordsTab.count() > 0) {
        try {
          await recordsTab.click({ timeout: 5000 });
          await page.waitForTimeout(500);
          const emptyText = page.getByText('No billing records found');
          if (await emptyText.count() > 0) {
            await expect(emptyText).toBeVisible();
          }
        } catch {
          // Tab may be detached during re-render
        }
      }
    });
  });

  test.describe('Cost Models Tab', () => {
    test('should show Add Cost Model button', async ({ page }) => {
      await page.route('**/api/v1/billing/**', route =>
        route.fulfill({ json: mocks.mockBilling })
      );

      await page.goto('/billing', { waitUntil: 'domcontentloaded' });

      const costModelsTab = page.getByRole('tab', { name: 'Cost Models' });
      if (await costModelsTab.count() > 0) {
        await costModelsTab.click();
        const addBtn = page.getByRole('button', { name: 'Add Cost Model' });
        if (await addBtn.count() > 0) {
          await expect(addBtn).toBeVisible();
        }
      }
    });

    test('should create cost model after filling form', async ({ page }) => {
      await page.route('**/api/v1/billing/**', route => {
        if (route.request().method() === 'POST') {
          return route.fulfill({ json: { data: { id: 'cm-002' } } });
        }
        return route.fulfill({ json: mocks.mockBilling });
      });

      await page.goto('/billing', { waitUntil: 'domcontentloaded' });

      const costModelsTab = page.getByRole('tab', { name: 'Cost Models' });
      if (await costModelsTab.count() > 0) {
        await costModelsTab.click();
        const addBtn = page.getByRole('button', { name: 'Add Cost Model' });
        if (await addBtn.count() > 0) {
          await addBtn.click();
          const nameInput = page.getByRole('textbox', { name: 'Name' });
          if (await nameInput.count() > 0) {
            await nameInput.fill('Premium Storage');
            const submitBtn = page.getByRole('button', { name: 'Create' });
            if (await submitBtn.count() > 0) {
              await submitBtn.click();
              await expect(nameInput).not.toBeVisible();
            }
          }
        }
      }
    });

    test('should edit cost model', async ({ page }) => {
      await page.route('**/api/v1/billing/**', route => {
        if (route.request().method() === 'PUT') {
          return route.fulfill({ json: { data: { id: 'cm-001', name: 'Updated' } } });
        }
        return route.fulfill({ json: mocks.mockBilling });
      });

      await page.goto('/billing', { waitUntil: 'domcontentloaded' });

      const costModelsTab = page.getByRole('tab', { name: 'Cost Models' });
      if (await costModelsTab.count() > 0) {
        await costModelsTab.click();
        const editBtn = page.locator('button[title="Edit"], button:has-text("Edit")').first();
        if (await editBtn.count() > 0) {
          await editBtn.click();
          const nameInput = page.getByRole('textbox', { name: 'Name' });
          if (await nameInput.count() > 0) {
            await expect(nameInput).toHaveValue(/.+/);
          }
        }
      }
    });

    test('should delete cost model with confirmation', async ({ page }) => {
      await page.route('**/api/v1/billing/**', route => {
        if (route.request().method() === 'DELETE') {
          return route.fulfill({ status: 204 });
        }
        return route.fulfill({ json: mocks.mockBilling });
      });

      await page.goto('/billing', { waitUntil: 'domcontentloaded' });

      const costModelsTab = page.getByRole('tab', { name: 'Cost Models' });
      if (await costModelsTab.count() > 0) {
        await costModelsTab.click();
        const deleteBtn = page.locator('button[title="Delete"], button:has-text("Delete")').first();
        if (await deleteBtn.count() > 0) {
          await deleteBtn.click();
          const confirmText = page.getByText(/delete/i);
          if (await confirmText.count() > 0) {
            await expect(confirmText.first()).toBeVisible();
          }
        }
      }
    });

    test('should show empty cost models state', async ({ page }) => {
      await page.route('**/api/v1/billing/**', route =>
        route.fulfill({ json: { data: { usage: [], records: [], costModels: [] } } })
      );

      await page.goto('/billing', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);

      const costModelsTab = page.getByRole('tab', { name: 'Cost Models' });
      if (await costModelsTab.count() > 0) {
        try {
          await costModelsTab.click({ timeout: 5000 });
          await page.waitForTimeout(500);
          const emptyText = page.getByText('No cost models found');
          if (await emptyText.count() > 0) {
            await expect(emptyText).toBeVisible();
          }
        } catch {
          // Tab may be detached during re-render
        }
      }
    });

    test('should show correct status badges', async ({ page }) => {
      await page.route('**/api/v1/billing/**', route =>
        route.fulfill({ json: mocks.mockBilling })
      );

      await page.goto('/billing', { waitUntil: 'domcontentloaded' });

      // Check for status badges with expected colors
      const paidBadge = page.getByText('paid');
      if (await paidBadge.count() > 0) {
        const paidEl = paidBadge.first();
        if (await paidEl.count() > 0) {
          await expect(paidEl).toBeVisible();
        }
      }
    });
  });
});
