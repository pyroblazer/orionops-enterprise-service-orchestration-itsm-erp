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
    await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible();
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

    await page.getByRole('button', { name: 'Submit' }).click();

    await expect(page.getByRole('button', { name: 'Approve' })).toBeVisible();
  });

  test('should show approve form with comments input', async ({ page }) => {
    const mockData = { ...mocks.mockRequests.detail, status: 'submitted' };
    await page.route('**/api/v1/requests/req-001', route =>
      route.fulfill({ json: { data: mockData } })
    );

    await page.goto('/requests/req-001', { waitUntil: 'domcontentloaded' });

    await page.getByRole('button', { name: 'Approve' }).click();

    await expect(page.getByRole('textbox', { name: 'Comments' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible();
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

    await page.getByRole('button', { name: 'Approve' }).click();
    await page.getByRole('textbox', { name: 'Comments' }).fill('Approved per catalog');
    await page.getByRole('button', { name: 'Submit' }).click();

    await expect(page.getByRole('button', { name: 'Fulfill' })).toBeVisible();
  });

  test('should show fulfill button when status is approved', async ({ page }) => {
    const mockData = { ...mocks.mockRequests.detail, status: 'approved' };
    await page.route('**/api/v1/requests/req-001', route =>
      route.fulfill({ json: { data: mockData } })
    );

    await page.goto('/requests/req-001', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('button', { name: 'Fulfill' })).toBeVisible();
  });

  test('should show fulfillment form with notes textarea', async ({ page }) => {
    const mockData = { ...mocks.mockRequests.detail, status: 'approved' };
    await page.route('**/api/v1/requests/req-001', route =>
      route.fulfill({ json: { data: mockData } })
    );

    await page.goto('/requests/req-001', { waitUntil: 'domcontentloaded' });

    await page.getByRole('button', { name: 'Fulfill' }).click();

    await expect(page.getByRole('textbox', { name: 'Fulfillment Notes' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible();
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

    await page.getByRole('button', { name: 'Fulfill' }).click();
    await page.getByRole('textbox', { name: 'Fulfillment Notes' }).fill('Account created successfully');
    await page.getByRole('button', { name: 'Submit' }).click();

    await expect(page.getByRole('button', { name: 'Close' })).toBeVisible();
  });

  test('should show close button when status is in_fulfillment', async ({ page }) => {
    const mockData = { ...mocks.mockRequests.detail, status: 'in_fulfillment' };
    await page.route('**/api/v1/requests/req-001', route =>
      route.fulfill({ json: { data: mockData } })
    );

    await page.goto('/requests/req-001', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('button', { name: 'Close' })).toBeVisible();
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

    await page.getByRole('button', { name: 'Close' }).click();

    // No status buttons should be visible
    await expect(page.getByRole('button', { name: 'Submit' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Approve' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Fulfill' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Close' })).not.toBeVisible();
  });

  test('should always show delete button', async ({ page }) => {
    const statuses = ['draft', 'submitted', 'approved', 'in_fulfillment', 'closed'];

    for (const status of statuses) {
      const mockData = { ...mocks.mockRequests.detail, status };
      await page.route('**/api/v1/requests/req-001', route =>
        route.fulfill({ json: { data: mockData } })
      );

      await page.goto('/requests/req-001', { waitUntil: 'domcontentloaded' });

      await expect(page.getByRole('button', { name: 'Delete' })).toBeVisible();
    }
  });

  test('should show delete confirmation dialog', async ({ page }) => {
    const mockData = { ...mocks.mockRequests.detail, status: 'draft' };
    await page.route('**/api/v1/requests/req-001', route =>
      route.fulfill({ json: { data: mockData } })
    );

    await page.goto('/requests/req-001', { waitUntil: 'domcontentloaded' });

    await page.getByRole('button', { name: 'Delete' }).click();

    await expect(page.getByText('Delete this service request permanently?')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Delete' })).toBeVisible();
  });

  test('should delete request after confirmation', async ({ page }) => {
    await page.route('**/api/v1/requests/req-001', route => {
      if (route.request().method() === 'DELETE') {
        return route.fulfill({ status: 204 });
      }
      return route.fulfill({ json: { ...mocks.mockRequests.detail } });
    });

    await page.goto('/requests/req-001', { waitUntil: 'domcontentloaded' });

    await page.getByRole('button', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'Delete' }).click();

    await expect(page).toHaveURL('/requests');
  });

  test('should show back button that navigates to requests list', async ({ page }) => {
    const mockData = { ...mocks.mockRequests.detail, status: 'draft' };
    await page.route('**/api/v1/requests/req-001', route =>
      route.fulfill({ json: { data: mockData } })
    );

    await page.goto('/requests/req-001', { waitUntil: 'domcontentloaded' });

    await page.getByRole('link', { name: 'Back to Requests' }).click();

    await expect(page).toHaveURL('/requests');
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
    await expect(page.getByRole('tab', { name: 'Details' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Activity' })).toBeVisible();
  });

  test('should render activity tab with no activity message when empty', async ({ page }) => {
    const mockData = { ...mocks.mockRequests.detail, status: 'draft' };
    await page.route('**/api/v1/requests/req-001', route =>
      route.fulfill({ json: { data: mockData } })
    );

    await page.goto('/requests/req-001', { waitUntil: 'domcontentloaded' });

    await page.getByRole('tab', { name: 'Activity' }).click();

    await expect(page.getByText('No activity recorded yet.')).toBeVisible();
  });

  test('should show not found state when request is null', async ({ page }) => {
    await page.route('**/api/v1/requests/req-001', route =>
      route.fulfill({ json: { data: null } })
    );

    await page.goto('/requests/req-001', { waitUntil: 'domcontentloaded' });

    await expect(page.getByText('Request not found')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Back to Requests' })).toBeVisible();
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

    await expect(page.getByText('Loading')).toBeVisible();
    // Wait for skeleton animation
    await expect(page.locator('[data-testid="skeleton-loader"]')).toBeVisible();
  });
});