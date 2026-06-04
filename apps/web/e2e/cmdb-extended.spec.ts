import { test, expect } from '@playwright/test';
import { injectMockAuth } from './helpers/auth';
import * as mocks from './helpers/api-mock';

test.describe('CMDB Extended', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockAuth(page);
  });

  test('should show CI name heading', async ({ page }) => {
    await page.route('**/api/v1/cmdb/ci/ci-001', route =>
      route.fulfill({ json: { data: mocks.mockCMDB.detail } })
    );

    await page.goto('/cmdb/ci-001', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { name: 'Production API Server' })).toBeVisible();
  });

  test('should show status badge', async ({ page }) => {
    await page.route('**/api/v1/cmdb/ci/ci-001', route =>
      route.fulfill({ json: { data: mocks.mockCMDB.detail } })
    );

    await page.goto('/cmdb/ci-001', { waitUntil: 'domcontentloaded' });

    await expect(page.getByText('OPERATIONAL')).toBeVisible();
  });

  test('should show attributes', async ({ page }) => {
    await page.route('**/api/v1/cmdb/ci/ci-001', route =>
      route.fulfill({ json: { data: mocks.mockCMDB.detail } })
    );

    await page.goto('/cmdb/ci-001', { waitUntil: 'domcontentloaded' });

    await expect(page.getByText('api-prod-01.orionops.local')).toBeVisible();
    await expect(page.getByText('10.0.1.100')).toBeVisible();
    await expect(page.getByText('Platform Team')).toBeVisible();
  });

  test('should show edit button', async ({ page }) => {
    await page.route('**/api/v1/cmdb/ci/ci-001', route =>
      route.fulfill({ json: { data: mocks.mockCMDB.detail } })
    );

    await page.goto('/cmdb/ci-001', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('button', { name: 'Edit' })).toBeVisible();
  });

  test('should show edit CI form with pre-filled fields', async ({ page }) => {
    await page.route('**/api/v1/cmdb/ci/ci-001', route =>
      route.fulfill({ json: { data: mocks.mockCMDB.detail } })
    );

    await page.goto('/cmdb/ci-001', { waitUntil: 'domcontentloaded' });

    await page.getByRole('button', { name: 'Edit' }).click();

    await expect(page.getByRole('textbox', { name: 'Name' })).toHaveValue('Production API Server');
    await expect(page.getByRole('combobox', { name: 'Status' })).toHaveValue('OPERATIONAL');
    await expect(page.getByRole('textbox', { name: 'Owner' })).toHaveValue('Platform Team');
    await expect(page.getByRole('textbox', { name: 'Description' })).toBeVisible();
  });

  test('should update CI after submitting edit form', async ({ page }) => {
    const updatedData = { ...mocks.mockCMDB.detail, name: 'Updated CI Name' };
    await page.route('**/api/v1/cmdb/ci/ci-001', route => {
      if (route.request().method() === 'PUT') {
        return route.fulfill({ json: { data: updatedData } });
      }
      return route.fulfill({ json: { data: mocks.mockCMDB.detail } });
    });

    await page.goto('/cmdb/ci-001', { waitUntil: 'domcontentloaded' });

    await page.getByRole('button', { name: 'Edit' }).click();
    await page.getByRole('textbox', { name: 'Name' }).fill('Updated CI Name');
    await page.getByRole('button', { name: 'Save' }).click();

    // Form should close and new name should be visible
    await expect(page.getByRole('textbox', { name: 'Name' })).not.toBeVisible();
    await expect(page.getByRole('heading', { name: 'Updated CI Name' })).toBeVisible();
  });

  test('should show add relationship button', async ({ page }) => {
    await page.route('**/api/v1/cmdb/ci/ci-001', route =>
      route.fulfill({ json: { data: mocks.mockCMDB.detail } })
    );

    await page.goto('/cmdb/ci-001', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('button', { name: 'Add Relationship' })).toBeVisible();
  });

  test('should show relationship form with fields', async ({ page }) => {
    await page.route('**/api/v1/cmdb/ci/ci-001', route =>
      route.fulfill({ json: { data: mocks.mockCMDB.detail } })
    );

    await page.goto('/cmdb/ci-001', { waitUntil: 'domcontentloaded' });

    await page.getByRole('button', { name: 'Add Relationship' }).click();

    await expect(page.getByRole('textbox', { name: 'Target CI ID' })).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Relationship Type' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Description' })).toBeVisible();
  });

  test('should show relationship types in select', async ({ page }) => {
    await page.route('**/api/v1/cmdb/ci/ci-001', route =>
      route.fulfill({ json: { data: mocks.mockCMDB.detail } })
    );

    await page.goto('/cmdb/ci-001', { waitUntil: 'domcontentloaded' });

    await page.getByRole('button', { name: 'Add Relationship' }).click();
    await page.getByRole('combobox', { name: 'Relationship Type' }).click();

    await expect(page.getByRole('option', { name: 'depends_on' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'hosts' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'connects_to' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'contains' })).toBeVisible();
  });

  test('should create relationship after filling form', async ({ page }) => {
    await page.route('**/api/v1/cmdb/ci/ci-001', async (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({ json: { data: { id: 'rel-001', targetCI: 'ci-002' } } });
      }
      return route.fulfill({ json: { data: mocks.mockCMDB.detail } });
    });

    await page.goto('/cmdb/ci-001', { waitUntil: 'domcontentloaded' });

    await page.getByRole('button', { name: 'Add Relationship' }).click();
    await page.getByRole('textbox', { name: 'Target CI ID' }).fill('ci-002');
    await page.getByRole('combobox', { name: 'Relationship Type' }).selectOption('hosts');
    await page.getByRole('button', { name: 'Create' }).click();

    // Form should close
    await expect(page.getByRole('textbox', { name: 'Target CI ID' })).not.toBeVisible();
  });

  test('should show relationships tab with related CI cards', async ({ page }) => {
    await page.route('**/api/v1/cmdb/ci/ci-001', route =>
      route.fulfill({ json: { data: mocks.mockCMDB.detail } })
    );

    await page.goto('/cmdb/ci-001', { waitUntil: 'domcontentloaded' });

    await page.getByRole('tab', { name: 'Relationships' }).click();

    await expect(page.getByText('No relationships defined. Add one above.')).toBeVisible();
  });

  test('should show related CI cards when relationships exist', async ({ page }) => {
    const mockData = {
      ...mocks.mockCMDB.detail,
      relationships: [{ id: 'rel-001', targetCI: { id: 'ci-002', name: 'Database Server', type: 'DATABASE' } }]
    };
    await page.route('**/api/v1/cmdb/ci/ci-001', route =>
      route.fulfill({ json: { data: mockData } })
    );

    await page.goto('/cmdb/ci-001', { waitUntil: 'domcontentloaded' });

    await page.getByRole('tab', { name: 'Relationships' }).click();

    await expect(page.getByText('Database Server')).toBeVisible();
    await expect(page.getByText('DATABASE')).toBeVisible();
  });

  test('should show impact analysis tab', async ({ page }) => {
    await page.route('**/api/v1/cmdb/ci/ci-001', route =>
      route.fulfill({ json: { data: mocks.mockCMDB.detail } })
    );

    await page.goto('/cmdb/ci-001', { waitUntil: 'domcontentloaded' });

    await page.getByRole('tab', { name: 'Impact Analysis' }).click();

    await expect(page.getByText('Loading impact analysis')).toBeVisible();
  });

  test('should show downstream dependencies when available', async ({ page }) => {
    const mockData = {
      ...mocks.mockCMDB.detail,
      impactAnalysis: {
        downstream: [{ id: 'customer-portal', name: 'Customer Portal', impact: 'HIGH' }]
      }
    };
    await page.route('**/api/v1/cmdb/ci/ci-001', route =>
      route.fulfill({ json: { data: mockData } })
    );

    await page.goto('/cmdb/ci-001', { waitUntil: 'domcontentloaded' });

    await page.getByRole('tab', { name: 'Impact Analysis' }).click();

    await expect(page.getByText('Customer Portal')).toBeVisible();
    await expect(page.getByText('HIGH')).toBeVisible();
  });

  test('should show no dependencies message when none exist', async ({ page }) => {
    const mockData = {
      ...mocks.mockCMDB.detail,
      impactAnalysis: { downstream: [] }
    };
    await page.route('**/api/v1/cmdb/ci/ci-001', route =>
      route.fulfill({ json: { data: mockData } })
    );

    await page.goto('/cmdb/ci-001', { waitUntil: 'domcontentloaded' });

    await page.getByRole('tab', { name: 'Impact Analysis' }).click();

    await expect(page.getByText('No downstream dependencies found.')).toBeVisible();
  });

  test('should show CI not found state', async ({ page }) => {
    await page.route('**/api/v1/cmdb/ci/ci-001', route =>
      route.fulfill({ json: { data: null } })
    );

    await page.goto('/cmdb/ci-001', { waitUntil: 'domcontentloaded' });

    await expect(page.getByText('Configuration item not found.')).toBeVisible();
  });
});