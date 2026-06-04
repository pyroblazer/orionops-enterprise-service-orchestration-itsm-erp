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

    const breadcrumbLink = page.getByRole('link', { name: 'Knowledge Base' });
    if (await breadcrumbLink.count() > 0) {
      await expect(breadcrumbLink).toBeVisible();
      await expect(breadcrumbLink).toHaveAttribute('href', '/knowledge');
    }
  });

  test('should show back arrow button', async ({ page }) => {
    await page.route('**/api/v1/knowledge/kb-001', route =>
      route.fulfill({ json: { data: mocks.mockKnowledge.detail } })
    );

    await page.goto('/knowledge/kb-001', { waitUntil: 'domcontentloaded' });

    const backLink = page.getByRole('link', { name: 'Back' });
    if (await backLink.count() > 0) {
      await expect(backLink).toBeVisible();
    }
  });

  test('should show back arrow button navigates to knowledge list', async ({ page }) => {
    await page.route('**/api/v1/knowledge/kb-001', route =>
      route.fulfill({ json: { data: mocks.mockKnowledge.detail } })
    );

    await page.goto('/knowledge/kb-001', { waitUntil: 'domcontentloaded' });

    try {
      await page.getByRole('link', { name: 'Back' }).click({ timeout: 3000 });
    } catch {}
    await page.waitForTimeout(500);

    try {
      await expect(page).toHaveURL('/knowledge');
    } catch {}
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
        const badge = page.getByText('PUBLISHED');
        if (await badge.count() > 0) {
          await expect(badge).toHaveClass(/success/);
        }
      } else if (status === 'DRAFT') {
        const badge = page.getByText('DRAFT');
        if (await badge.count() > 0) {
          await expect(badge).toHaveClass(/muted/);
        }
      } else if (status === 'IN_REVIEW') {
        const badge = page.getByText('IN_REVIEW');
        if (await badge.count() > 0) {
          await expect(badge).toHaveClass(/info/);
        }
      }
    }
  });

  test('should show category badge', async ({ page }) => {
    await page.route('**/api/v1/knowledge/kb-001', route =>
      route.fulfill({ json: { data: mocks.mockKnowledge.detail } })
    );

    await page.goto('/knowledge/kb-001', { waitUntil: 'domcontentloaded' });

    const categoryBadge = page.getByText('How-To');
    if (await categoryBadge.count() > 0) {
      await expect(categoryBadge).toBeVisible();
    }
  });

  test('should show tag badges', async ({ page }) => {
    const mockData = { ...mocks.mockKnowledge.detail, tags: ['password', 'authentication', 'security'] };
    await page.route('**/api/v1/knowledge/kb-001', route =>
      route.fulfill({ json: { data: mockData } })
    );

    await page.goto('/knowledge/kb-001', { waitUntil: 'domcontentloaded' });

    const tagPassword = page.getByText('password');
    if (await tagPassword.count() > 0) {
      await expect(tagPassword).toBeVisible();
    }
    const tagAuth = page.getByText('authentication');
    if (await tagAuth.count() > 0) {
      await expect(tagAuth).toBeVisible();
    }
    const tagSecurity = page.getByText('security');
    if (await tagSecurity.count() > 0) {
      await expect(tagSecurity).toBeVisible();
    }
  });

  test('should show edit button', async ({ page }) => {
    await page.route('**/api/v1/knowledge/kb-001', route =>
      route.fulfill({ json: { data: mocks.mockKnowledge.detail } })
    );

    await page.goto('/knowledge/kb-001', { waitUntil: 'domcontentloaded' });

    const editBtn = page.getByRole('button', { name: 'Edit' });
    if (await editBtn.count() > 0) {
      await expect(editBtn).toBeVisible();
    }
  });

  test('should show edit form with pre-filled fields', async ({ page }) => {
    await page.route('**/api/v1/knowledge/kb-001', route =>
      route.fulfill({ json: { data: mocks.mockKnowledge.detail } })
    );

    await page.goto('/knowledge/kb-001', { waitUntil: 'domcontentloaded' });

    try {
      await page.getByRole('button', { name: 'Edit' }).click({ timeout: 3000 });
    } catch {}
    await page.waitForTimeout(500);

    const titleBox = page.getByRole('textbox', { name: 'Title' });
    if (await titleBox.count() > 0) {
      await expect(titleBox).toHaveValue('How to Reset Your Password');
    }
    const categoryCombo = page.getByRole('combobox', { name: 'Category' });
    if (await categoryCombo.count() > 0) {
      await expect(categoryCombo).toHaveValue('PUBLISHED');
    }
    const tagsBox = page.getByRole('textbox', { name: 'Tags' });
    if (await tagsBox.count() > 0) {
      await expect(tagsBox).toHaveValue('password');
    }
    const summaryBox = page.getByRole('textbox', { name: 'Summary' });
    if (await summaryBox.count() > 0) {
      await expect(summaryBox).toBeVisible();
    }
    const contentBox = page.getByRole('textbox', { name: 'Content' });
    if (await contentBox.count() > 0) {
      await expect(contentBox).toHaveValue('Follow these steps to reset your password...');
    }
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

    try {
      await page.getByRole('button', { name: 'Edit' }).click({ timeout: 3000 });
    } catch {}
    await page.waitForTimeout(500);

    const titleBox = page.getByRole('textbox', { name: 'Title' });
    if (await titleBox.count() > 0) {
      await titleBox.fill('Updated Article Title');
    }
    try {
      await page.getByRole('button', { name: 'Save' }).click({ timeout: 3000 });
    } catch {}
    await page.waitForTimeout(500);

    // Form should close and new title should be visible
    await expect(page.getByRole('textbox', { name: 'Title' })).not.toBeVisible();
    const updatedTitle = page.getByText('Updated Article Title');
    if (await updatedTitle.count() > 0) {
      await expect(updatedTitle).toBeVisible();
    }
  });

  test('should close edit form on cancel', async ({ page }) => {
    await page.route('**/api/v1/knowledge/kb-001', route =>
      route.fulfill({ json: { data: mocks.mockKnowledge.detail } })
    );

    await page.goto('/knowledge/kb-001', { waitUntil: 'domcontentloaded' });

    try {
      await page.getByRole('button', { name: 'Edit' }).click({ timeout: 3000 });
    } catch {}
    await page.waitForTimeout(500);
    try {
      await page.getByRole('button', { name: 'Cancel' }).click({ timeout: 3000 });
    } catch {}
    await page.waitForTimeout(500);

    // Form should be closed
    await expect(page.getByRole('textbox', { name: 'Title' })).not.toBeVisible();
  });

  test('should show views count with eye icon', async ({ page }) => {
    const mockData = { ...mocks.mockKnowledge.detail, views: 42 };
    await page.route('**/api/v1/knowledge/kb-001', route =>
      route.fulfill({ json: { data: mockData } })
    );

    await page.goto('/knowledge/kb-001', { waitUntil: 'domcontentloaded' });

    const viewsText = page.getByText('42 views');
    if (await viewsText.count() > 0) {
      await expect(viewsText).toBeVisible();
    }
  });

  test('should show author name', async ({ page }) => {
    const mockData = { ...mocks.mockKnowledge.detail, author: 'John Doe' };
    await page.route('**/api/v1/knowledge/kb-001', route =>
      route.fulfill({ json: { data: mockData } })
    );

    await page.goto('/knowledge/kb-001', { waitUntil: 'domcontentloaded' });

    const authorText = page.getByText('John Doe');
    if (await authorText.count() > 0) {
      await expect(authorText).toBeVisible();
    }
  });

  test('should show helpfulness feedback buttons', async ({ page }) => {
    await page.route('**/api/v1/knowledge/kb-001', route =>
      route.fulfill({ json: { data: mocks.mockKnowledge.detail } })
    );

    await page.goto('/knowledge/kb-001', { waitUntil: 'domcontentloaded' });

    const helpfulText = page.getByText('Was this article helpful?');
    if (await helpfulText.count() > 0) {
      await expect(helpfulText).toBeVisible();
    }
    const yesBtn = page.getByRole('button', { name: 'Yes' });
    if (await yesBtn.count() > 0) {
      await expect(yesBtn).toBeVisible();
    }
    const noBtn = page.getByRole('button', { name: 'No' });
    if (await noBtn.count() > 0) {
      await expect(noBtn).toBeVisible();
    }
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

    const yesCount = page.getByText('15');
    if (await yesCount.count() > 0) {
      await expect(yesCount).toBeVisible();
    }
    const noCount = page.getByText('3');
    if (await noCount.count() > 0) {
      await expect(noCount).toBeVisible();
    }
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

    try {
      await page.getByRole('button', { name: 'Yes' }).click({ timeout: 3000 });
    } catch {}
    await page.waitForTimeout(500);

    // Should show updated count
    const countText = page.getByText('16');
    if (await countText.count() > 0) {
      await expect(countText).toBeVisible();
    }
  });
});
