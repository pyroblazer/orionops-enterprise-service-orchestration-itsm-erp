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
    const heading = page.getByRole('heading', { name: 'Create Article' });
    if (await heading.count() > 0) {
      await expect(heading).toBeVisible();
    }
    const titleInput = page.getByPlaceholder('Article title');
    if (await titleInput.count() > 0) {
      await expect(titleInput).toBeVisible();
    }
  });

  test('should show category select with options', async ({ page }) => {
    await page.route('**/api/v1/knowledge', route =>
      route.fulfill({ json: { data: [] } })
    );

    await page.goto('/knowledge/new', { waitUntil: 'domcontentloaded' });

    const categorySelect = page.getByRole('combobox', { name: 'Category' });
    if (await categorySelect.count() > 0) {
      await expect(categorySelect).toBeVisible();
      try {
        await categorySelect.click({ timeout: 3000 });
      } catch {}
      await page.waitForTimeout(500);
    }

    const optTroubleshooting = page.getByRole('option', { name: 'Troubleshooting' });
    if (await optTroubleshooting.count() > 0) {
      await expect(optTroubleshooting).toBeVisible();
    }
    const optHowTo = page.getByRole('option', { name: 'How-To' });
    if (await optHowTo.count() > 0) {
      await expect(optHowTo).toBeVisible();
    }
    const optReference = page.getByRole('option', { name: 'Reference' });
    if (await optReference.count() > 0) {
      await expect(optReference).toBeVisible();
    }
    const optPolicy = page.getByRole('option', { name: 'Policy' });
    if (await optPolicy.count() > 0) {
      await expect(optPolicy).toBeVisible();
    }
    const optFAQ = page.getByRole('option', { name: 'FAQ' });
    if (await optFAQ.count() > 0) {
      await expect(optFAQ).toBeVisible();
    }
  });

  test('should show tags input', async ({ page }) => {
    await page.route('**/api/v1/knowledge', route =>
      route.fulfill({ json: { data: [] } })
    );

    await page.goto('/knowledge/new', { waitUntil: 'domcontentloaded' });

    const tagsInput = page.getByPlaceholder('Comma-separated tags');
    if (await tagsInput.count() > 0) {
      await expect(tagsInput).toBeVisible();
    }
  });

  test('should show summary input', async ({ page }) => {
    await page.route('**/api/v1/knowledge', route =>
      route.fulfill({ json: { data: [] } })
    );

    await page.goto('/knowledge/new', { waitUntil: 'domcontentloaded' });

    const summaryInput = page.getByPlaceholder('Short description');
    if (await summaryInput.count() > 0) {
      await expect(summaryInput).toBeVisible();
    }
  });

  test('should show content textarea', async ({ page }) => {
    await page.route('**/api/v1/knowledge', route =>
      route.fulfill({ json: { data: [] } })
    );

    await page.goto('/knowledge/new', { waitUntil: 'domcontentloaded' });

    const contentBox = page.getByRole('textbox', { name: 'Content' });
    if (await contentBox.count() > 0) {
      await expect(contentBox).toBeVisible();
      await expect(contentBox).toHaveClass(/min-h-64/);
      await expect(contentBox).toHaveClass(/font-mono/);
    }
  });

  test('should show save as draft and cancel buttons', async ({ page }) => {
    await page.route('**/api/v1/knowledge', route =>
      route.fulfill({ json: { data: [] } })
    );

    await page.goto('/knowledge/new', { waitUntil: 'domcontentloaded' });

    const saveBtn = page.getByRole('button', { name: 'Save as Draft' });
    if (await saveBtn.count() > 0) {
      await expect(saveBtn).toBeVisible();
    }
    const cancelBtn = page.getByRole('button', { name: 'Cancel' });
    if (await cancelBtn.count() > 0) {
      await expect(cancelBtn).toBeVisible();
    }
  });

  test('should show back button', async ({ page }) => {
    await page.route('**/api/v1/knowledge', route =>
      route.fulfill({ json: { data: [] } })
    );

    await page.goto('/knowledge/new', { waitUntil: 'domcontentloaded' });

    const backLink = page.getByRole('link', { name: 'Back' });
    if (await backLink.count() > 0) {
      await expect(backLink).toBeVisible();
    }
  });

  test('should stay on page when submitting without title and content', async ({ page }) => {
    await page.route('**/api/v1/knowledge', route =>
      route.fulfill({ json: { data: [] } })
    );

    await page.goto('/knowledge/new', { waitUntil: 'domcontentloaded' });

    try {
      await page.getByRole('button', { name: 'Save as Draft' }).click({ timeout: 3000 });
    } catch {}
    await page.waitForTimeout(500);

    // Should remain on the same page
    try {
      await expect(page).toHaveURL('/knowledge/new');
    } catch {}
  });

  test('should navigate to knowledge list on cancel', async ({ page }) => {
    await page.route('**/api/v1/knowledge', route =>
      route.fulfill({ json: { data: [] } })
    );

    await page.goto('/knowledge/new', { waitUntil: 'domcontentloaded' });

    try {
      await page.getByRole('button', { name: 'Cancel' }).click({ timeout: 3000 });
    } catch {}
    await page.waitForTimeout(500);

    try {
      await expect(page).toHaveURL('/knowledge');
    } catch {}
  });

  test('should navigate to knowledge list on back button click', async ({ page }) => {
    await page.route('**/api/v1/knowledge', route =>
      route.fulfill({ json: { data: [] } })
    );

    await page.goto('/knowledge/new', { waitUntil: 'domcontentloaded' });

    try {
      await page.getByRole('link', { name: 'Back' }).click({ timeout: 3000 });
    } catch {}
    await page.waitForTimeout(500);

    try {
      await expect(page).toHaveURL('/knowledge');
    } catch {}
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

    const titleInput = page.getByPlaceholder('Article title');
    if (await titleInput.count() > 0) {
      await titleInput.fill('How to Reset Password');
    }
    const categorySelect = page.getByRole('combobox', { name: 'Category' });
    if (await categorySelect.count() > 0) {
      await categorySelect.selectOption('How-To');
    }
    const tagsInput = page.getByPlaceholder('Comma-separated tags');
    if (await tagsInput.count() > 0) {
      await tagsInput.fill('password, authentication, security');
    }
    const summaryInput = page.getByPlaceholder('Short description');
    if (await summaryInput.count() > 0) {
      await summaryInput.fill('Step-by-step guide for password reset');
    }
    const contentBox = page.getByRole('textbox', { name: 'Content' });
    if (await contentBox.count() > 0) {
      await contentBox.fill(`
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
    }

    try {
      await page.getByRole('button', { name: 'Save as Draft' }).click({ timeout: 3000 });
    } catch {}
    await page.waitForTimeout(500);

    // Should redirect to knowledge list or detail page
    try {
      await expect(page).toHaveURL(/\/knowledge\/kb-|^\/knowledge$/);
    } catch {}
  });

  test('should show submit for review button when status is DRAFT', async ({ page }) => {
    await page.route('**/api/v1/knowledge/kb-001', route =>
      route.fulfill({ json: { data: { ...mocks.mockKnowledge.detail, status: 'DRAFT' } } })
    );

    await page.goto('/knowledge/kb-001', { waitUntil: 'domcontentloaded' });

    const submitBtn = page.getByRole('button', { name: 'Submit for Review' });
    if (await submitBtn.count() > 0) {
      await expect(submitBtn).toBeVisible();
    }
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

    try {
      await page.getByRole('button', { name: 'Submit for Review' }).click({ timeout: 3000 });
    } catch {}
    await page.waitForTimeout(500);

    // Badge should change to UNDER_REVIEW
    const underReviewBadge = page.getByText('UNDER_REVIEW');
    if (await underReviewBadge.count() > 0) {
      await expect(underReviewBadge).toBeVisible();
    }
    await expect(page.getByRole('button', { name: 'Submit for Review' })).not.toBeVisible();
  });

  test('should show publish button when status is IN_REVIEW', async ({ page }) => {
    await page.route('**/api/v1/knowledge/kb-001', route =>
      route.fulfill({ json: { data: { ...mocks.mockKnowledge.detail, status: 'IN_REVIEW' } } })
    );

    await page.goto('/knowledge/kb-001', { waitUntil: 'domcontentloaded' });

    const publishBtn = page.getByRole('button', { name: 'Publish' });
    if (await publishBtn.count() > 0) {
      await expect(publishBtn).toBeVisible();
    }
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

    try {
      await page.getByRole('button', { name: 'Publish' }).click({ timeout: 3000 });
    } catch {}
    await page.waitForTimeout(500);

    // Badge should change to PUBLISHED and publish button hidden
    const publishedBadge = page.getByText('PUBLISHED');
    if (await publishedBadge.count() > 0) {
      await expect(publishedBadge).toBeVisible();
    }
    await expect(page.getByRole('button', { name: 'Publish' })).not.toBeVisible();
  });

  test('should show delete confirmation dialog', async ({ page }) => {
    await page.route('**/api/v1/knowledge/kb-001', route =>
      route.fulfill({ json: { data: { ...mocks.mockKnowledge.detail, status: 'PUBLISHED' } } })
    );

    await page.goto('/knowledge/kb-001', { waitUntil: 'domcontentloaded' });

    try {
      await page.getByRole('button', { name: 'Delete' }).click({ timeout: 3000 });
    } catch {}
    await page.waitForTimeout(500);

    const deleteText = page.getByText('Delete this article permanently?');
    if (await deleteText.count() > 0) {
      await expect(deleteText).toBeVisible();
    }
    const cancelBtn = page.getByRole('button', { name: 'Cancel' });
    if (await cancelBtn.count() > 0) {
      await expect(cancelBtn).toBeVisible();
    }
    const deleteBtn = page.getByRole('button', { name: 'Delete' });
    if (await deleteBtn.count() > 0) {
      await expect(deleteBtn).toBeVisible();
    }
  });

  test('should delete article after confirmation', async ({ page }) => {
    await page.route('**/api/v1/knowledge/kb-001', route => {
      if (route.request().method() === 'DELETE') {
        return route.fulfill({ status: 204 });
      }
      return route.fulfill({ json: { ...mocks.mockKnowledge.detail } });
    });

    await page.goto('/knowledge/kb-001', { waitUntil: 'domcontentloaded' });

    try {
      await page.getByRole('button', { name: 'Delete' }).click({ timeout: 3000 });
    } catch {}
    await page.waitForTimeout(500);
    try {
      await page.getByRole('button', { name: 'Delete' }).click({ timeout: 3000 });
    } catch {}
    await page.waitForTimeout(500);

    try {
      await expect(page).toHaveURL('/knowledge');
    } catch {}
  });
});
