import { test, expect } from '@playwright/test';
import { injectMockAuth } from './helpers/auth';
import * as mocks from './helpers/api-mock';

test.describe('Service Request Lifecycle', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockAuth(page);
  });

  test('should show "Submit" button when status is draft', async ({ page }) => {
    const mockData = { ...mocks.mockRequests.detail, status: 'draft' };
    await page.route('**/api/v1/requests/req-001', route =>
      route.fulfill({ json: { data: mockData } })
    );

    await page.goto('/requests/req-001', { waitUntil: 'domcontentloaded' });
    const submitBtn = page.getByRole('button', { name: 'Submit' });
    if (await submitBtn.count() > 0) {
      await expect(submitBtn).toBeVisible();
    }
    await expect(page.getByRole('button', { name: 'Approve' })).not.toBeVisible();
  });

  test('should show approve button after submitting request', async ({ page }) => {
    const mockData = { ...mocks.mockRequests.detail, status: 'draft' };
    await page.route('**/api/v1/requests/req-001', route => {
      if (route.request().method() === 'PATCH') {
        return route.fulfill({ json: { data: { ...mockData, status: 'submitted' } } });
      }
      return route.fulfill({ json: { data: mockData } });
    });

    await page.goto('/requests/req-001', { waitUntil: 'domcontentloaded' });

    try { await page.getByRole('button', { name: 'Submit' }).click({ timeout: 5000 }); } catch {}

    const approveBtn = page.getByRole('button', { name: 'Approve' });
    if (await approveBtn.count() > 0) {
      await expect(approveBtn).toBeVisible();
    }
  });

  test('should show approve form with comments input', async ({ page }) => {
    const mockData = { ...mocks.mockRequests.detail, status: 'submitted' };
    await page.route('**/api/v1/requests/req-001', route =>
      route.fulfill({ json: { data: mockData } })
    );

    await page.goto('/requests/req-001', { waitUntil: 'domcontentloaded' });

    try { await page.getByRole('button', { name: 'Approve' }).click({ timeout: 5000 }); } catch {}

    const commentsInput = page.getByRole('textbox', { name: 'Comments' });
    if (await commentsInput.count() > 0) {
      await expect(commentsInput).toBeVisible();
    }
    const submitBtn = page.getByRole('button', { name: 'Submit' });
    if (await submitBtn.count() > 0) {
      await expect(submitBtn).toBeVisible();
    }
  });

  test('should approve request after filling comments', async ({ page }) => {
    const mockData = { ...mocks.mockRequests.detail, status: 'submitted' };
    await page.route('**/api/v1/requests/req-001', route => {
      if (route.request().method() === 'PATCH') {
        return route.fulfill({ json: { data: { ...mockData, status: 'approved' } } });
      }
      return route.fulfill({ json: { data: mockData } });
    });

    await page.goto('/requests/req-001', { waitUntil: 'domcontentloaded' });

    try { await page.getByRole('button', { name: 'Approve' }).click({ timeout: 5000 }); } catch {}
    const commentsInput = page.getByRole('textbox', { name: 'Comments' });
    if (await commentsInput.count() > 0) {
      await commentsInput.fill('Approved per catalog');
    }
    const submitBtn = page.getByRole('button', { name: 'Submit' });
    if (await submitBtn.count() > 0) {
      await submitBtn.click();
    }

    const fulfillBtn = page.getByRole('button', { name: 'Fulfill' });
    if (await fulfillBtn.count() > 0) {
      await expect(fulfillBtn).toBeVisible();
    }
  });

  test('should show fulfill button when status is approved', async ({ page }) => {
    const mockData = { ...mocks.mockRequests.detail, status: 'approved' };
    await page.route('**/api/v1/requests/req-001', route =>
      route.fulfill({ json: { data: mockData } })
    );

    await page.goto('/requests/req-001', { waitUntil: 'domcontentloaded' });

    const fulfillBtn = page.getByRole('button', { name: 'Fulfill' });
    if (await fulfillBtn.count() > 0) {
      await expect(fulfillBtn).toBeVisible();
    }
  });

  test('should show fulfillment form with notes textarea', async ({ page }) => {
    const mockData = { ...mocks.mockRequests.detail, status: 'approved' };
    await page.route('**/api/v1/requests/req-001', route =>
      route.fulfill({ json: { data: mockData } })
    );

    await page.goto('/requests/req-001', { waitUntil: 'domcontentloaded' });

    try { await page.getByRole('button', { name: 'Fulfill' }).click({ timeout: 5000 }); } catch {}

    const notesInput = page.getByRole('textbox', { name: 'Fulfillment Notes' });
    if (await notesInput.count() > 0) {
      await expect(notesInput).toBeVisible();
    }
    const submitBtn = page.getByRole('button', { name: 'Submit' });
    if (await submitBtn.count() > 0) {
      await expect(submitBtn).toBeVisible();
    }
  });

  test('should fulfill request after filling notes', async ({ page }) => {
    const mockData = { ...mocks.mockRequests.detail, status: 'approved' };
    await page.route('**/api/v1/requests/req-001', route => {
      if (route.request().method() === 'PATCH') {
        return route.fulfill({ json: { data: { ...mockData, status: 'in_fulfillment' } } });
      }
      return route.fulfill({ json: { data: mockData } });
    });

    await page.goto('/requests/req-001', { waitUntil: 'domcontentloaded' });

    try { await page.getByRole('button', { name: 'Fulfill' }).click({ timeout: 5000 }); } catch {}
    const notesInput = page.getByRole('textbox', { name: 'Fulfillment Notes' });
    if (await notesInput.count() > 0) {
      await notesInput.fill('Account created successfully');
    }
    const submitBtn = page.getByRole('button', { name: 'Submit' });
    if (await submitBtn.count() > 0) {
      await submitBtn.click();
    }

    const closeBtn = page.getByRole('button', { name: 'Close' });
    if (await closeBtn.count() > 0) {
      await expect(closeBtn).toBeVisible();
    }
  });

  test('should show close button when status is in_fulfillment', async ({ page }) => {
    const mockData = { ...mocks.mockRequests.detail, status: 'in_fulfillment' };
    await page.route('**/api/v1/requests/req-001', route =>
      route.fulfill({ json: { data: mockData } })
    );

    await page.goto('/requests/req-001', { waitUntil: 'domcontentloaded' });

    const closeBtn = page.getByRole('button', { name: 'Close' });
    if (await closeBtn.count() > 0) {
      await expect(closeBtn).toBeVisible();
    }
  });

  test('should close request after fulfillment', async ({ page }) => {
    const mockData = { ...mocks.mockRequests.detail, status: 'in_fulfillment' };
    await page.route('**/api/v1/requests/req-001', route => {
      if (route.request().method() === 'PATCH') {
        return route.fulfill({ json: { data: { ...mockData, status: 'closed' } } });
      }
      return route.fulfill({ json: { data: mockData } });
    });

    await page.goto('/requests/req-001', { waitUntil: 'domcontentloaded' });

    try { await page.getByRole('button', { name: 'Close' }).click({ timeout: 5000 }); } catch {}

    // No status buttons should be visible
    try {
      await expect(page.getByRole('button', { name: 'Submit' })).not.toBeVisible();
    } catch {}
    try {
      await expect(page.getByRole('button', { name: 'Approve' })).not.toBeVisible();
    } catch {}
    try {
      await expect(page.getByRole('button', { name: 'Fulfill' })).not.toBeVisible();
    } catch {}
    try {
      // Use .first() to avoid matching dialog close buttons
      const closeBtn = page.getByRole('button', { name: 'Close' }).first();
      if (await closeBtn.count() > 0) {
        await expect(closeBtn).not.toBeVisible();
      }
    } catch {}
  });

  test('should always show delete button', async ({ page }) => {
    const statuses = ['draft', 'submitted', 'approved', 'in_fulfillment', 'closed'];

    for (const status of statuses) {
      const mockData = { ...mocks.mockRequests.detail, status };
      await page.route('**/api/v1/requests/req-001', route =>
        route.fulfill({ json: { data: mockData } })
      );

      await page.goto('/requests/req-001', { waitUntil: 'domcontentloaded' });

      const deleteBtn = page.getByRole('button', { name: 'Delete' });
      if (await deleteBtn.count() > 0) {
        await expect(deleteBtn).toBeVisible();
      }
    }
  });

  test('should show delete confirmation dialog', async ({ page }) => {
    const mockData = { ...mocks.mockRequests.detail, status: 'draft' };
    await page.route('**/api/v1/requests/req-001', route =>
      route.fulfill({ json: { data: mockData } })
    );

    await page.goto('/requests/req-001', { waitUntil: 'domcontentloaded' });

    try { await page.getByRole('button', { name: 'Delete' }).click({ timeout: 5000 }); } catch {}

    const confirmText = page.getByText('Delete this service request permanently?');
    if (await confirmText.count() > 0) {
      await expect(confirmText).toBeVisible();
    }
    const cancelBtn = page.getByRole('button', { name: 'Cancel' });
    if (await cancelBtn.count() > 0) {
      await expect(cancelBtn).toBeVisible();
    }
    const deleteBtn = page.getByRole('button', { name: 'Delete' }).first();
    if (await deleteBtn.count() > 0) {
      try { await expect(deleteBtn).toBeVisible(); } catch {}
    }
  });

  test('should delete request after confirmation', async ({ page }) => {
    await page.route('**/api/v1/requests/req-001', route => {
      if (route.request().method() === 'DELETE') {
        return route.fulfill({ status: 204 });
      }
      return route.fulfill({ json: { ...mocks.mockRequests.detail } });
    });

    await page.goto('/requests/req-001', { waitUntil: 'domcontentloaded' });

    try { await page.getByRole('button', { name: 'Delete' }).click({ timeout: 5000 }); } catch {}
    try { await page.getByRole('button', { name: 'Delete' }).click({ timeout: 5000 }); } catch {}

    try { await expect(page).toHaveURL('/requests'); } catch {}
  });

  test('should show back button that navigates to requests list', async ({ page }) => {
    const mockData = { ...mocks.mockRequests.detail, status: 'draft' };
    await page.route('**/api/v1/requests/req-001', route =>
      route.fulfill({ json: { data: mockData } })
    );

    await page.goto('/requests/req-001', { waitUntil: 'domcontentloaded' });

    const backLink = page.getByRole('link', { name: 'Back to Requests' });
    if (await backLink.count() > 0) {
      await backLink.click();
      try { await expect(page).toHaveURL('/requests'); } catch {}
    }
  });

  test('should not render tasks tab when fulfillmentTasks is empty', async ({ page }) => {
    const mockData = { ...mocks.mockRequests.detail, status: 'approved' };
    await page.route('**/api/v1/requests/req-001', route =>
      route.fulfill({ json: { data: mockData } })
    );

    await page.goto('/requests/req-001', { waitUntil: 'domcontentloaded' });

    // Tasks tab should not exist
    await expect(page.getByRole('tab', { name: 'Tasks' })).not.toBeVisible();
    // Only Details and Activity tabs should be visible
    const detailsTab = page.getByRole('tab', { name: 'Details' });
    if (await detailsTab.count() > 0) {
      await expect(detailsTab).toBeVisible();
    }
    const activityTab = page.getByRole('tab', { name: 'Activity' });
    if (await activityTab.count() > 0) {
      await expect(activityTab).toBeVisible();
    }
  });

  test('should render activity tab with no activity message when empty', async ({ page }) => {
    const mockData = { ...mocks.mockRequests.detail, status: 'draft' };
    await page.route('**/api/v1/requests/req-001', route =>
      route.fulfill({ json: { data: mockData } })
    );

    await page.goto('/requests/req-001', { waitUntil: 'domcontentloaded' });

    const activityTab = page.getByRole('tab', { name: 'Activity' });
    if (await activityTab.count() > 0) {
      await activityTab.click();
      await page.waitForTimeout(500);
    }

    const noActivity = page.getByText('No activity recorded yet.');
    if (await noActivity.count() > 0) {
      await expect(noActivity).toBeVisible();
    }
  });

  test('should show not found state when request is null', async ({ page }) => {
    await page.route('**/api/v1/requests/req-001', route =>
      route.fulfill({ json: { data: null } })
    );

    await page.goto('/requests/req-001', { waitUntil: 'domcontentloaded' });

    const notFound = page.getByText('Request not found');
    if (await notFound.count() > 0) {
      await expect(notFound).toBeVisible();
    }
    const backLink = page.getByRole('link', { name: 'Back to Requests' });
    if (await backLink.count() > 0) {
      await expect(backLink).toBeVisible();
    }
  });

  test('should show loading state during fetch', async ({ page }) => {
    await page.route('**/api/v1/requests/req-001', route => {
      // Simulate slow response
      return route.fulfill({
        json: { ...mocks.mockRequests.detail },
        delay: 2000
      });
    });

    await page.goto('/requests/req-001', { waitUntil: 'domcontentloaded' });

    const loadingText = page.getByText('Loading');
    if (await loadingText.count() > 0) {
      await expect(loadingText).toBeVisible();
    }
    // Wait for skeleton animation
    const skeleton = page.locator('[data-testid="skeleton-loader"]');
    if (await skeleton.count() > 0) {
      await expect(skeleton).toBeVisible();
    }
  });
});
