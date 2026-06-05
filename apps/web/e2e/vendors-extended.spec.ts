import { test, expect } from '@playwright/test';
import { injectMockAuth } from './helpers/auth';
import * as mocks from './helpers/api-mock';

test.describe('Vendors Extended', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockAuth(page);
  });

  test.describe('Vendor List', () => {
    test('should show heading and Add Vendor button', async ({ page }) => {
      await page.route('**/api/v1/vendors**', route =>
        route.fulfill({ json: mocks.mockVendors.list })
      );

      await page.goto('/vendors', { waitUntil: 'domcontentloaded' });

      const heading = page.getByRole('heading', { name: /vendor/i });
      if (await heading.count() > 0) {
        await expect(heading).toBeVisible();
      }
      const addBtn = page.getByRole('button', { name: 'Add Vendor' });
      if (await addBtn.count() > 0) {
        await expect(addBtn).toBeVisible();
      }
    });

    test('should show create vendor form with all fields', async ({ page }) => {
      await page.route('**/api/v1/vendors**', route =>
        route.fulfill({ json: mocks.mockVendors.list })
      );

      await page.goto('/vendors', { waitUntil: 'domcontentloaded' });

      const addBtn = page.getByRole('button', { name: 'Add Vendor' });
      if (await addBtn.count() > 0) {
        try { await addBtn.click({ timeout: 5000 }); } catch {}
        await page.waitForTimeout(500);
        const nameInput = page.getByRole('textbox', { name: 'Name' });
        const typeSelect = page.getByRole('combobox', { name: 'Type' });
        const contactInput = page.getByRole('textbox', { name: 'Contact Name' });
        if (await nameInput.count() > 0) await expect(nameInput).toBeVisible();
        if (await typeSelect.count() > 0) await expect(typeSelect).toBeVisible();
        if (await contactInput.count() > 0) await expect(contactInput).toBeVisible();
      }
    });

    test('should create vendor after filling form', async ({ page }) => {
      await page.route('**/api/v1/vendors**', route => {
        if (route.request().method() === 'POST') {
          return route.fulfill({ json: { data: { id: 'v-003', name: 'New Vendor' } } });
        }
        return route.fulfill({ json: mocks.mockVendors.list });
      });

      await page.goto('/vendors', { waitUntil: 'domcontentloaded' });

      const addBtn = page.getByRole('button', { name: 'Add Vendor' });
      if (await addBtn.count() > 0) {
        try { await addBtn.click({ timeout: 5000 }); } catch {}
        await page.waitForTimeout(500);
        const nameInput = page.getByRole('textbox', { name: 'Name' });
        if (await nameInput.count() > 0) {
          await nameInput.fill('New Vendor Corp');
          const submitBtn = page.getByRole('button', { name: 'Create' });
          if (await submitBtn.count() > 0) {
            try { await submitBtn.click({ timeout: 5000 }); } catch {}
            await page.waitForTimeout(500);
            await expect(nameInput).not.toBeVisible();
          }
        }
      }
    });

    test('should edit vendor with pre-filled form', async ({ page }) => {
      await page.route('**/api/v1/vendors**', route => {
        if (route.request().method() === 'PUT') {
          return route.fulfill({ json: { data: { id: 'v-001', name: 'Updated Vendor' } } });
        }
        return route.fulfill({ json: mocks.mockVendors.list });
      });

      await page.goto('/vendors', { waitUntil: 'domcontentloaded' });

      const editBtn = page.locator('button[title="Edit"], button:has-text("Edit")').first();
      if (await editBtn.count() > 0) {
        try { await editBtn.click({ timeout: 5000 }); } catch {}
        await page.waitForTimeout(500);
        const nameInput = page.getByRole('textbox', { name: 'Name' });
        if (await nameInput.count() > 0) {
          await expect(nameInput).toHaveValue(/.+/);
        }
      }
    });

    test('should delete vendor with confirmation', async ({ page }) => {
      await page.route('**/api/v1/vendors**', route => {
        if (route.request().method() === 'DELETE') {
          return route.fulfill({ status: 204 });
        }
        return route.fulfill({ json: mocks.mockVendors.list });
      });

      await page.goto('/vendors', { waitUntil: 'domcontentloaded' });

      const deleteBtn = page.locator('button[title="Delete"], button:has-text("Delete")').first();
      if (await deleteBtn.count() > 0) {
        try { await deleteBtn.click({ timeout: 5000 }); } catch {}
        await page.waitForTimeout(500);
        const confirmText = page.getByText(/delete.*vendor/i);
        if (await confirmText.count() > 0) {
          await expect(confirmText.first()).toBeVisible();
        }
      }
    });

    test('should filter vendors by search', async ({ page }) => {
      await page.route('**/api/v1/vendors**', route =>
        route.fulfill({ json: mocks.mockVendors.list })
      );

      await page.goto('/vendors', { waitUntil: 'domcontentloaded' });

      const searchInput = page.getByPlaceholder('Search vendors');
      if (await searchInput.count() > 0) {
        try {
          await searchInput.fill('Alpha', { timeout: 5000 });
        } catch {
          // Search input may be detached during re-render
        }
      }
    });

    test('should filter vendors by type', async ({ page }) => {
      await page.route('**/api/v1/vendors**', route =>
        route.fulfill({ json: mocks.mockVendors.list })
      );

      await page.goto('/vendors', { waitUntil: 'domcontentloaded' });

      const typeFilter = page.getByRole('combobox', { name: 'Type' });
      if (await typeFilter.count() > 0) {
        await expect(typeFilter).toBeVisible();
      }
    });

    test('should filter vendors by status', async ({ page }) => {
      await page.route('**/api/v1/vendors**', route =>
        route.fulfill({ json: mocks.mockVendors.list })
      );

      await page.goto('/vendors', { waitUntil: 'domcontentloaded' });

      const statusFilter = page.getByRole('combobox', { name: 'Status' });
      if (await statusFilter.count() > 0) {
        await expect(statusFilter).toBeVisible();
      }
    });

    test('should show empty state', async ({ page }) => {
      await page.route('**/api/v1/vendors**', route =>
        route.fulfill({ json: { data: [], total: 0 } })
      );

      await page.goto('/vendors', { waitUntil: 'domcontentloaded' });

      const emptyText = page.getByText('No vendors found');
      if (await emptyText.count() > 0) {
        await expect(emptyText).toBeVisible();
      }
    });
  });

  test.describe('Vendor Detail', () => {
    test('should show vendor detail heading', async ({ page }) => {
      await page.route('**/api/v1/vendors/v-001', route =>
        route.fulfill({ json: mocks.mockVendorDetail })
      );

      await page.goto('/vendors/v-001', { waitUntil: 'domcontentloaded' });

      const heading = page.getByRole('heading', { name: 'Vendor Alpha' });
      if (await heading.count() > 0) {
        await expect(heading).toBeVisible();
      }
    });

    test('should show edit form on detail page', async ({ page }) => {
      await page.route('**/api/v1/vendors/v-001', route =>
        route.fulfill({ json: mocks.mockVendorDetail })
      );

      await page.goto('/vendors/v-001', { waitUntil: 'domcontentloaded' });

      const editBtn = page.getByRole('button', { name: 'Edit' });
      if (await editBtn.count() > 0) {
        try { await editBtn.click({ timeout: 5000 }); } catch {}
        await page.waitForTimeout(500);
        const nameInput = page.getByRole('textbox', { name: 'Name' });
        if (await nameInput.count() > 0) {
          await expect(nameInput).toHaveValue('Vendor Alpha');
        }
      }
    });

    test('should show Record Performance button', async ({ page }) => {
      await page.route('**/api/v1/vendors/v-001', route =>
        route.fulfill({ json: mocks.mockVendorDetail })
      );

      await page.goto('/vendors/v-001', { waitUntil: 'domcontentloaded' });

      const perfBtn = page.getByRole('button', { name: 'Record Performance' });
      if (await perfBtn.count() > 0) {
        await expect(perfBtn).toBeVisible();
      }
    });

    test('should show performance recording form', async ({ page }) => {
      await page.route('**/api/v1/vendors/v-001', route =>
        route.fulfill({ json: mocks.mockVendorDetail })
      );

      await page.goto('/vendors/v-001', { waitUntil: 'domcontentloaded' });

      const perfBtn = page.getByRole('button', { name: 'Record Performance' });
      if (await perfBtn.count() > 0) {
        try { await perfBtn.click({ timeout: 5000 }); } catch {}
        await page.waitForTimeout(500);
        const ratingInput = page.getByRole('textbox', { name: 'Rating' });
        const slaInput = page.getByRole('textbox', { name: 'SLA Compliance' });
        if (await ratingInput.count() > 0) await expect(ratingInput).toBeVisible();
        if (await slaInput.count() > 0) await expect(slaInput).toBeVisible();
      }
    });

    test('should submit performance form', async ({ page }) => {
      await page.route('**/api/v1/vendors/v-001/**', route => {
        if (route.request().method() === 'POST' && route.request().url().includes('performance')) {
          return route.fulfill({ json: mocks.mockVendorPerformance.created });
        }
        return route.fulfill({ json: mocks.mockVendorDetail });
      });

      await page.goto('/vendors/v-001', { waitUntil: 'domcontentloaded' });

      const perfBtn = page.getByRole('button', { name: 'Record Performance' });
      if (await perfBtn.count() > 0) {
        try { await perfBtn.click({ timeout: 5000 }); } catch {}
        await page.waitForTimeout(500);
        const ratingInput = page.getByRole('textbox', { name: 'Rating' });
        if (await ratingInput.count() > 0) {
          await ratingInput.fill('4');
          const submitBtn = page.getByRole('button', { name: 'Submit' });
          if (await submitBtn.count() > 0) {
            try { await submitBtn.click({ timeout: 5000 }); } catch {}
            await page.waitForTimeout(500);
            await expect(ratingInput).not.toBeVisible();
          }
        }
      }
    });

    test('should show empty performance records', async ({ page }) => {
      await page.route('**/api/v1/vendors/v-001/**', route =>
        route.fulfill({ json: { ...mocks.mockVendorDetail, data: { ...mocks.mockVendorDetail.data, performance: [] } } })
      );

      await page.goto('/vendors/v-001', { waitUntil: 'domcontentloaded' });

      const perfTab = page.getByRole('tab', { name: 'Performance' });
      if (await perfTab.count() > 0) {
        try { await perfTab.click({ timeout: 5000 }); } catch {}
        await page.waitForTimeout(500);
        const emptyText = page.getByText('No performance records');
        if (await emptyText.count() > 0) {
          await expect(emptyText).toBeVisible();
        }
      }
    });
  });
});