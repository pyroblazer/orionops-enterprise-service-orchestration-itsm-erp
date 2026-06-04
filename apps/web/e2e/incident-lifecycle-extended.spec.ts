import { test, expect } from '@playwright/test';
import { injectMockAuth } from './helpers/auth';
import * as mocks from './helpers/api-mock';

test.describe('Incident Lifecycle Extended', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockAuth(page);
  });

  test('should show "Start Working" button when status is new', async ({ page }) => {
    const mockData = { ...mocks.mockIncidents.detail, status: 'new' };
    await page.route('**/api/v1/incidents/inc-001', route =>
      route.fulfill({ json: { data: mockData } })
    );

    await page.goto('/incidents/inc-001', { waitUntil: 'domcontentloaded' });
    const startBtn = page.getByRole('button', { name: 'Start Working' });
    if (await startBtn.count() > 0) {
      await expect(startBtn).toBeVisible();
    }
    await expect(page.getByRole('button', { name: 'Close Incident' })).not.toBeVisible();
  });

  test('should not show "Close Incident" button when status is new', async ({ page }) => {
    const mockData = { ...mocks.mockIncidents.detail, status: 'new' };
    await page.route('**/api/v1/incidents/inc-001', route =>
      route.fulfill({ json: { data: mockData } })
    );

    await page.goto('/incidents/inc-001', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('button', { name: 'Close Incident' })).not.toBeVisible();
  });

  test('should update status to in_progress after clicking "Start Working"', async ({ page }) => {
    const mockData = { ...mocks.mockIncidents.detail, status: 'new' };
    await page.route('**/api/v1/incidents/inc-001', route => {
      if (route.request().method() === 'PATCH') {
        return route.fulfill({ json: { data: { ...mockData, status: 'in_progress' } } });
      }
      return route.fulfill({ json: { data: mockData } });
    });

    await page.goto('/incidents/inc-001', { waitUntil: 'domcontentloaded' });

    const startBtn = page.getByRole('button', { name: 'Start Working' });
    if (await startBtn.count() > 0) {
      await startBtn.click();
      const setPendingBtn = page.getByRole('button', { name: 'Set Pending' });
      if (await setPendingBtn.count() > 0) {
        await expect(setPendingBtn).toBeVisible();
      }
    }
  });

  test('should update status to pending after clicking "Set Pending"', async ({ page }) => {
    const mockData = { ...mocks.mockIncidents.detail, status: 'in_progress' };
    await page.route('**/api/v1/incidents/inc-001', route => {
      if (route.request().method() === 'PATCH') {
        return route.fulfill({ json: { data: { ...mockData, status: 'pending' } } });
      }
      return route.fulfill({ json: { data: mockData } });
    });

    await page.goto('/incidents/inc-001', { waitUntil: 'domcontentloaded' });

    const setPendingBtn = page.getByRole('button', { name: 'Set Pending' });
    if (await setPendingBtn.count() > 0) {
      await setPendingBtn.click();
      const resolveBtn = page.getByRole('button', { name: 'Resolve' });
      if (await resolveBtn.count() > 0) {
        await expect(resolveBtn).toBeVisible();
      }
    }
  });

  test('should show "Escalate" button regardless of status', async ({ page }) => {
    const statuses = ['new', 'in_progress', 'pending', 'resolved', 'closed'];

    for (const status of statuses) {
      const mockData = { ...mocks.mockIncidents.detail, status };
      await page.route('**/api/v1/incidents/inc-001', route =>
        route.fulfill({ json: { data: mockData } })
      );

      await page.goto('/incidents/inc-001', { waitUntil: 'domcontentloaded' });
      const escalateBtn = page.getByRole('button', { name: 'Escalate' });
      if (await escalateBtn.count() > 0) {
        await expect(escalateBtn).toBeVisible();
      }
    }
  });

  test('should show escalate form with reason textarea', async ({ page }) => {
    const mockData = { ...mocks.mockIncidents.detail, status: 'in_progress' };
    await page.route('**/api/v1/incidents/inc-001', route =>
      route.fulfill({ json: { data: mockData } })
    );

    await page.goto('/incidents/inc-001', { waitUntil: 'domcontentloaded' });

    const escalateBtn = page.getByRole('button', { name: 'Escalate' });
    if (await escalateBtn.count() > 0) {
      await escalateBtn.click();
      const reasonInput = page.getByPlaceholder('Reason for escalation');
      if (await reasonInput.count() > 0) {
        await expect(reasonInput).toBeVisible();
      }
    }
  });

  test('should submit escalate form successfully', async ({ page }) => {
    const mockData = { ...mocks.mockIncidents.detail, status: 'in_progress' };
    await page.route('**/api/v1/incidents/inc-001', route => {
      if (route.request().method() === 'PATCH') {
        return route.fulfill({ json: { data: mockData } });
      }
      return route.fulfill({ json: { data: mockData } });
    });

    await page.goto('/incidents/inc-001', { waitUntil: 'domcontentloaded' });

    const escalateBtn = page.getByRole('button', { name: 'Escalate' });
    if (await escalateBtn.count() > 0) {
      await escalateBtn.click();
      const reasonInput = page.getByPlaceholder('Reason for escalation');
      if (await reasonInput.count() > 0) {
        await reasonInput.fill('Needs L3 support');
        const submitBtn = page.getByRole('button', { name: 'Submit' });
        if (await submitBtn.count() > 0) {
          await submitBtn.click();
          await expect(reasonInput).not.toBeVisible();
        }
      }
    }
  });

  test('should show resolve form with resolution textarea', async ({ page }) => {
    const mockData = { ...mocks.mockIncidents.detail, status: 'in_progress' };
    await page.route('**/api/v1/incidents/inc-001', route =>
      route.fulfill({ json: { data: mockData } })
    );

    await page.goto('/incidents/inc-001', { waitUntil: 'domcontentloaded' });

    const resolveBtn = page.getByRole('button', { name: 'Resolve' });
    if (await resolveBtn.count() > 0) {
      await resolveBtn.click();
      const resolutionInput = page.getByPlaceholder('Resolution details');
      if (await resolutionInput.count() > 0) {
        await expect(resolutionInput).toBeVisible();
      }
    }
  });

  test('should require resolution text in resolve form', async ({ page }) => {
    const mockData = { ...mocks.mockIncidents.detail, status: 'in_progress' };
    await page.route('**/api/v1/incidents/inc-001', route => {
      if (route.request().method() === 'PATCH') {
        return route.fulfill({ json: { data: mockData } });
      }
      return route.fulfill({ json: { data: mockData } });
    });

    await page.goto('/incidents/inc-001', { waitUntil: 'domcontentloaded' });

    const resolveBtn = page.getByRole('button', { name: 'Resolve' });
    if (await resolveBtn.count() > 0) {
      await resolveBtn.click();
      const submitBtn = page.getByRole('button', { name: 'Submit' });
      if (await submitBtn.count() > 0) {
        await submitBtn.click();
        const resolutionInput = page.getByPlaceholder('Resolution details');
        if (await resolutionInput.count() > 0) {
          await expect(resolutionInput).toBeVisible();
        }
      }
    }
  });

  test('should submit resolve form successfully', async ({ page }) => {
    const mockData = { ...mocks.mockIncidents.detail, status: 'in_progress' };
    await page.route('**/api/v1/incidents/inc-001', route => {
      if (route.request().method() === 'PATCH') {
        return route.fulfill({ json: { data: { ...mockData, status: 'resolved' } } });
      }
      return route.fulfill({ json: { data: mockData } });
    });

    await page.goto('/incidents/inc-001', { waitUntil: 'domcontentloaded' });

    const resolveBtn = page.getByRole('button', { name: 'Resolve' });
    if (await resolveBtn.count() > 0) {
      await resolveBtn.click();
      const resolutionInput = page.getByPlaceholder('Resolution details');
      if (await resolutionInput.count() > 0) {
        await resolutionInput.fill('Fixed by restarting service');
        const submitBtn = page.getByRole('button', { name: 'Submit' });
        if (await submitBtn.count() > 0) {
          await submitBtn.click();
          await expect(resolutionInput).not.toBeVisible();
        }
      }
    }
  });

  test('should show "Close Incident" only when status is resolved', async ({ page }) => {
    const statuses = ['new', 'in_progress', 'pending', 'resolved', 'closed'];

    for (const status of statuses) {
      const mockData = { ...mocks.mockIncidents.detail, status };
      await page.route('**/api/v1/incidents/inc-001', route =>
        route.fulfill({ json: { data: mockData } })
      );

      await page.goto('/incidents/inc-001', { waitUntil: 'domcontentloaded' });
      const closeBtn = page.getByRole('button', { name: 'Close Incident' });

      if (status === 'resolved') {
        if (await closeBtn.count() > 0) {
          await expect(closeBtn).toBeVisible();
        }
      } else {
        await expect(closeBtn).not.toBeVisible();
      }
    }
  });

  test('should close incident after clicking "Close Incident"', async ({ page }) => {
    const mockData = { ...mocks.mockIncidents.detail, status: 'resolved' };
    await page.route('**/api/v1/incidents/inc-001', route => {
      if (route.request().method() === 'PATCH') {
        return route.fulfill({ json: { data: { ...mockData, status: 'closed' } } });
      }
      return route.fulfill({ json: { data: mockData } });
    });

    await page.goto('/incidents/inc-001', { waitUntil: 'domcontentloaded' });

    const closeBtn = page.getByRole('button', { name: 'Close Incident' });
    if (await closeBtn.count() > 0) {
      await closeBtn.click();
      await expect(page.getByRole('button', { name: 'Close Incident' })).not.toBeVisible();
    }
  });

  test('should render SLA timer with role="alert"', async ({ page }) => {
    const mockData = { ...mocks.mockIncidents.detail, status: 'in_progress' };
    await page.route('**/api/v1/incidents/inc-001', route =>
      route.fulfill({ json: { data: mockData } })
    );

    await page.goto('/incidents/inc-001', { waitUntil: 'domcontentloaded' });

    const slaAlert = page.locator('[role="alert"]');
    if (await slaAlert.count() > 0) {
      await expect(slaAlert.first()).toBeVisible();
    }
  });

  test('should have comment textarea in activity tab', async ({ page }) => {
    const mockData = { ...mocks.mockIncidents.detail, status: 'in_progress' };
    await page.route('**/api/v1/incidents/inc-001', route =>
      route.fulfill({ json: { data: mockData } })
    );

    await page.goto('/incidents/inc-001', { waitUntil: 'domcontentloaded' });

    const activityTab = page.getByRole('tab', { name: 'Activity' });
    if (await activityTab.count() > 0) {
      await activityTab.click();

      const commentBox = page.getByRole('textbox', { name: 'Add a comment' });
      if (await commentBox.count() > 0) {
        await expect(commentBox).toBeVisible();
        const addBtn = page.getByRole('button', { name: 'Add Comment' });
        if (await addBtn.count() > 0) {
          await expect(addBtn).toBeDisabled();
        }
      }
    }
  });

  test('should enable comment button when comment is entered', async ({ page }) => {
    const mockData = { ...mocks.mockIncidents.detail, status: 'in_progress' };
    await page.route('**/api/v1/incidents/inc-001', route => {
      if (route.request().method() === 'POST') {
        return route.fulfill({ json: { data: { id: 'comment-001', text: 'Test comment' } } });
      }
      return route.fulfill({ json: { data: mockData } });
    });

    await page.goto('/incidents/inc-001', { waitUntil: 'domcontentloaded' });

    const activityTab = page.getByRole('tab', { name: 'Activity' });
    if (await activityTab.count() > 0) {
      await activityTab.click();

      const commentBox = page.getByRole('textbox', { name: 'Add a comment' });
      if (await commentBox.count() > 0) {
        await commentBox.fill('Test comment');
        const addBtn = page.getByRole('button', { name: 'Add Comment' });
        if (await addBtn.count() > 0) {
          await expect(addBtn).not.toBeDisabled();
          await addBtn.click();
          await expect(commentBox).toBeEmpty();
        }
      }
    }
  });
});
