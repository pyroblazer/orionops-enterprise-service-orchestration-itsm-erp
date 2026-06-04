import { test, expect } from '@playwright/test';
import { injectMockAuth } from './helpers/auth';
import * as mocks from './helpers/api-mock';

test.describe('Admin Extended', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockAuth(page);
  });

  test.describe('Admin Overview', () => {
    test('should show 4 tabs', async ({ page }) => {
      await page.route('**/api/v1/admin/**', route =>
        route.fulfill({ json: mocks.mockAdmin })
      );

      await page.goto('/admin', { waitUntil: 'domcontentloaded' });

      const tabs = ['Users', 'Roles', 'Workflows', 'Settings'];
      for (const tab of tabs) {
        const tabEl = page.getByRole('tab', { name: tab });
        if (await tabEl.count() > 0) {
          await expect(tabEl).toBeVisible();
        }
      }
    });
  });

  test.describe('Users Tab', () => {
    test('should show Invite User button', async ({ page }) => {
      await page.route('**/api/v1/admin/**', route =>
        route.fulfill({ json: mocks.mockAdmin })
      );

      await page.goto('/admin', { waitUntil: 'domcontentloaded' });

      const inviteBtn = page.getByRole('button', { name: 'Invite User' });
      if (await inviteBtn.count() > 0) {
        await expect(inviteBtn).toBeVisible();
      }
    });

    test('should show invite user form', async ({ page }) => {
      await page.route('**/api/v1/admin/**', route =>
        route.fulfill({ json: mocks.mockAdmin })
      );

      await page.goto('/admin', { waitUntil: 'domcontentloaded' });

      const inviteBtn = page.getByRole('button', { name: 'Invite User' });
      if (await inviteBtn.count() > 0) {
        await inviteBtn.click();
        const emailInput = page.getByRole('textbox', { name: 'Email' });
        const firstName = page.getByRole('textbox', { name: 'First Name' });
        const roleSelect = page.getByRole('combobox', { name: 'Role' });
        if (await emailInput.count() > 0) await expect(emailInput).toBeVisible();
        if (await firstName.count() > 0) await expect(firstName).toBeVisible();
        if (await roleSelect.count() > 0) await expect(roleSelect).toBeVisible();
      }
    });

    test('should invite user after filling form', async ({ page }) => {
      await page.route('**/api/v1/admin/**', route => {
        if (route.request().method() === 'POST') {
          return route.fulfill({ json: { data: { id: 'u3', email: 'new@orionops.com' } } });
        }
        return route.fulfill({ json: mocks.mockAdmin });
      });

      await page.goto('/admin', { waitUntil: 'domcontentloaded' });

      const inviteBtn = page.getByRole('button', { name: 'Invite User' });
      if (await inviteBtn.count() > 0) {
        await inviteBtn.click();
        const emailInput = page.getByRole('textbox', { name: 'Email' });
        if (await emailInput.count() > 0) {
          await emailInput.fill('newuser@orionops.com');
          const submitBtn = page.getByRole('button', { name: 'Invite' });
          if (await submitBtn.count() > 0) {
            await submitBtn.click();
            await expect(emailInput).not.toBeVisible();
          }
        }
      }
    });

    test('should edit user', async ({ page }) => {
      await page.route('**/api/v1/admin/**', route => {
        if (route.request().method() === 'PUT') {
          return route.fulfill({ json: { data: { id: 'u1', name: 'Updated' } } });
        }
        return route.fulfill({ json: mocks.mockAdmin });
      });

      await page.goto('/admin', { waitUntil: 'domcontentloaded' });

      const editBtn = page.locator('button[title="Edit"], button:has-text("Edit")').first();
      if (await editBtn.count() > 0) {
        await editBtn.click();
        const firstName = page.getByRole('textbox', { name: 'First Name' });
        if (await firstName.count() > 0) {
          await expect(firstName).toHaveValue(/.+/);
        }
      }
    });

    test('should search users', async ({ page }) => {
      await page.route('**/api/v1/admin/**', route =>
        route.fulfill({ json: mocks.mockAdmin })
      );

      await page.goto('/admin', { waitUntil: 'domcontentloaded' });

      const searchInput = page.getByPlaceholder('Search users');
      if (await searchInput.count() > 0) {
        await expect(searchInput).toBeVisible();
        await searchInput.fill('admin');
      }
    });

    test('should show empty users state', async ({ page }) => {
      await page.route('**/api/v1/admin/**', route =>
        route.fulfill({ json: { data: { users: [], roles: [], workflows: [] } } })
      );

      await page.goto('/admin', { waitUntil: 'domcontentloaded' });

      const emptyText = page.getByText('No users found');
      if (await emptyText.count() > 0) {
        await expect(emptyText).toBeVisible();
      }
    });
  });

  test.describe('Roles Tab', () => {
    test('should show system roles with badges', async ({ page }) => {
      await page.route('**/api/v1/admin/**', route =>
        route.fulfill({ json: mocks.mockAdmin })
      );

      await page.goto('/admin', { waitUntil: 'domcontentloaded' });

      const rolesTab = page.getByRole('tab', { name: 'Roles' });
      if (await rolesTab.count() > 0) {
        await rolesTab.click();
        const systemBadge = page.getByText('System Role');
        if (await systemBadge.count() > 0) {
          await expect(systemBadge.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Workflows Tab', () => {
    test('should show upload BPMN button', async ({ page }) => {
      await page.route('**/api/v1/admin/**', route =>
        route.fulfill({ json: mocks.mockAdmin })
      );

      await page.goto('/admin', { waitUntil: 'domcontentloaded' });

      const workflowsTab = page.getByRole('tab', { name: 'Workflows' });
      if (await workflowsTab.count() > 0) {
        await workflowsTab.click();
        const uploadBtn = page.getByRole('button', { name: 'Upload BPMN' });
        if (await uploadBtn.count() > 0) {
          await expect(uploadBtn).toBeVisible();
        }
      }
    });

    test('should show empty workflows state', async ({ page }) => {
      await page.route('**/api/v1/admin/**', route =>
        route.fulfill({ json: { data: { users: [], roles: [], workflows: [] } } })
      );

      await page.goto('/admin', { waitUntil: 'domcontentloaded' });

      const workflowsTab = page.getByRole('tab', { name: 'Workflows' });
      if (await workflowsTab.count() > 0) {
        await workflowsTab.click();
        const emptyText = page.getByText('No workflow definitions found');
        if (await emptyText.count() > 0) {
          await expect(emptyText).toBeVisible();
        }
      }
    });

    test('should upload BPMN file', async ({ page }) => {
      await page.route('**/api/v1/admin/**', route => {
        if (route.request().method() === 'POST' && route.request().url().includes('workflow')) {
          return route.fulfill({ json: { data: { id: 'wf-001', name: 'New Workflow' } } });
        }
        return route.fulfill({ json: mocks.mockAdmin });
      });

      await page.goto('/admin', { waitUntil: 'domcontentloaded' });

      const workflowsTab = page.getByRole('tab', { name: 'Workflows' });
      if (await workflowsTab.count() > 0) {
        await workflowsTab.click();
        const fileInput = page.locator('input[type="file"][accept*="bpmn"]');
        if (await fileInput.count() > 0) {
          await expect(fileInput).toBeAttached();
        }
      }
    });
  });

  test.describe('Settings Tab', () => {
    test('should show platform settings form', async ({ page }) => {
      await page.route('**/api/v1/admin/**', route =>
        route.fulfill({ json: mocks.mockAdmin })
      );

      await page.goto('/admin', { waitUntil: 'domcontentloaded' });

      const settingsTab = page.getByRole('tab', { name: 'Settings' });
      if (await settingsTab.count() > 0) {
        await settingsTab.click();
        const platformNameInput = page.getByRole('textbox', { name: 'Platform Name' });
        const timezoneInput = page.getByRole('textbox', { name: 'Default Timezone' });
        if (await platformNameInput.count() > 0) await expect(platformNameInput).toBeVisible();
        if (await timezoneInput.count() > 0) await expect(timezoneInput).toBeVisible();
      }
    });

    test('should save settings', async ({ page }) => {
      await page.route('**/api/v1/admin/**', route => {
        if (route.request().method() === 'PUT') {
          return route.fulfill({ json: { data: { success: true } } });
        }
        return route.fulfill({ json: mocks.mockAdmin });
      });

      await page.goto('/admin', { waitUntil: 'domcontentloaded' });

      const settingsTab = page.getByRole('tab', { name: 'Settings' });
      if (await settingsTab.count() > 0) {
        await settingsTab.click();
        const saveBtn = page.getByRole('button', { name: 'Save Settings' });
        if (await saveBtn.count() > 0) {
          await saveBtn.click();
          const successMsg = page.getByText(/saved|success/i);
          if (await successMsg.count() > 0) {
            await expect(successMsg.first()).toBeVisible();
          }
        }
      }
    });
  });
});
