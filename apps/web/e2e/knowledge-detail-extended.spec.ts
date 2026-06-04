import { test, expect } from '@playwright/test';
import { injectMockAuth } from './helpers/auth';
import * as mocks from './helpers/api-mock';

test.describe('Knowledge Detail Extended', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockAuth(page);
  });

  test('should show breadcrumb with knowledge base link', async ({ page }) => {
    await page.route('**/api/v1/knowledge/kb-001', route =>
      route.fulfill({ json: { data: mocks.mockKnowledge.detail } })
    );

    await page.goto('/knowledge/kb-001', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('link', { name: 'Knowledge Base' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Knowledge Base' })).toHaveAttribute('href', '/knowledge');
  });

  test('should show back arrow button', async ({ page }) => {
    await page.route('**/api/v1/knowledge/kb-001', route =>
      route.fulfill({ json: { data: mocks.mockKnowledge.detail } })
    );

    await page.goto('/knowledge/kb-001', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('link', { name: 'Back' })).toBeVisible();
  });

  test('should show back arrow button navigates to knowledge list', async ({ page }) => {
    await page.route('**/api/v1/knowledge/kb-001', route =>
      route.fulfill({ json: { data: mocks.mockKnowledge.detail } })
    );

    await page.goto('/knowledge/kb-001', { waitUntil: 'domcontentloaded' });

    await page.getByRole('link', { name: 'Back' }).click();

    await expect(page).toHaveURL('/knowledge');
  });

  test('should show status badges with correct colors', async ({ page }) => {
    const statuses = ['PUBLISHED', 'DRAFT', 'IN_REVIEW'];

    for (const status of statuses) {
      const mockData = { ...mocks.mockKnowledge.detail, status };
      await page.route('**/api/v1/knowledge/kb-001', route =>
        route.fulfill({ json: { data: mockData } })
      );

      await page.goto('/knowledge/kb-001', { waitUntil: 'domcontentloaded' });

      if (status === 'PUBLISHED') {
        await expect(page.getByText('PUBLISHED')).toHaveClass(/success/);
      } else if (status === 'DRAFT') {
        await expect(page.getByText('DRAFT')).toHaveClass(/muted/);
      } else if (status === 'IN_REVIEW') {
        await expect(page.getByText('IN_REVIEW')).toHaveClass(/info/);
      }
    }
  });

  test('should show category badge', async ({ page }) => {
    await page.route('**/api/v1/knowledge/kb-001', route =>
      route.fulfill({ json: { data: mocks.mockKnowledge.detail } })
    );

    await page.goto('/knowledge/kb-001', { waitUntil: 'domcontentloaded' });

    await expect(page.getByText('How-To')).toBeVisible();
  });

  test('should show tag badges', async ({ page }) => {
    const mockData = { ...mocks.mockKnowledge.detail, tags: ['password', 'authentication', 'security'] };
    await page.route('**/api/v1/knowledge/kb-001', route =>
      route.fulfill({ json: { data: mockData } })
    );

    await page.goto('/knowledge/kb-001', { waitUntil: 'domcontentloaded' });

    await expect(page.getByText('password')).toBeVisible();
    await expect(page.getByText('authentication')).toBeVisible();
    await expect(page.getByText('security')).toBeVisible();
  });

  test('should show edit button', async ({ page }) => {
    await page.route('**/api/v1/knowledge/kb-001', route =>
      route.fulfill({ json: { data: mocks.mockKnowledge.detail } })
    );

    await page.goto('/knowledge/kb-001', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('button', { name: 'Edit' })).toBeVisible();
  });

  test('should show edit form with pre-filled fields', async ({ page }) => {
    await page.route('**/api/v1/knowledge/kb-001', route =>
      route.fulfill({ json: { data: mocks.mockKnowledge.detail } })
    );

    await page.goto('/knowledge/kb-001', { waitUntil: 'domcontentloaded' });

    await page.getByRole('button', { name: 'Edit' }).click();

    await expect(page.getByRole('textbox', { name: 'Title' })).toHaveValue('How to Reset Your Password');
    await expect(page.getByRole('combobox', { name: 'Category' })).toHaveValue('PUBLISHED');
    await expect(page.getByRole('textbox', { name: 'Tags' })).toHaveValue('password');
    await expect(page.getByRole('textbox', { name: 'Summary' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Content' })).toHaveValue('Follow these steps to reset your password...');
  });

  test('should update knowledge after submitting edit form', async ({ page }) => {
    const updatedData = { ...mocks.mockKnowledge.detail, title: 'Updated Article Title' };
    await page.route('**/api/v1/knowledge/kb-001', route => {
      if (route.request().method() === 'PUT') {
        return route.fulfill({ json: { data: updatedData } });
      }
      return route.fulfill({ json: { data: mocks.mockKnowledge.detail } });
    });

    await page.goto('/knowledge/kb-001', { waitUntil: 'domcontentloaded' });

    await page.getByRole('button', { name: 'Edit' }).click();
    await page.getByRole('textbox', { name: 'Title' }).fill('Updated Article Title');
    await page.getByRole('button', { name: 'Save' }).click();

    // Form should close and new title should be visible
    await expect(page.getByRole('textbox', { name: 'Title' })).not.toBeVisible();
    await expect(page.getByText('Updated Article Title')).toBeVisible();
  });

  test('should close edit form on cancel', async ({ page }) => {
    await page.route('**/api/v1/knowledge/kb-001', route =>
      route.fulfill({ json: { data: mocks.mockKnowledge.detail } })
    );

    await page.goto('/knowledge/kb-001', { waitUntil: 'domcontentloaded' });

    await page.getByRole('button', { name: 'Edit' }).click();
    await page.getByRole('button', { name: 'Cancel' }).click();

    // Form should be closed
    await expect(page.getByRole('textbox', { name: 'Title' })).not.toBeVisible();
  });

  test('should show views count with eye icon', async ({ page }) => {
    const mockData = { ...mocks.mockKnowledge.detail, views: 42 };
    await page.route('**/api/v1/knowledge/kb-001', route =>
      route.fulfill({ json: { data: mockData } })
    );

    await page.goto('/knowledge/kb-001', { waitUntil: 'domcontentloaded' });

    await expect(page.getByText('42 views')).toBeVisible();
  });

  test('should show author name', async ({ page }) => {
    const mockData = { ...mocks.mockKnowledge.detail, author: 'John Doe' };
    await page.route('**/api/v1/knowledge/kb-001', route =>
      route.fulfill({ json: { data: mockData } })
    );

    await page.goto('/knowledge/kb-001', { waitUntil: 'domcontentloaded' });

    await expect(page.getByText('John Doe')).toBeVisible();
  });

  test('should show helpfulness feedback buttons', async ({ page }) => {
    await page.route('**/api/v1/knowledge/kb-001', route =>
      route.fulfill({ json: { data: mocks.mockKnowledge.detail } })
    );

    await page.goto('/knowledge/kb-001', { waitUntil: 'domcontentloaded' });

    await expect(page.getByText('Was this article helpful?')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Yes' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'No' })).toBeVisible();
  });

  test('should show helpfulness counts', async ({ page }) => {
    const mockData = {
      ...mocks.mockKnowledge.detail,
      helpfulness: { yes: 15, no: 3 }
    };
    await page.route('**/api/v1/knowledge/kb-001', route =>
      route.fulfill({ json: { data: mockData } })
    );

    await page.goto('/knowledge/kb-001', { waitUntil: 'domcontentloaded' });

    await expect(page.getByText('15')).toBeVisible();
    await expect(page.getByText('3')).toBeVisible();
  });

  test('should record helpfulness feedback', async ({ page }) => {
    const mockData = {
      ...mocks.mockKnowledge.detail,
      helpfulness: { yes: 16, no: 3 }
    };
    await page.route('**/api/v1/knowledge/kb-001', route => {
      if (route.request().method() === 'POST' && route.request().url().includes('/helpfulness')) {
        return route.fulfill({ json: { data: mockData } });
      }
      return route.fulfill({ json: { data: mocks.mockKnowledge.detail } });
    });

    await page.goto('/knowledge/kb-001', { waitUntil: 'domcontentloaded' });

    await page.getByRole('button', { name: 'Yes' }).click();

    // Should show updated count
    await expect(page.getByText('16')).toBeVisible();
  });
});