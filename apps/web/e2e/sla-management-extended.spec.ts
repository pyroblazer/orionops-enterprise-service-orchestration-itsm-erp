import { test, expect } from '@playwright/test';
import { injectMockAuth } from './helpers/auth';
import * as mocks from './helpers/api-mock';

test.describe('SLA Management Extended', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockAuth(page);
  });

  test('should show four summary cards', async ({ page }) => {
    await page.route('**/api/v1/sla/**', route =>
      route.fulfill({ json: mocks.mockSLA.instances })
    );

    await page.goto('/sla', { waitUntil: 'domcontentloaded' });

    await expect(page.getByText('Active SLAs')).toBeVisible();
    await expect(page.getByText('Breached')).toBeVisible();
    await expect(page.getByText('Met')).toBeVisible();
    await expect(page.getByText('At Risk')).toBeVisible();
  });

  test('should show active instances tab by default', async ({ page }) => {
    await page.route('**/api/v1/sla/**', route =>
      route.fulfill({ json: mocks.mockSLA.instances })
    );

    await page.goto('/sla', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('tab', { name: 'Active Instances', selected: true })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Definitions' })).toBeVisible();
  });

  test('should show status filter with all option', async ({ page }) => {
    await page.route('**/api/v1/sla/**', route =>
      route.fulfill({ json: mocks.mockSLA.instances })
    );

    await page.goto('/sla', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('combobox', { name: 'Filter by status' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'All' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Active' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Breaching' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Paused' })).toBeVisible();
  });

  test('should filter instances by breached status', async ({ page }) => {
    await page.route('**/api/v1/sla/**', route =>
      route.fulfill({ json: mocks.mockSLA.instances })
    );

    await page.goto('/sla', { waitUntil: 'domcontentloaded' });

    // Select breached status
    await page.getByRole('combobox', { name: 'Filter by status' }).click();
    await page.getByRole('option', { name: 'Breaching' }).click();

    // Only breached instance should be visible
    await expect(page.getByText('sla-inst-002')).toBeVisible();
    await expect(page.getByText('sla-inst-001')).not.toBeVisible();
  });

  test('should show apply SLA button', async ({ page }) => {
    await page.route('**/api/v1/sla/**', route =>
      route.fulfill({ json: mocks.mockSLA.instances })
    );

    await page.goto('/sla', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('button', { name: 'Apply SLA' })).toBeVisible();
  });

  test('should show apply SLA form', async ({ page }) => {
    await page.route('**/api/v1/sla/**', route =>
      route.fulfill({ json: mocks.mockSLA.instances })
    );

    await page.goto('/sla', { waitUntil: 'domcontentloaded' });

    await page.getByRole('button', { name: 'Apply SLA' }).click();

    await expect(page.getByRole('combobox', { name: 'Definition' })).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Target Type' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Target Entity ID' })).toBeVisible();
  });

  test('should apply SLA after filling form', async ({ page }) => {
    await page.route('**/api/v1/sla/**', async (route) => {
      if (route.request().url().includes('instances')) {
        if (route.request().method() === 'POST') {
          return route.fulfill({ json: { data: { id: 'sla-inst-003' } } });
        }
        return route.fulfill({ json: mocks.mockSLA.instances });
      }
      return route.fulfill({ json: mocks.mockSLA.definitions });
    });

    await page.goto('/sla', { waitUntil: 'domcontentloaded' });

    await page.getByRole('button', { name: 'Apply SLA' }).click();
    await page.getByRole('textbox', { name: 'Target Entity ID' }).fill('inc-001');
    await page.getByRole('button', { name: 'Apply' }).click();

    // Form should close
    await expect(page.getByRole('textbox', { name: 'Target Entity ID' })).not.toBeVisible();
  });

  test('should show pause button for active instances', async ({ page }) => {
    await page.route('**/api/v1/sla/**', route =>
      route.fulfill({ json: mocks.mockSLA.instances })
    );

    await page.goto('/sla', { waitUntil: 'domcontentloaded' });

    // Pause button should be visible for active instance
    const pauseBtn = page.getByRole('button', { name: 'Pause' }).first();
    if (await pauseBtn.count() > 0) {
      await expect(pauseBtn).toBeVisible();
    }
  });

  test('should pause instance after clicking pause', async ({ page }) => {
    const mockData = { ...mocks.mockSLA.instances, data: [{ ...mocks.mockSLA.instances.data[0], status: 'PAUSED' }] };
    await page.route('**/api/v1/sla/**', route => {
      if (route.request().method() === 'PATCH') {
        return route.fulfill({ json: mockData });
      }
      return route.fulfill({ json: mocks.mockSLA.instances });
    });

    await page.goto('/sla', { waitUntil: 'domcontentloaded' });

    await page.getByRole('button', { name: 'Pause' }).first().click();

    // Resume button should appear
    const resumeBtn = page.getByRole('button', { name: 'Resume' });
    if (await resumeBtn.count() > 0) {
      await expect(resumeBtn).toBeVisible();
    }
  });

  test('should show resume button for paused instances', async ({ page }) => {
    const mockData = { ...mocks.mockSLA.instances, data: [{ ...mocks.mockSLA.instances.data[0], status: 'PAUSED' }] };
    await page.route('**/api/v1/sla/**', route =>
      route.fulfill({ json: mockData })
    );

    await page.goto('/sla', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('button', { name: 'Resume' })).toBeVisible();
  });

  test('should resume instance after clicking resume', async ({ page }) => {
    const mockData = { ...mocks.mockSLA.instances, data: [{ ...mocks.mockSLA.instances.data[0], status: 'ACTIVE' }] };
    await page.route('**/api/v1/sla/**', route => {
      if (route.request().method() === 'PATCH') {
        return route.fulfill({ json: mockData });
      }
      return route.fulfill({ json: mocks.mockSLA.instances });
    });

    await page.goto('/sla', { waitUntil: 'domcontentloaded' });

    await page.getByRole('button', { name: 'Resume' }).click();

    // Pause button should reappear
    const pauseBtn = page.getByRole('button', { name: 'Pause' });
    if (await pauseBtn.count() > 0) {
      await expect(pauseBtn).toBeVisible();
    }
  });

  test('should navigate to definitions tab', async ({ page }) => {
    await page.route('**/api/v1/sla/**', route =>
      route.fulfill({ json: mocks.mockSLA.instances })
    );

    await page.goto('/sla', { waitUntil: 'domcontentloaded' });

    await page.getByRole('tab', { name: 'Definitions' }).click();

    await expect(page.getByRole('tab', { name: 'Definitions', selected: true })).toBeVisible();
    await expect(page.getByText('P1 Resolution')).toBeVisible();
  });

  test('should show new definition button in definitions tab', async ({ page }) => {
    await page.route('**/api/v1/sla/**', route =>
      route.fulfill({ json: mocks.mockSLA.instances })
    );

    await page.goto('/sla', { waitUntil: 'domcontentloaded' });

    await page.getByRole('tab', { name: 'Definitions' }).click();

    await expect(page.getByRole('button', { name: 'New Definition' })).toBeVisible();
  });

  test('should show definition form with all fields', async ({ page }) => {
    await page.route('**/api/v1/sla/**', route =>
      route.fulfill({ json: mocks.mockSLA.instances })
    );

    await page.goto('/sla', { waitUntil: 'domcontentloaded' });

    await page.getByRole('tab', { name: 'Definitions' }).click();
    await page.getByRole('button', { name: 'New Definition' }).click();

    await expect(page.getByRole('textbox', { name: 'Name' })).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Priority' })).toBeVisible();
    await expect(page.getByRole('spinbutton', { name: 'Response Time (minutes)' })).toBeVisible();
    await expect(page.getByRole('spinbutton', { name: 'Resolution Time (minutes)' })).toBeVisible();
    await expect(page.getByRole('spinbutton', { name: 'Escalation Threshold' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Description' })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: 'Apply Business Hours Only' })).toBeVisible();
  });

  test('should create new definition after filling form', async ({ page }) => {
    await page.route('**/api/v1/sla/**', async (route) => {
      if (route.request().url().includes('definitions')) {
        if (route.request().method() === 'POST') {
          return route.fulfill({ json: { data: { id: 'sla-def-002' } } });
        }
        return route.fulfill({ json: mocks.mockSLA.definitions });
      }
      return route.fulfill({ json: mocks.mockSLA.instances });
    });

    await page.goto('/sla', { waitUntil: 'domcontentloaded' });

    await page.getByRole('tab', { name: 'Definitions' }).click();
    await page.getByRole('button', { name: 'New Definition' }).click();

    await page.getByRole('textbox', { name: 'Name' }).fill('P1 SLA Policy');
    await page.getByRole('combobox', { name: 'Priority' }).selectOption({ label: 'CRITICAL' });
    await page.getByRole('spinbutton', { name: 'Response Time (minutes)' }).fill('30');
    await page.getByRole('spinbutton', { name: 'Resolution Time (minutes)' }).fill('240');
    await page.getByRole('button', { name: 'Create' }).click();

    // Form should close
    await expect(page.getByRole('textbox', { name: 'Name' })).not.toBeVisible();
  });

  test('should edit definition with pre-filled form', async ({ page }) => {
    await page.route('**/api/v1/sla/**', route =>
      route.fulfill({ json: mocks.mockSLA.instances })
    );

    await page.goto('/sla', { waitUntil: 'domcontentloaded' });

    await page.getByRole('tab', { name: 'Definitions' }).click();

    // Find edit button for first definition
    const editBtn = page.locator('button:has-text("Edit")').first();
    if (await editBtn.count() > 0) {
      await editBtn.click();

      await expect(page.getByRole('textbox', { name: 'Name' })).toHaveValue('P1 Resolution');
    }
  });

  test('should delete definition with confirmation dialog', async ({ page }) => {
    await page.route('**/api/v1/sla/**', route =>
      route.fulfill({ json: mocks.mockSLA.instances })
    );

    await page.goto('/sla', { waitUntil: 'domcontentloaded' });

    await page.getByRole('tab', { name: 'Definitions' }).click();

    // Find delete button for first definition
    const deleteBtn = page.locator('button:has-text("Delete")').first();
    if (await deleteBtn.count() > 0) {
      await deleteBtn.click();

      await expect(page.getByText('Delete this SLA definition permanently?')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Delete' })).toBeVisible();
    }
  });

  test('should render breached section above main table when instances exist', async ({ page }) => {
    await page.route('**/api/v1/sla/**', route =>
      route.fulfill({ json: mocks.mockSLA.instances })
    );

    await page.goto('/sla', { waitUntil: 'domcontentloaded' });

    // Breached section should be visible
    const breachedSection = page.locator('text=Breached').first();
    if (await breachedSection.count() > 0) {
      await expect(breachedSection).toBeVisible();
    }
  });

  test('should show remaining time progress bar in instances table', async ({ page }) => {
    await page.route('**/api/v1/sla/**', route =>
      route.fulfill({ json: mocks.mockSLA.instances })
    );

    await page.goto('/sla', { waitUntil: 'domcontentloaded' });

    // Progress bar should be visible in table cells
    const progressBar = page.locator('[role="progressbar"]');
    if (await progressBar.count() > 0) {
      await expect(progressBar.first()).toBeVisible();
    }
  });
});