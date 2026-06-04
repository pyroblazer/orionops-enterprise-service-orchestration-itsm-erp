import { test, expect } from '@playwright/test';
import { injectMockAuth } from './helpers/auth';
import * as mocks from './helpers/api-mock';

test.describe('Change Lifecycle Extended', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockAuth(page);
  });

  test('should show "Submit for Approval" button when status is draft', async ({ page }) => {
    const mockData = { ...mocks.mockChanges.detail, status: 'draft' };
    await page.route('**/api/v1/changes/chg-001', route =>
      route.fulfill({ json: { data: mockData } })
    );

    await page.goto('/changes/chg-001', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('button', { name: 'Submit for Approval' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Approve' })).not.toBeVisible();
  });

  test('should show approve/reject buttons after submitting for approval', async ({ page }) => {
    const mockData = { ...mocks.mockChanges.detail, status: 'draft' };
    await page.route('**/api/v1/changes/chg-001', route => {
      if (route.request().method() === 'PATCH') {
        return route.fulfill({ json: { data: { ...mockData, status: 'pending_approval' } } });
      }
      return route.fulfill({ json: { data: mockData } });
    });

    await page.goto('/changes/chg-001', { waitUntil: 'domcontentloaded' });

    await page.getByRole('button', { name: 'Submit for Approval' }).click();

    await expect(page.getByRole('button', { name: 'Approve' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reject' })).toBeVisible();
  });

  test('should show approve form with comment input', async ({ page }) => {
    const mockData = { ...mocks.mockChanges.detail, status: 'pending_approval' };
    await page.route('**/api/v1/changes/chg-001', route =>
      route.fulfill({ json: { data: mockData } })
    );

    await page.goto('/changes/chg-001', { waitUntil: 'domcontentloaded' });

    await page.getByRole('button', { name: 'Approve' }).click();

    await expect(page.getByRole('textbox', { name: 'Comment' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible();
  });

  test('should approve change after filling comment', async ({ page }) => {
    const mockData = { ...mocks.mockChanges.detail, status: 'pending_approval' };
    await page.route('**/api/v1/changes/chg-001', route => {
      if (route.request().method() === 'PATCH') {
        return route.fulfill({ json: { data: { ...mockData, status: 'approved' } } });
      }
      return route.fulfill({ json: { data: mockData } });
    });

    await page.goto('/changes/chg-001', { waitUntil: 'domcontentloaded' });

    await page.getByRole('button', { name: 'Approve' }).click();
    await page.getByRole('textbox', { name: 'Comment' }).fill('CAB approved');
    await page.getByRole('button', { name: 'Submit' }).click();

    await expect(page.getByRole('button', { name: 'Start Implementation' })).toBeVisible();
  });

  test('should show reject form with required reason textarea', async ({ page }) => {
    const mockData = { ...mocks.mockChanges.detail, status: 'pending_approval' };
    await page.route('**/api/v1/changes/chg-001', route =>
      route.fulfill({ json: { data: mockData } })
    );

    await page.goto('/changes/chg-001', { waitUntil: 'domcontentloaded' });

    await page.getByRole('button', { name: 'Reject' }).click();

    await expect(page.getByRole('textbox', { name: 'Reason (required)' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Submit' })).toBeDisabled();
  });

  test('should require reason in reject form', async ({ page }) => {
    const mockData = { ...mocks.mockChanges.detail, status: 'pending_approval' };
    await page.route('**/api/v1/changes/chg-001', route =>
      route.fulfill({ json: { data: mockData } })
    );

    await page.goto('/changes/chg-001', { waitUntil: 'domcontentloaded' });

    await page.getByRole('button', { name: 'Reject' }).click();
    await page.getByRole('button', { name: 'Submit' }).click();

    // Form should stay open
    await expect(page.getByRole('textbox', { name: 'Reason (required)' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Submit' })).toBeDisabled();
  });

  test('should reject change after filling reason', async ({ page }) => {
    const mockData = { ...mocks.mockChanges.detail, status: 'pending_approval' };
    await page.route('**/api/v1/changes/chg-001', route => {
      if (route.request().method() === 'PATCH') {
        return route.fulfill({ json: { data: { ...mockData, status: 'rejected' } } });
      }
      return route.fulfill({ json: { data: mockData } });
    });

    await page.goto('/changes/chg-001', { waitUntil: 'domcontentloaded' });

    await page.getByRole('button', { name: 'Reject' }).click();
    await page.getByRole('textbox', { name: 'Reason (required)' }).fill('Change request incomplete');
    await page.getByRole('button', { name: 'Submit' }).click();

    // Form should close
    await expect(page.getByRole('textbox', { name: 'Reason (required)' })).not.toBeVisible();
  });

  test('should show implementation form with datetime and notes fields', async ({ page }) => {
    const mockData = { ...mocks.mockChanges.detail, status: 'approved' };
    await page.route('**/api/v1/changes/chg-001', route =>
      route.fulfill({ json: { data: mockData } })
    );

    await page.goto('/changes/chg-001', { waitUntil: 'domcontentloaded' });

    await page.getByRole('button', { name: 'Start Implementation' }).click();

    await expect(page.getByLabel('Actual Start')).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Implementation Notes' })).toBeVisible();
  });

  test('should start implementation with pre-filled datetime', async ({ page }) => {
    const mockData = { ...mocks.mockChanges.detail, status: 'approved' };
    await page.route('**/api/v1/changes/chg-001', route => {
      if (route.request().method() === 'PATCH') {
        return route.fulfill({ json: { data: { ...mockData, status: 'implementing' } } });
      }
      return route.fulfill({ json: { data: mockData } });
    });

    await page.goto('/changes/chg-001', { waitUntil: 'domcontentloaded' });

    await page.getByRole('button', { name: 'Start Implementation' }).click();
    const actualStartInput = page.getByLabel('Actual Start');
    const notesInput = page.getByRole('textbox', { name: 'Implementation Notes' });

    await expect(actualStartInput).toHaveAttribute('type', 'datetime-local');
    await expect(notesInput).toBeEmpty();

    await page.getByRole('button', { name: 'Submit' }).click();

    await expect(page.getByRole('button', { name: 'Close Change' })).toBeVisible();
  });

  test('should show close change button after implementation starts', async ({ page }) => {
    const mockData = { ...mocks.mockChanges.detail, status: 'implementing' };
    await page.route('**/api/v1/changes/chg-001', route =>
      route.fulfill({ json: { data: mockData } })
    );

    await page.goto('/changes/chg-001', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('button', { name: 'Close Change' })).toBeVisible();
  });

  test('should close change after implementation', async ({ page }) => {
    const mockData = { ...mocks.mockChanges.detail, status: 'implementing' };
    await page.route('**/api/v1/changes/chg-001', route => {
      if (route.request().method() === 'PATCH') {
        return route.fulfill({ json: { data: { ...mockData, status: 'closed' } } });
      }
      return route.fulfill({ json: { data: mockData } });
    });

    await page.goto('/changes/chg-001', { waitUntil: 'domcontentloaded' });

    await page.getByRole('button', { name: 'Close Change' }).click();

    // No lifecycle buttons should be visible
    await expect(page.getByRole('button', { name: 'Close Change' })).not.toBeVisible();
  });

  test('should always show delete button', async ({ page }) => {
    const statuses = ['draft', 'pending_approval', 'approved', 'implementing', 'closed'];

    for (const status of statuses) {
      const mockData = { ...mocks.mockChanges.detail, status };
      await page.route('**/api/v1/changes/chg-001', route =>
        route.fulfill({ json: { data: mockData } })
      );

      await page.goto('/changes/chg-001', { waitUntil: 'domcontentloaded' });

      await expect(page.getByRole('button', { name: 'Delete' })).toBeVisible();
    }
  });

  test('should show delete confirmation dialog', async ({ page }) => {
    const mockData = { ...mocks.mockChanges.detail, status: 'draft' };
    await page.route('**/api/v1/changes/chg-001', route =>
      route.fulfill({ json: { data: mockData } })
    );

    await page.goto('/changes/chg-001', { waitUntil: 'domcontentloaded' });

    await page.getByRole('button', { name: 'Delete' }).click();

    await expect(page.getByText('Delete this change request permanently?')).toBeVisible();
  });

  test('should show risk level indicator in risk tab', async ({ page }) => {
    const mockData = { ...mocks.mockChanges.detail, status: 'draft' };
    await page.route('**/api/v1/changes/chg-001', route =>
      route.fulfill({ json: { data: mockData } })
    );

    await page.goto('/changes/chg-001', { waitUntil: 'domcontentloaded' });

    await page.getByRole('tab', { name: 'Risk Assessment' }).click();

    await expect(page.getByText('Medium Risk')).toBeVisible();
    await expect(page.getByText('MODERATE Impact')).toBeVisible();
  });

  test('should show implementation plan and rollback plan cards', async ({ page }) => {
    const mockData = { ...mocks.mockChanges.detail, status: 'draft' };
    await page.route('**/api/v1/changes/chg-001', route =>
      route.fulfill({ json: { data: mockData } })
    );

    await page.goto('/changes/chg-001', { waitUntil: 'domcontentloaded' });

    await page.getByRole('tab', { name: 'Implementation' }).click();

    await expect(page.getByRole('button', { name: 'Implementation Plan' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Rollback Plan' })).toBeVisible();
  });

  test('should show rollback content when expandable', async ({ page }) => {
    const mockData = { ...mocks.mockChanges.detail, status: 'draft' };
    await page.route('**/api/v1/changes/chg-001', route =>
      route.fulfill({ json: { data: mockData } })
    );

    await page.goto('/changes/chg-001', { waitUntil: 'domcontentloaded' });

    await page.getByRole('tab', { name: 'Implementation' }).click();

    const rollbackBtn = page.getByRole('button', { name: 'Rollback Plan' });
    await rollbackBtn.click();

    await expect(page.getByText('Restore from backup')).toBeVisible();
  });

  test('should show approval status in approval tab', async ({ page }) => {
    const mockData = { ...mocks.mockChanges.detail, status: 'pending_approval' };
    await page.route('**/api/v1/changes/chg-001', route =>
      route.fulfill({ json: { data: mockData } })
    );

    await page.goto('/changes/chg-001', { waitUntil: 'domcontentloaded' });

    await page.getByRole('tab', { name: 'Approvals' }).click();

    await expect(page.getByText('Pending Approval')).toBeVisible();
  });

  test('should show emergency change badge when type is EMERGENCY', async ({ page }) => {
    const mockData = { ...mocks.mockChanges.detail, type: 'EMERGENCY' };
    await page.route('**/api/v1/changes/chg-001', route =>
      route.fulfill({ json: { data: mockData } })
    );

    await page.goto('/changes/chg-001', { waitUntil: 'domcontentloaded' });

    await expect(page.getByText('EMERGENCY')).toBeVisible();
  });

  test('should show change ID in breadcrumb', async ({ page }) => {
    const mockData = { ...mocks.mockChanges.detail, status: 'draft' };
    await page.route('**/api/v1/changes/chg-001', route =>
      route.fulfill({ json: { data: mockData } })
    );

    await page.goto('/changes/chg-001', { waitUntil: 'domcontentloaded' });

    await expect(page.getByText('chg-001')).toBeVisible();
  });
});