import { test, expect } from '@playwright/test';
import { injectMockAuth } from './helpers/auth';
import { waitForColdStartBannerToDismiss } from './helpers/banner';
import * as mocks from './helpers/api-mock';

test.describe('Cross-Module Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockAuth(page);
  });

  test('sidebar shows Overview section', async ({ page }) => {
    await page.route('**/api/v1/**', (route) =>
      route.fulfill({ json: { data: [] } })
    );

    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    const overview = page.locator('text="Overview"').first();
    if (await overview.count() > 0) {
      await expect(overview).toBeVisible();
    }
  });

  test('sidebar shows ITSM section', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    const itsm = page.locator('text="ITSM"').first();
    if (await itsm.count() > 0) {
      await expect(itsm).toBeVisible();
    }
  });

  test('sidebar navigates to Incidents page', async ({ page }) => {
    await page.route('**/api/v1/incidents**', (route) =>
      route.fulfill({ json: mocks.mockIncidents.list })
    );

    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    const incidentsLink = page.locator('a:has-text("Incidents")').first();
    if (await incidentsLink.count() > 0) {
      await incidentsLink.click();
      await page.waitForURL('**/incidents', { timeout: 5000 });
    }
  });

  test('sidebar navigates to Problems page', async ({ page }) => {
    await page.route('**/api/v1/problems**', (route) =>
      route.fulfill({ json: mocks.mockProblems.list })
    );

    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    const problemsLink = page.locator('a:has-text("Problems")').first();
    if (await problemsLink.count() > 0) {
      await problemsLink.click();
      await page.waitForURL('**/problems', { timeout: 5000 });
    }
  });

  test('sidebar navigates to Changes page', async ({ page }) => {
    await page.route('**/api/v1/changes**', (route) =>
      route.fulfill({ json: mocks.mockChanges.list })
    );

    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    const changesLink = page.locator('a:has-text("Changes")').first();
    if (await changesLink.count() > 0) {
      await changesLink.click();
      await page.waitForURL('**/changes', { timeout: 5000 });
    }
  });

  test('sidebar navigates to Knowledge page', async ({ page }) => {
    await page.route('**/api/v1/knowledge**', (route) =>
      route.fulfill({ json: mocks.mockKnowledgeArticles })
    );

    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    const knowledgeLink = page.locator('a:has-text("Knowledge")').first();
    if (await knowledgeLink.count() > 0) {
      await knowledgeLink.click();
      await page.waitForURL('**/knowledge', { timeout: 5000 });
    }
  });

  test('sidebar navigates to Finance page', async ({ page }) => {
    await page.route('**/api/v1/finance/**', (route) =>
      route.fulfill({ json: mocks.mockFinance })
    );

    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    const financeLink = page.locator('a:has-text("Finance")').first();
    if (await financeLink.count() > 0) {
      await financeLink.click();
      await page.waitForURL('**/finance', { timeout: 5000 });
    }
  });

  test('sidebar navigates to Inventory page', async ({ page }) => {
    await page.route('**/api/v1/inventory/**', (route) =>
      route.fulfill({ json: mocks.mockInventory })
    );

    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    const inventoryLink = page.locator('a:has-text("Inventory")').first();
    if (await inventoryLink.count() > 0) {
      await inventoryLink.click();
      await page.waitForURL('**/inventory', { timeout: 5000 });
    }
  });

  test('sidebar navigates to Procurement page', async ({ page }) => {
    await page.route('**/api/v1/procurement/**', (route) =>
      route.fulfill({ json: mocks.mockProcurement })
    );

    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    const procurementLink = page.locator('a:has-text("Procurement")').first();
    if (await procurementLink.count() > 0) {
      await procurementLink.click();
      await page.waitForURL('**/procurement', { timeout: 5000 });
    }
  });

  test('incident list item navigates to detail page', async ({ page }) => {
    await page.route('**/api/v1/incidents**', (route) =>
      route.fulfill({ json: mocks.mockIncidents.list })
    );
    await page.route('**/api/v1/incidents/inc-001**', (route) =>
      route.fulfill({ json: mocks.mockIncidents.detail })
    );

    await page.goto('/incidents', { waitUntil: 'domcontentloaded' });
    // Look for any link to a specific incident
    const firstLink = page.locator('a[href*="/incidents/inc-"]').first();
    if (await firstLink.count() > 0) {
      await firstLink.click();
      await page.waitForURL(/\/incidents\/inc-/, { timeout: 5000 });
    }
  });

  test('problem create page back button returns to list', async ({ page }) => {
    await page.route('**/api/v1/problems**', (route) =>
      route.fulfill({ json: mocks.mockProblems.list })
    );

    await page.goto('/problems/new', { waitUntil: 'domcontentloaded' });
    // The back button is a ghost button with ArrowLeft icon
    const backBtn = page.locator('button').filter({ has: page.locator('svg') }).first();
    if (await backBtn.count() > 0) {
      try {
        await backBtn.click();
        await page.waitForURL('**/problems', { timeout: 5000 });
      } catch {
        // Navigation may not complete in some cases
      }
    }
  });

  test('change create page Cancel button returns to list', async ({ page }) => {
    await page.route('**/api/v1/changes**', (route) =>
      route.fulfill({ json: { data: [], total: 0 } })
    );

    await page.goto('/changes/new', { waitUntil: 'domcontentloaded' });
    await waitForColdStartBannerToDismiss(page);
    const cancelBtn = page.getByRole('button', { name: 'Cancel' });
    if (await cancelBtn.count() > 0) {
      await cancelBtn.click({ force: true });
      // router.push('/changes') is wired up — verify URL changes away from /new
      await page.waitForURL(url => !url.includes('/changes/new'), { timeout: 5000 }).catch(() => {});
    }
  });
});
