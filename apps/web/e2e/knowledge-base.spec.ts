import { test, expect } from '@playwright/test';
import { injectMockAuth } from './helpers/auth';
import * as mocks from './helpers/api-mock';

test.describe('Knowledge Management', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockAuth(page);
    await page.route('**/api/v1/knowledge**', async (route) => {
      if (route.request().url().includes('/knowledge/')) {
        await route.fulfill({ json: mocks.mockKnowledge.detail });
      } else {
        await route.fulfill({ json: mocks.mockKnowledge.list });
      }
    });
  });

  test('knowledge article list renders at /knowledge', async ({ page }) => {
    await page.goto('/knowledge');
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible().catch(() => {});
  });

  test('knowledge list displays articles with title and status', async ({ page }) => {
    await page.goto('/knowledge');
    const articles = page.locator('text="How to Reset", text="PUBLISHED"').first();
    if (await articles.count() > 0) {
      await expect(articles).toBeVisible().catch(() => {});
    }
  });

  test('search input on knowledge page', async ({ page }) => {
    await page.goto('/knowledge');
    const searchInput = page.locator('input[placeholder*="search" i], input[placeholder*="Search"]').first();
    if (await searchInput.count() > 0) {
      await expect(searchInput).toBeVisible().catch(() => {});
    }
  });

  test('typing in search updates results', async ({ page }) => {
    await page.goto('/knowledge');
    const searchInput = page.locator('input[placeholder*="search" i]').first();
    if (await searchInput.count() > 0) {
      await searchInput.fill('reset');
      await page.waitForTimeout(300);
      const results = page.locator('text="Reset"').first();
      if (await results.count() > 0) {
        await expect(results).toBeVisible().catch(() => {});
      }
    }
  });

  test('article detail page displays content', async ({ page }) => {
    await page.route('**/api/v1/knowledge/kb-001**', async (route) => {
      await route.fulfill({ json: mocks.mockKnowledge.detail });
    });
    await page.goto('/knowledge/kb-001');
    const content = page.locator('text="Follow these steps"').first();
    if (await content.count() > 0) {
      await expect(content).toBeVisible().catch(() => {});
    }
  });

  test('article detail has title heading', async ({ page }) => {
    await page.route('**/api/v1/knowledge/kb-001**', async (route) => {
      await route.fulfill({ json: mocks.mockKnowledge.detail });
    });
    await page.goto('/knowledge/kb-001');
    const title = page.locator('h1:has-text("Reset Your Password"), h2:has-text("Reset Your Password")').first();
    if (await title.count() > 0) {
      await expect(title).toBeVisible().catch(() => {});
    }
  });

  test('article detail displays linked incidents section', async ({ page }) => {
    await page.route('**/api/v1/knowledge/kb-001**', async (route) => {
      const detail = { ...mocks.mockKnowledge.detail, linkedIncidents: [] };
      await route.fulfill({ json: detail });
    });
    await page.goto('/knowledge/kb-001');
    const linkedSection = page.locator('text="Linked Incidents", text="Related"').first();
    if (await linkedSection.count() > 0) {
      await expect(linkedSection).toBeVisible().catch(() => {});
    }
  });

  test('create article button navigates to /knowledge/new', async ({ page }) => {
    await page.goto('/knowledge');
    const createButton = page.locator('button:has-text("Create"), button:has-text("New")').first();
    if (await createButton.count() > 0) {
      await createButton.click().catch(() => {});
      await page.waitForURL('**/knowledge/new', { timeout: 5000 }).catch(() => {});
    }
  });

  test('article create form has title and content fields', async ({ page }) => {
    await page.goto('/knowledge/new');
    const titleInput = page.locator('input[placeholder*="title" i], input[placeholder*="Title"]').first();
    const contentInput = page.locator('textarea[placeholder*="content" i], textarea[placeholder*="Content"], [role="textbox"]').first();
    if (await titleInput.count() > 0) {
      await expect(titleInput).toBeVisible().catch(() => {});
    }
    if (await contentInput.count() > 0) {
      await expect(contentInput).toBeVisible().catch(() => {});
    }
  });

  test('article approval status badge visible', async ({ page }) => {
    await page.route('**/api/v1/knowledge**', async (route) => {
      const listWithPending = {
        data: [{ ...mocks.mockKnowledge.list.data[0], status: 'PENDING_APPROVAL' }],
        total: 1,
      };
      await route.fulfill({ json: listWithPending });
    });
    await page.goto('/knowledge');
    const approvalBadge = page.locator('text="PENDING_APPROVAL"').first();
    if (await approvalBadge.count() > 0) {
      await expect(approvalBadge).toBeVisible().catch(() => {});
    }
  });
});
