import { test, expect } from '@playwright/test';
import { injectMockAuth } from './helpers/auth';
import * as mocks from './helpers/api-mock';

test.describe('Problem Lifecycle Extended', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockAuth(page);
  });

  test('should show "Start Investigation" button when status is open', async ({ page }) => {
    const mockData = { ...mocks.mockProblems.detail, status: 'open' };
    await page.route('**/api/v1/problems/prob-001', route =>
      route.fulfill({ json: { data: mockData } })
    );

    await page.goto('/problems/prob-001', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('button', { name: 'Start Investigation' })).toBeVisible();
  });

  test('should update status to under_investigation after clicking "Start Investigation"', async ({ page }) => {
    const mockData = { ...mocks.mockProblems.detail, status: 'open' };
    await page.route('**/api/v1/problems/prob-001', route => {
      if (route.request().method() === 'PATCH') {
        return route.fulfill({ json: { data: { ...mockData, status: 'under_investigation' } } });
      }
      return route.fulfill({ json: { data: mockData } });
    });

    await page.goto('/problems/prob-001', { waitUntil: 'domcontentloaded' });

    await page.getByRole('button', { name: 'Start Investigation' }).click();

    await expect(page.getByRole('button', { name: 'Set Root Cause' })).toBeVisible();
  });

  test('should update status to root_cause_identified after clicking "Set Root Cause"', async ({ page }) => {
    const mockData = { ...mocks.mockProblems.detail, status: 'under_investigation' };
    await page.route('**/api/v1/problems/prob-001', route => {
      if (route.request().method() === 'PATCH') {
        return route.fulfill({ json: { data: { ...mockData, status: 'root_cause_identified' } } });
      }
      return route.fulfill({ json: { data: mockData } });
    });

    await page.goto('/problems/prob-001', { waitUntil: 'domcontentloaded' });

    // First start investigation
    await page.getByRole('button', { name: 'Start Investigation' }).click();

    // Then set root cause
    await page.getByRole('button', { name: 'Set Root Cause' }).click();

    await expect(page.getByRole('button', { name: 'Mark Resolved' })).toBeVisible();
  });

  test('should update status to resolved after clicking "Mark Resolved"', async ({ page }) => {
    const mockData = { ...mocks.mockProblems.detail, status: 'root_cause_identified' };
    await page.route('**/api/v1/problems/prob-001', route => {
      if (route.request().method() === 'PATCH') {
        return route.fulfill({ json: { data: { ...mockData, status: 'resolved' } } });
      }
      return route.fulfill({ json: { data: mockData } });
    });

    await page.goto('/problems/prob-001', { waitUntil: 'domcontentloaded' });

    // Start investigation
    await page.getByRole('button', { name: 'Start Investigation' }).click();
    // Set root cause
    await page.getByRole('button', { name: 'Set Root Cause' }).click();

    // Mark resolved
    await page.getByRole('button', { name: 'Mark Resolved' }).click();

    await expect(page.getByRole('button', { name: 'Close' })).toBeVisible();
  });

  test('should update status to closed after clicking "Close"', async ({ page }) => {
    const mockData = { ...mocks.mockProblems.detail, status: 'resolved' };
    await page.route('**/api/v1/problems/prob-001', route => {
      if (route.request().method() === 'PATCH') {
        return route.fulfill({ json: { data: { ...mockData, status: 'closed' } } });
      }
      return route.fulfill({ json: { data: mockData } });
    });

    await page.goto('/problems/prob-001', { waitUntil: 'domcontentloaded' });

    // Make problem resolvable
    await page.getByRole('button', { name: 'Start Investigation' }).click();
    await page.getByRole('button', { name: 'Set Root Cause' }).click();
    await page.getByRole('button', { name: 'Mark Resolved' }).click();

    // Close problem
    await page.getByRole('button', { name: 'Close' }).click();

    // No transition buttons should be visible
    await expect(page.getByRole('button', { name: 'Start Investigation' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Set Root Cause' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Mark Resolved' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Close' })).not.toBeVisible();
  });

  test('should show edit form with pre-filled fields', async ({ page }) => {
    const mockData = { ...mocks.mockProblems.detail, status: 'open' };
    await page.route('**/api/v1/problems/prob-001', route =>
      route.fulfill({ json: { data: mockData } })
    );

    await page.goto('/problems/prob-001', { waitUntil: 'domcontentloaded' });

    await page.getByRole('button', { name: 'Edit' }).click();

    await expect(page.getByRole('textbox', { name: 'Title' })).toHaveValue('Memory Leak in API Service');
    await expect(page.getByRole('textbox', { name: 'Description' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Workaround' })).toBeVisible();
  });

  test('should update problem after submitting edit form', async ({ page }) => {
    const mockData = { ...mocks.mockProblems.detail, status: 'open' };
    await page.route('**/api/v1/problems/prob-001', route => {
      if (route.request().method() === 'PUT') {
        return route.fulfill({ json: { data: { ...mockData, title: 'Updated Problem Title' } } });
      }
      return route.fulfill({ json: { data: mockData } });
    });

    await page.goto('/problems/prob-001', { waitUntil: 'domcontentloaded' });

    await page.getByRole('button', { name: 'Edit' }).click();
    await page.getByRole('textbox', { name: 'Title' }).fill('Updated Problem Title');
    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByRole('textbox', { name: 'Title' })).not.toBeVisible();
    await expect(page.getByText('Updated Problem Title')).toBeVisible();
  });

  test('should show delete confirmation dialog', async ({ page }) => {
    const mockData = { ...mocks.mockProblems.detail, status: 'open' };
    await page.route('**/api/v1/problems/prob-001', route =>
      route.fulfill({ json: { data: mockData } })
    );

    await page.goto('/problems/prob-001', { waitUntil: 'domcontentloaded' });

    await page.getByRole('button', { name: 'Delete' }).click();

    await expect(page.getByText('Delete this problem permanently?')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Delete' })).toBeVisible();
  });

  test('should delete problem after confirmation', async ({ page }) => {
    await page.route('**/api/v1/problems/prob-001', route => {
      if (route.request().method() === 'DELETE') {
        return route.fulfill({ status: 204 });
      }
      return route.fulfill({ json: { ...mocks.mockProblems.detail } });
    });

    await page.goto('/problems/prob-001', { waitUntil: 'domcontentloaded' });

    await page.getByRole('button', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'Delete' }).click();

    await expect(page).toHaveURL('/problems');
  });

  test('should show RCA form with textarea fields', async ({ page }) => {
    const mockData = { ...mocks.mockProblems.detail, status: 'root_cause_identified' };
    await page.route('**/api/v1/problems/prob-001', route =>
      route.fulfill({ json: { data: mockData } })
    );

    await page.goto('/problems/prob-001', { waitUntil: 'domcontentloaded' });

    await page.getByRole('tab', { name: 'Root Cause Analysis' }).click();

    await expect(page.getByRole('button', { name: 'Add RCA' })).toBeVisible();
    await page.getByRole('button', { name: 'Add RCA' }).click();

    await expect(page.getByRole('textbox', { name: 'Root Cause' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Resolution' })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: 'Permanent Fix Applied' })).toBeVisible();
  });

  test('should save RCA after filling form', async ({ page }) => {
    const mockData = { ...mocks.mockProblems.detail, status: 'root_cause_identified' };
    await page.route('**/api/v1/problems/prob-001', route => {
      if (route.request().method() === 'POST') {
        return route.fulfill({ json: { data: { id: 'rca-001', rootCause: 'Test RCA' } } });
      }
      return route.fulfill({ json: { data: mockData } });
    });

    await page.goto('/problems/prob-001', { waitUntil: 'domcontentloaded' });

    await page.getByRole('tab', { name: 'Root Cause Analysis' }).click();
    await page.getByRole('button', { name: 'Add RCA' }).click();

    await page.getByRole('textbox', { name: 'Root Cause' }).fill('Memory leak in garbage collector');
    await page.getByRole('textbox', { name: 'Resolution' }).fill('Upgrade JVM version');
    await page.getByRole('checkbox', { name: 'Permanent Fix Applied' }).check();
    await page.getByRole('button', { name: 'Save RCA' }).click();

    // Button should disappear after save
    await expect(page.getByRole('button', { name: 'Save RCA' })).not.toBeVisible();
  });

  test('should show "Link Incident" button in linked incidents tab', async ({ page }) => {
    const mockData = { ...mocks.mockProblems.detail, status: 'open' };
    await page.route('**/api/v1/problems/prob-001', route =>
      route.fulfill({ json: { data: mockData } })
    );

    await page.goto('/problems/prob-001', { waitUntil: 'domcontentloaded' });

    await page.getByRole('tab', { name: 'Linked Incidents' }).click();

    await expect(page.getByRole('button', { name: 'Link Incident' })).toBeVisible();
  });

  test('should link incident after filling form', async ({ page }) => {
    const mockData = { ...mocks.mockProblems.detail, status: 'open' };
    await page.route('**/api/v1/problems/prob-001', route => {
      if (route.request().method() === 'PATCH') {
        return route.fulfill({ json: { data: { ...mockData, linkedIncidents: [{ id: 'inc-001' }] } } });
      }
      return route.fulfill({ json: { data: mockData } });
    });

    await page.goto('/problems/prob-001', { waitUntil: 'domcontentloaded' });

    await page.getByRole('tab', { name: 'Linked Incidents' }).click();
    await page.getByRole('button', { name: 'Link Incident' }).click();

    await page.getByRole('textbox', { name: 'Incident ID' }).fill('inc-001');
    await page.getByRole('button', { name: 'Link' }).click();

    // Should show linked incident with view button
    await expect(page.getByRole('button', { name: 'View' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'inc-001' })).toBeVisible();
  });
});