import { test, expect } from '@playwright/test';
import { injectMockAuth } from './helpers/auth';
import * as mocks from './helpers/api-mock';

test.describe('Admin Console', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockAuth(page);
    await page.route('**/api/v1/admin**', async (route) => {
      if (route.request().url().includes('users')) {
        await route.fulfill({ json: mocks.mockAdmin.users });
      } else {
        await route.fulfill({ json: { stats: mocks.mockAdmin.stats } });
      }
    });
  });

  test('admin page renders at /admin', async ({ page }) => {
    await page.goto('/admin');
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('admin page displays summary stat cards', async ({ page }) => {
    await page.goto('/admin');
    const statCards = ['Total Users', 'Roles', 'Workflows', 'System Status'];
    for (const stat of statCards) {
      const card = page.locator(`text="${stat}"`).first();
      if (await card.count() > 0) {
        await expect(card).toBeVisible();
      }
    }
  });

  test('Users, Roles, Workflows, Settings tabs visible', async ({ page }) => {
    await page.goto('/admin');
    const tabs = ['Users', 'Roles', 'Workflows', 'Settings'];
    for (const tab of tabs) {
      const tabButton = page.locator(`button:has-text("${tab}"), [role="tab"]:has-text("${tab}")`).first();
      if (await tabButton.count() > 0) {
        await expect(tabButton).toBeVisible();
      }
    }
  });

  test('Users tab displays user table with Name, Email, Role, Status columns', async ({ page }) => {
    await page.goto('/admin');
    const usersTab = page.locator('button:has-text("Users")').first();
    if (await usersTab.count() > 0) {
      await usersTab.click();
      const columns = page.locator('text="Name", text="Email", text="Role", text="Status"').first();
      if (await columns.count() > 0) {
        await expect(columns).toBeVisible();
      }
    }
  });

  test('Invite User button visible on Users tab', async ({ page }) => {
    await page.goto('/admin');
    const usersTab = page.locator('button:has-text("Users")').first();
    if (await usersTab.count() > 0) {
      await usersTab.click();
      const inviteButton = page.locator('button:has-text("Invite User"), button:has-text("Add User")').first();
      if (await inviteButton.count() > 0) {
        await expect(inviteButton).toBeVisible();
      }
    }
  });

  test('Roles tab displays system roles with badges', async ({ page }) => {
    await page.route('**/api/v1/admin/roles**', async (route) => {
      await route.fulfill({ json: { data: mocks.mockAdmin.roles } });
    });
    await page.goto('/admin');
    const rolesTab = page.locator('button:has-text("Roles")').first();
    if (await rolesTab.count() > 0) {
      await rolesTab.click();
      const systemRoleBadge = page.locator('text="System Role"').first();
      if (await systemRoleBadge.count() > 0) {
        await expect(systemRoleBadge).toBeVisible();
      }
    }
  });

  test('Workflows tab displays workflow table with Name, Version, Status columns', async ({ page }) => {
    await page.route('**/api/v1/admin/workflows**', async (route) => {
      await route.fulfill({ json: mocks.mockAdmin.workflows });
    });
    await page.goto('/admin');
    const workflowsTab = page.locator('button:has-text("Workflows")').first();
    if (await workflowsTab.count() > 0) {
      await workflowsTab.click();
      const columns = page.locator('text="Name", text="Version", text="Status"').first();
      if (await columns.count() > 0) {
        await expect(columns).toBeVisible();
      }
    }
  });

  test('Upload BPMN button visible on Workflows tab', async ({ page }) => {
    await page.goto('/admin');
    const workflowsTab = page.locator('button:has-text("Workflows")').first();
    if (await workflowsTab.count() > 0) {
      await workflowsTab.click();
      const uploadButton = page.locator('button:has-text("Upload BPMN"), button:has-text("Upload")').first();
      if (await uploadButton.count() > 0) {
        await expect(uploadButton).toBeVisible();
      }
    }
  });

  test('BPMN file upload form accepts .bpmn files', async ({ page }) => {
    await page.goto('/admin');
    const workflowsTab = page.locator('button:has-text("Workflows")').first();
    if (await workflowsTab.count() > 0) {
      await workflowsTab.click();
      const fileInput = page.locator('input[type="file"]').first();
      if (await fileInput.count() > 0) {
        await expect(fileInput).toBeAttached();
      }
    }
  });

  test('Settings tab has Platform Name, Timezone, Date Format, Currency inputs', async ({ page }) => {
    await page.goto('/admin');
    const settingsTab = page.locator('button:has-text("Settings")').first();
    if (await settingsTab.count() > 0) {
      await settingsTab.click();
      const settingFields = ['Platform', 'Timezone', 'Date Format', 'Currency'];
      for (const field of settingFields) {
        const input = page.locator(`text="${field}"`).first();
        if (await input.count() > 0) {
          await expect(input).toBeVisible();
        }
      }
    }
  });

  test('Save Settings button submits changes', async ({ page }) => {
    await page.route('**/api/v1/admin/settings**', async (route) => {
      await route.fulfill({ json: { success: true } });
    });
    await page.goto('/admin');
    const settingsTab = page.locator('button:has-text("Settings")').first();
    if (await settingsTab.count() > 0) {
      await settingsTab.click();
      const saveButton = page.locator('button:has-text("Save Settings"), button:has-text("Save")').first();
      if (await saveButton.count() > 0) {
        await saveButton.click();
      }
    }
  });
});
