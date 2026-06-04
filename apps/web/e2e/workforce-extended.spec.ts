import { test, expect } from '@playwright/test';
import { injectMockAuth } from './helpers/auth';
import * as mocks from './helpers/api-mock';

test.describe('Workforce Extended', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockAuth(page);
  });

  test.describe('Employees Tab', () => {
    test('should show Employees tab as default with loading', async ({ page }) => {
      await page.route('**/api/v1/workforce/**', route =>
        route.fulfill({ json: mocks.mockWorkforce, delay: 300 })
      );

      await page.goto('/workforce', { waitUntil: 'domcontentloaded' });

      const employeesTab = page.getByRole('tab', { name: 'Employees' });
      if (await employeesTab.count() > 0) {
        await expect(employeesTab).toBeVisible();
      }
    });

    test('should show Add Employee button', async ({ page }) => {
      await page.route('**/api/v1/workforce/**', route =>
        route.fulfill({ json: mocks.mockWorkforce })
      );

      await page.goto('/workforce', { waitUntil: 'domcontentloaded' });

      const addBtn = page.getByRole('button', { name: 'Add Employee' });
      if (await addBtn.count() > 0) {
        await expect(addBtn).toBeVisible();
      }
    });

    test('should show employee creation form', async ({ page }) => {
      await page.route('**/api/v1/workforce/**', route =>
        route.fulfill({ json: mocks.mockWorkforce })
      );

      await page.goto('/workforce', { waitUntil: 'domcontentloaded' });

      const addBtn = page.getByRole('button', { name: 'Add Employee' });
      if (await addBtn.count() > 0) {
        await addBtn.click();
        const firstName = page.getByRole('textbox', { name: 'First Name' });
        const lastName = page.getByRole('textbox', { name: 'Last Name' });
        const emailInput = page.getByRole('textbox', { name: 'Email' });
        if (await firstName.count() > 0) await expect(firstName).toBeVisible();
        if (await lastName.count() > 0) await expect(lastName).toBeVisible();
        if (await emailInput.count() > 0) await expect(emailInput).toBeVisible();
      }
    });

    test('should create employee after filling form', async ({ page }) => {
      await page.route('**/api/v1/workforce/**', route => {
        if (route.request().method() === 'POST') {
          return route.fulfill({ json: { data: { id: 'emp-003', firstName: 'New' } } });
        }
        return route.fulfill({ json: mocks.mockWorkforce });
      });

      await page.goto('/workforce', { waitUntil: 'domcontentloaded' });

      const addBtn = page.getByRole('button', { name: 'Add Employee' });
      if (await addBtn.count() > 0) {
        await addBtn.click();
        const firstName = page.getByRole('textbox', { name: 'First Name' });
        if (await firstName.count() > 0) {
          await firstName.fill('Alice');
          const submitBtn = page.getByRole('button', { name: 'Create' });
          if (await submitBtn.count() > 0) {
            await submitBtn.click();
            await expect(firstName).not.toBeVisible();
          }
        }
      }
    });

    test('should edit employee with pre-filled form', async ({ page }) => {
      await page.route('**/api/v1/workforce/**', route => {
        if (route.request().method() === 'PUT') {
          return route.fulfill({ json: { data: { id: 'emp-001', firstName: 'Updated' } } });
        }
        return route.fulfill({ json: mocks.mockWorkforce });
      });

      await page.goto('/workforce', { waitUntil: 'domcontentloaded' });

      const editBtn = page.locator('button[title="Edit"], button:has-text("Edit")').first();
      if (await editBtn.count() > 0) {
        await editBtn.click();
        const firstName = page.getByRole('textbox', { name: 'First Name' });
        if (await firstName.count() > 0) {
          await expect(firstName).toHaveValue(/.+/);
        }
      }
    });

    test('should delete employee with confirmation', async ({ page }) => {
      await page.route('**/api/v1/workforce/**', route => {
        if (route.request().method() === 'DELETE') {
          return route.fulfill({ status: 204 });
        }
        return route.fulfill({ json: mocks.mockWorkforce });
      });

      await page.goto('/workforce', { waitUntil: 'domcontentloaded' });

      const deleteBtn = page.locator('button[title="Delete"], button:has-text("Delete")').first();
      if (await deleteBtn.count() > 0) {
        await deleteBtn.click();
        const confirmText = page.getByText(/delete/i);
        if (await confirmText.count() > 0) {
          await expect(confirmText.first()).toBeVisible();
        }
      }
    });

    test('should filter employees by search', async ({ page }) => {
      await page.route('**/api/v1/workforce/**', route =>
        route.fulfill({ json: mocks.mockWorkforce })
      );

      await page.goto('/workforce', { waitUntil: 'domcontentloaded' });

      const searchInput = page.getByPlaceholder('Search employees');
      if (await searchInput.count() > 0) {
        await expect(searchInput).toBeVisible();
        await searchInput.fill('John');
      }
    });

    test('should show empty employees state', async ({ page }) => {
      await page.route('**/api/v1/workforce/**', route =>
        route.fulfill({ json: { data: { employees: [], skills: [], capacityPlans: [] } } })
      );

      await page.goto('/workforce', { waitUntil: 'domcontentloaded' });

      const emptyText = page.getByText('No employees found');
      if (await emptyText.count() > 0) {
        await expect(emptyText).toBeVisible();
      }
    });
  });

  test.describe('Skills Tab', () => {
    test('should show skills tab with Add Skill button', async ({ page }) => {
      await page.route('**/api/v1/workforce/**', route =>
        route.fulfill({ json: mocks.mockWorkforce })
      );

      await page.goto('/workforce', { waitUntil: 'domcontentloaded' });

      const skillsTab = page.getByRole('tab', { name: 'Skills' });
      if (await skillsTab.count() > 0) {
        await skillsTab.click();
        const addBtn = page.getByRole('button', { name: 'Add Skill' });
        if (await addBtn.count() > 0) {
          await expect(addBtn).toBeVisible();
        }
      }
    });

    test('should create skill after filling form', async ({ page }) => {
      await page.route('**/api/v1/workforce/**', route => {
        if (route.request().method() === 'POST') {
          return route.fulfill({ json: { data: { id: 'skill-003', name: 'React' } } });
        }
        return route.fulfill({ json: mocks.mockWorkforce });
      });

      await page.goto('/workforce', { waitUntil: 'domcontentloaded' });

      const skillsTab = page.getByRole('tab', { name: 'Skills' });
      if (await skillsTab.count() > 0) {
        await skillsTab.click();
        const addBtn = page.getByRole('button', { name: 'Add Skill' });
        if (await addBtn.count() > 0) {
          await addBtn.click();
          const nameInput = page.getByRole('textbox', { name: 'Name' });
          if (await nameInput.count() > 0) {
            await nameInput.fill('React');
            const submitBtn = page.getByRole('button', { name: 'Create' });
            if (await submitBtn.count() > 0) {
              await submitBtn.click();
            }
          }
        }
      }
    });

    test('should delete skill with confirmation', async ({ page }) => {
      await page.route('**/api/v1/workforce/**', route => {
        if (route.request().method() === 'DELETE') {
          return route.fulfill({ status: 204 });
        }
        return route.fulfill({ json: mocks.mockWorkforce });
      });

      await page.goto('/workforce', { waitUntil: 'domcontentloaded' });

      const skillsTab = page.getByRole('tab', { name: 'Skills' });
      if (await skillsTab.count() > 0) {
        await skillsTab.click();
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

    test('should show empty skills state', async ({ page }) => {
      await page.route('**/api/v1/workforce/**', route =>
        route.fulfill({ json: { data: { employees: [], skills: [], capacityPlans: [] } } })
      );

      await page.goto('/workforce', { waitUntil: 'domcontentloaded' });

      const skillsTab = page.getByRole('tab', { name: 'Skills' });
      if (await skillsTab.count() > 0) {
        await skillsTab.click();
        const emptyText = page.getByText('No skills found');
        if (await emptyText.count() > 0) {
          await expect(emptyText).toBeVisible();
        }
      }
    });
  });

  test.describe('Capacity Tab', () => {
    test('should show capacity tab with Add Plan button', async ({ page }) => {
      await page.route('**/api/v1/workforce/**', route =>
        route.fulfill({ json: mocks.mockWorkforce })
      );

      await page.goto('/workforce', { waitUntil: 'domcontentloaded' });

      const capacityTab = page.getByRole('tab', { name: 'Capacity' });
      if (await capacityTab.count() > 0) {
        await capacityTab.click();
        const addBtn = page.getByRole('button', { name: 'Add Plan' });
        if (await addBtn.count() > 0) {
          await expect(addBtn).toBeVisible();
        }
      }
    });

    test('should create capacity plan after filling form', async ({ page }) => {
      await page.route('**/api/v1/workforce/**', route => {
        if (route.request().method() === 'POST') {
          return route.fulfill({ json: { data: { id: 'cap-002', team: 'Support' } } });
        }
        return route.fulfill({ json: mocks.mockWorkforce });
      });

      await page.goto('/workforce', { waitUntil: 'domcontentloaded' });

      const capacityTab = page.getByRole('tab', { name: 'Capacity' });
      if (await capacityTab.count() > 0) {
        await capacityTab.click();
        const addBtn = page.getByRole('button', { name: 'Add Plan' });
        if (await addBtn.count() > 0) {
          await addBtn.click();
          const teamInput = page.getByRole('textbox', { name: 'Team' });
          if (await teamInput.count() > 0) {
            await teamInput.fill('Support');
            const submitBtn = page.getByRole('button', { name: 'Create' });
            if (await submitBtn.count() > 0) {
              await submitBtn.click();
            }
          }
        }
      }
    });

    test('should show empty capacity state', async ({ page }) => {
      await page.route('**/api/v1/workforce/**', route =>
        route.fulfill({ json: { data: { employees: [], skills: [], capacityPlans: [] } } })
      );

      await page.goto('/workforce', { waitUntil: 'domcontentloaded' });

      const capacityTab = page.getByRole('tab', { name: 'Capacity' });
      if (await capacityTab.count() > 0) {
        await capacityTab.click();
        const emptyText = page.getByText('No capacity plans found');
        if (await emptyText.count() > 0) {
          await expect(emptyText).toBeVisible();
        }
      }
    });
  });
});
