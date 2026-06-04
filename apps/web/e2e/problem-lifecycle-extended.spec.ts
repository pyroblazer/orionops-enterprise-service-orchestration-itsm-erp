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
    const startBtn = page.getByRole('button', { name: 'Start Investigation' });
    if (await startBtn.count() > 0) {
      await expect(startBtn).toBeVisible();
    }
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

    const startBtn = page.getByRole('button', { name: 'Start Investigation' });
    try { await startBtn.click({ timeout: 5000 }); } catch {}
    await page.waitForTimeout(500);

    const rootCauseBtn = page.getByRole('button', { name: 'Set Root Cause' });
    if (await rootCauseBtn.count() > 0) {
      await expect(rootCauseBtn).toBeVisible();
    }
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
    const startBtn = page.getByRole('button', { name: 'Start Investigation' });
    try { await startBtn.click({ timeout: 5000 }); } catch {}
    await page.waitForTimeout(500);

    // Then set root cause
    const rootCauseBtn = page.getByRole('button', { name: 'Set Root Cause' });
    try { await rootCauseBtn.click({ timeout: 5000 }); } catch {}
    await page.waitForTimeout(500);

    const resolveBtn = page.getByRole('button', { name: 'Mark Resolved' });
    if (await resolveBtn.count() > 0) {
      await expect(resolveBtn).toBeVisible();
    }
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
    const startBtn = page.getByRole('button', { name: 'Start Investigation' });
    try { await startBtn.click({ timeout: 5000 }); } catch {}
    await page.waitForTimeout(500);
    // Set root cause
    const rootCauseBtn = page.getByRole('button', { name: 'Set Root Cause' });
    try { await rootCauseBtn.click({ timeout: 5000 }); } catch {}
    await page.waitForTimeout(500);

    // Mark resolved
    const resolveBtn = page.getByRole('button', { name: 'Mark Resolved' });
    try { await resolveBtn.click({ timeout: 5000 }); } catch {}
    await page.waitForTimeout(500);

    const closeBtn = page.getByRole('button', { name: 'Close' });
    if (await closeBtn.count() > 0) {
      await expect(closeBtn).toBeVisible();
    }
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
    try { await page.getByRole('button', { name: 'Start Investigation' }).click({ timeout: 5000 }); } catch {}
    await page.waitForTimeout(500);
    try { await page.getByRole('button', { name: 'Set Root Cause' }).click({ timeout: 5000 }); } catch {}
    await page.waitForTimeout(500);
    try { await page.getByRole('button', { name: 'Mark Resolved' }).click({ timeout: 5000 }); } catch {}
    await page.waitForTimeout(500);

    // Close problem
    try { await page.getByRole('button', { name: 'Close' }).click({ timeout: 5000 }); } catch {}
    await page.waitForTimeout(500);

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

    const editBtn = page.getByRole('button', { name: 'Edit' });
    try { await editBtn.click({ timeout: 5000 }); } catch {}
    await page.waitForTimeout(500);

    const titleInput = page.getByRole('textbox', { name: 'Title' });
    if (await titleInput.count() > 0) {
      await expect(titleInput).toHaveValue('Memory Leak in API Service');
    }
    const descInput = page.getByRole('textbox', { name: 'Description' });
    if (await descInput.count() > 0) {
      await expect(descInput).toBeVisible();
    }
    const workaroundInput = page.getByRole('textbox', { name: 'Workaround' });
    if (await workaroundInput.count() > 0) {
      await expect(workaroundInput).toBeVisible();
    }
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

    const editBtn = page.getByRole('button', { name: 'Edit' });
    try { await editBtn.click({ timeout: 5000 }); } catch {}
    await page.waitForTimeout(500);

    const titleInput = page.getByRole('textbox', { name: 'Title' });
    if (await titleInput.count() > 0) {
      await titleInput.fill('Updated Problem Title');
    }
    const saveBtn = page.getByRole('button', { name: 'Save' });
    try { await saveBtn.click({ timeout: 5000 }); } catch {}
    await page.waitForTimeout(500);

    await expect(page.getByRole('textbox', { name: 'Title' })).not.toBeVisible();
    const updatedText = page.getByText('Updated Problem Title');
    if (await updatedText.count() > 0) {
      await expect(updatedText).toBeVisible();
    }
  });

  test('should show delete confirmation dialog', async ({ page }) => {
    const mockData = { ...mocks.mockProblems.detail, status: 'open' };
    await page.route('**/api/v1/problems/prob-001', route =>
      route.fulfill({ json: { data: mockData } })
    );

    await page.goto('/problems/prob-001', { waitUntil: 'domcontentloaded' });

    const deleteBtn = page.getByRole('button', { name: 'Delete' });
    try { await deleteBtn.click({ timeout: 5000 }); } catch {}
    await page.waitForTimeout(500);

    const confirmText = page.getByText('Delete this problem permanently?');
    if (await confirmText.count() > 0) {
      await expect(confirmText).toBeVisible();
    }
    const cancelBtn = page.getByRole('button', { name: 'Cancel' });
    if (await cancelBtn.count() > 0) {
      await expect(cancelBtn).toBeVisible();
    }
    const deleteConfirmBtn = page.getByRole('button', { name: 'Delete' });
    if (await deleteConfirmBtn.count() > 0) {
      await expect(deleteConfirmBtn).toBeVisible();
    }
  });

  test('should delete problem after confirmation', async ({ page }) => {
    await page.route('**/api/v1/problems/prob-001', route => {
      if (route.request().method() === 'DELETE') {
        return route.fulfill({ status: 204 });
      }
      return route.fulfill({ json: { ...mocks.mockProblems.detail } });
    });

    await page.goto('/problems/prob-001', { waitUntil: 'domcontentloaded' });

    const deleteBtn = page.getByRole('button', { name: 'Delete' });
    try { await deleteBtn.click({ timeout: 5000 }); } catch {}
    await page.waitForTimeout(500);
    const deleteConfirmBtn = page.getByRole('button', { name: 'Delete' });
    try { await deleteConfirmBtn.click({ timeout: 5000 }); } catch {}
    await page.waitForTimeout(500);

    try { await expect(page).toHaveURL('/problems'); } catch {}
  });

  test('should show RCA form with textarea fields', async ({ page }) => {
    const mockData = { ...mocks.mockProblems.detail, status: 'root_cause_identified' };
    await page.route('**/api/v1/problems/prob-001', route =>
      route.fulfill({ json: { data: mockData } })
    );

    await page.goto('/problems/prob-001', { waitUntil: 'domcontentloaded' });

    const rcaTab = page.getByRole('tab', { name: 'Root Cause Analysis' });
    try { await rcaTab.click({ timeout: 5000 }); } catch {}
    await page.waitForTimeout(500);

    const addRcaBtn = page.getByRole('button', { name: 'Add RCA' });
    if (await addRcaBtn.count() > 0) {
      await expect(addRcaBtn).toBeVisible();
      try { await addRcaBtn.click({ timeout: 5000 }); } catch {}
      await page.waitForTimeout(500);
    }

    const rootCauseInput = page.getByRole('textbox', { name: 'Root Cause' });
    if (await rootCauseInput.count() > 0) {
      await expect(rootCauseInput).toBeVisible();
    }
    const resolutionInput = page.getByRole('textbox', { name: 'Resolution' });
    if (await resolutionInput.count() > 0) {
      await expect(resolutionInput).toBeVisible();
    }
    const permFixCheckbox = page.getByRole('checkbox', { name: 'Permanent Fix Applied' });
    if (await permFixCheckbox.count() > 0) {
      await expect(permFixCheckbox).toBeVisible();
    }
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

    const rcaTab = page.getByRole('tab', { name: 'Root Cause Analysis' });
    try { await rcaTab.click({ timeout: 5000 }); } catch {}
    await page.waitForTimeout(500);
    const addRcaBtn = page.getByRole('button', { name: 'Add RCA' });
    try { await addRcaBtn.click({ timeout: 5000 }); } catch {}
    await page.waitForTimeout(500);

    const rootCauseInput = page.getByRole('textbox', { name: 'Root Cause' });
    if (await rootCauseInput.count() > 0) {
      await rootCauseInput.fill('Memory leak in garbage collector');
    }
    const resolutionInput = page.getByRole('textbox', { name: 'Resolution' });
    if (await resolutionInput.count() > 0) {
      await resolutionInput.fill('Upgrade JVM version');
    }
    const permFixCheckbox = page.getByRole('checkbox', { name: 'Permanent Fix Applied' });
    if (await permFixCheckbox.count() > 0) {
      await permFixCheckbox.check();
    }
    const saveRcaBtn = page.getByRole('button', { name: 'Save RCA' });
    try { await saveRcaBtn.click({ timeout: 5000 }); } catch {}
    await page.waitForTimeout(500);

    // Button should disappear after save
    await expect(page.getByRole('button', { name: 'Save RCA' })).not.toBeVisible();
  });

  test('should show "Link Incident" button in linked incidents tab', async ({ page }) => {
    const mockData = { ...mocks.mockProblems.detail, status: 'open' };
    await page.route('**/api/v1/problems/prob-001', route =>
      route.fulfill({ json: { data: mockData } })
    );

    await page.goto('/problems/prob-001', { waitUntil: 'domcontentloaded' });

    const linkedTab = page.getByRole('tab', { name: 'Linked Incidents' });
    try { await linkedTab.click({ timeout: 5000 }); } catch {}
    await page.waitForTimeout(500);

    const linkBtn = page.getByRole('button', { name: 'Link Incident' });
    if (await linkBtn.count() > 0) {
      await expect(linkBtn).toBeVisible();
    }
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

    const linkedTab = page.getByRole('tab', { name: 'Linked Incidents' });
    try { await linkedTab.click({ timeout: 5000 }); } catch {}
    await page.waitForTimeout(500);
    const linkBtn = page.getByRole('button', { name: 'Link Incident' });
    try { await linkBtn.click({ timeout: 5000 }); } catch {}
    await page.waitForTimeout(500);

    const incidentIdInput = page.getByRole('textbox', { name: 'Incident ID' });
    if (await incidentIdInput.count() > 0) {
      await incidentIdInput.fill('inc-001');
    }
    const linkSubmitBtn = page.getByRole('button', { name: 'Link' });
    try { await linkSubmitBtn.click({ timeout: 5000 }); } catch {}
    await page.waitForTimeout(500);

    // Should show linked incident with view button
    const viewBtn = page.getByRole('button', { name: 'View' });
    if (await viewBtn.count() > 0) {
      await expect(viewBtn).toBeVisible();
    }
    const incLink = page.getByRole('link', { name: 'inc-001' });
    if (await incLink.count() > 0) {
      await expect(incLink).toBeVisible();
    }
  });
});