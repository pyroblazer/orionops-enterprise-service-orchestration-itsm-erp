import { test, expect } from '@playwright/test';
import { injectMockAuth } from './helpers/auth';
import * as mocks from './helpers/api-mock';

test.describe('Knowledge Create', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockAuth(page);
  });

  test('should render knowledge creation page', async ({ page }) => {
    await page.route('**/api/v1/knowledge', route =>
      route.fulfill({ json: { data: [] } })
    );

    await page.goto('/knowledge/new', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Create Article' })).toBeVisible();
    await expect(page.getByPlaceholder('Article title')).toBeVisible();
  });

  test('should show category select with options', async ({ page }) => {
    await page.route('**/api/v1/knowledge', route =>
      route.fulfill({ json: { data: [] } })
    );

    await page.goto('/knowledge/new', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('combobox', { name: 'Category' })).toBeVisible();
    const categorySelect = page.getByRole('combobox', { name: 'Category' });
    await categorySelect.click();

    await expect(page.getByRole('option', { name: 'Troubleshooting' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'How-To' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Reference' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Policy' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'FAQ' })).toBeVisible();
  });

  test('should show tags input', async ({ page }) => {
    await page.route('**/api/v1/knowledge', route =>
      route.fulfill({ json: { data: [] } })
    );

    await page.goto('/knowledge/new', { waitUntil: 'domcontentloaded' });

    await expect(page.getByPlaceholder('Comma-separated tags')).toBeVisible();
  });

  test('should show summary input', async ({ page }) => {
    await page.route('**/api/v1/knowledge', route =>
      route.fulfill({ json: { data: [] } })
    );

    await page.goto('/knowledge/new', { waitUntil: 'domcontentloaded' });

    await expect(page.getByPlaceholder('Short description')).toBeVisible();
  });

  test('should show content textarea', async ({ page }) => {
    await page.route('**/api/v1/knowledge', route =>
      route.fulfill({ json: { data: [] } })
    );

    await page.goto('/knowledge/new', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('textbox', { name: 'Content' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Content' })).toHaveClass(/min-h-64/);
    await expect(page.getByRole('textbox', { name: 'Content' })).toHaveClass(/font-mono/);
  });

  test('should show save as draft and cancel buttons', async ({ page }) => {
    await page.route('**/api/v1/knowledge', route =>
      route.fulfill({ json: { data: [] } })
    );

    await page.goto('/knowledge/new', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('button', { name: 'Save as Draft' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
  });

  test('should show back button', async ({ page }) => {
    await page.route('**/api/v1/knowledge', route =>
      route.fulfill({ json: { data: [] } })
    );

    await page.goto('/knowledge/new', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('link', { name: 'Back' })).toBeVisible();
  });

  test('should stay on page when submitting without title and content', async ({ page }) => {
    await page.route('**/api/v1/knowledge', route =>
      route.fulfill({ json: { data: [] } })
    );

    await page.goto('/knowledge/new', { waitUntil: 'domcontentloaded' });

    await page.getByRole('button', { name: 'Save as Draft' }).click();

    // Should remain on the same page
    await expect(page).toHaveURL('/knowledge/new');
  });

  test('should navigate to knowledge list on cancel', async ({ page }) => {
    await page.route('**/api/v1/knowledge', route =>
      route.fulfill({ json: { data: [] } })
    );

    await page.goto('/knowledge/new', { waitUntil: 'domcontentloaded' });

    await page.getByRole('button', { name: 'Cancel' }).click();

    await expect(page).toHaveURL('/knowledge');
  });

  test('should navigate to knowledge list on back button click', async ({ page }) => {
    await page.route('**/api/v1/knowledge', route =>
      route.fulfill({ json: { data: [] } })
    );

    await page.goto('/knowledge/new', { waitUntil: 'domcontentloaded' });

    await page.getByRole('link', { name: 'Back' }).click();

    await expect(page).toHaveURL('/knowledge');
  });

  test('should create knowledge article with all fields', async ({ page }) => {
    await page.route('**/api/v1/knowledge', async (route) => {
      if (route.request().method() === 'POST') {
        const data = route.request().postData();
        const parsed = JSON.parse(data as string);
        return route.fulfill({
          json: { data: { id: 'kb-new', ...parsed, status: 'DRAFT', createdAt: new Date().toISOString() } }
        });
      }
      return route.fulfill({ json: { data: [] } });
    });

    await page.goto('/knowledge/new', { waitUntil: 'domcontentloaded' });

    await page.getByPlaceholder('Article title').fill('How to Reset Password');
    await page.getByRole('combobox', { name: 'Category' }).selectOption('How-To');
    await page.getByPlaceholder('Comma-separated tags').fill('password, authentication, security');
    await page.getByPlaceholder('Short description').fill('Step-by-step guide for password reset');
    await page.getByRole('textbox', { name: 'Content' }).fill(`
# How to Reset Password

## Overview
This guide explains how to reset your password if you've forgotten it.

## Steps
1. Click on "Forgot Password" link on login page
2. Enter your email address
3. Check your email for reset instructions
4. Follow the link in the email
5. Create a new password
6. Confirm your new password

## Troubleshooting
- Make sure you enter the email associated with your account
- Check your spam folder if you don't see the email
- Contact support if you continue to have issues
    `.trim());

    await page.getByRole('button', { name: 'Save as Draft' }).click();

    // Should redirect to knowledge list or detail page
    await expect(page).toHaveURL(/\/knowledge\/kb-|^\/knowledge$/);
  });

  test('should show submit for review button when status is DRAFT', async ({ page }) => {
    await page.route('**/api/v1/knowledge/kb-001', route =>
      route.fulfill({ json: { data: { ...mocks.mockKnowledge.detail, status: 'DRAFT' } } })
    );

    await page.goto('/knowledge/kb-001', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('button', { name: 'Submit for Review' })).toBeVisible();
  });

  test('should submit article for review', async ({ page }) => {
    const mockData = { ...mocks.mockKnowledge.detail, status: 'IN_REVIEW' };
    await page.route('**/api/v1/knowledge/kb-001', route => {
      if (route.request().method() === 'PATCH') {
        return route.fulfill({ json: { data: mockData } });
      }
      return route.fulfill({ json: { ...mocks.mockKnowledge.detail, status: 'DRAFT' } });
    });

    await page.goto('/knowledge/kb-001', { waitUntil: 'domcontentloaded' });

    await page.getByRole('button', { name: 'Submit for Review' }).click();

    // Badge should change to UNDER_REVIEW
    await expect(page.getByText('UNDER_REVIEW')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Submit for Review' })).not.toBeVisible();
  });

  test('should show publish button when status is IN_REVIEW', async ({ page }) => {
    await page.route('**/api/v1/knowledge/kb-001', route =>
      route.fulfill({ json: { data: { ...mocks.mockKnowledge.detail, status: 'IN_REVIEW' } } })
    );

    await page.goto('/knowledge/kb-001', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('button', { name: 'Publish' })).toBeVisible();
  });

  test('should publish article', async ({ page }) => {
    const mockData = { ...mocks.mockKnowledge.detail, status: 'PUBLISHED' };
    await page.route('**/api/v1/knowledge/kb-001', route => {
      if (route.request().method() === 'PATCH') {
        return route.fulfill({ json: { data: mockData } });
      }
      return route.fulfill({ json: { ...mocks.mockKnowledge.detail, status: 'IN_REVIEW' } });
    });

    await page.goto('/knowledge/kb-001', { waitUntil: 'domcontentloaded' });

    await page.getByRole('button', { name: 'Publish' }).click();

    // Badge should change to PUBLISHED and publish button hidden
    await expect(page.getByText('PUBLISHED')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Publish' })).not.toBeVisible();
  });

  test('should show delete confirmation dialog', async ({ page }) => {
    await page.route('**/api/v1/knowledge/kb-001', route =>
      route.fulfill({ json: { data: { ...mocks.mockKnowledge.detail, status: 'PUBLISHED' } } })
    );

    await page.goto('/knowledge/kb-001', { waitUntil: 'domcontentloaded' });

    await page.getByRole('button', { name: 'Delete' }).click();

    await expect(page.getByText('Delete this article permanently?')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Delete' })).toBeVisible();
  });

  test('should delete article after confirmation', async ({ page }) => {
    await page.route('**/api/v1/knowledge/kb-001', route => {
      if (route.request().method() === 'DELETE') {
        return route.fulfill({ status: 204 });
      }
      return route.fulfill({ json: { ...mocks.mockKnowledge.detail } });
    });

    await page.goto('/knowledge/kb-001', { waitUntil: 'domcontentloaded' });

    await page.getByRole('button', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'Delete' }).click();

    await expect(page).toHaveURL('/knowledge');
  });
});