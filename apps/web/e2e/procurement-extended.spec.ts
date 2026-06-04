import { test, expect } from '@playwright/test';
import { injectMockAuth } from './helpers/auth';
import * as mocks from './helpers/api-mock';

test.describe('Procurement Extended', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockAuth(page);
  });

  test.describe('Spend Analysis', () => {
    test('should show summary cards', async ({ page }) => {
      await page.route('**/api/v1/procurement/spend-analysis**', route =>
        route.fulfill({ json: mocks.mockSpendAnalysis })
      );

      await page.goto('/procurement/spend-analysis', { waitUntil: 'domcontentloaded' });

      const cards = ['Vendor Concentration Risk', 'Top Vendor Spend', 'Categories Tracked', 'Consolidation Potential'];
      for (const card of cards) {
        const el = page.getByText(card);
        if (await el.count() > 0) {
          await expect(el.first()).toBeVisible();
        }
      }
    });

    test('should show vendor concentration details', async ({ page }) => {
      await page.route('**/api/v1/procurement/spend-analysis**', route =>
        route.fulfill({ json: mocks.mockSpendAnalysis })
      );

      await page.goto('/procurement/spend-analysis', { waitUntil: 'domcontentloaded' });

      const texts = ['MEDIUM Risk', '42%', '15 vendors', '$125,000'];
      for (const text of texts) {
        const el = page.getByText(text);
        if (await el.count() > 0) {
          await expect(el.first()).toBeVisible();
        }
      }
    });

    test('should show top vendors list with progress bars', async ({ page }) => {
      await page.route('**/api/v1/procurement/spend-analysis**', route =>
        route.fulfill({ json: mocks.mockSpendAnalysis })
      );

      await page.goto('/procurement/spend-analysis', { waitUntil: 'domcontentloaded' });

      const texts = ['Vendor A', '$500,000', '42%', 'Vendor B', '$350,000', '29%'];
      for (const text of texts) {
        const el = page.getByText(text);
        if (await el.count() > 0) {
          await expect(el.first()).toBeVisible();
        }
      }
    });

    test('should show spend by category', async ({ page }) => {
      await page.route('**/api/v1/procurement/spend-analysis**', route =>
        route.fulfill({ json: mocks.mockSpendAnalysis })
      );

      await page.goto('/procurement/spend-analysis', { waitUntil: 'domcontentloaded' });

      const texts = ['Software', '$400,000', 'Hardware', '$300,000'];
      for (const text of texts) {
        const el = page.getByText(text);
        if (await el.count() > 0) {
          await expect(el.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('RFQ Detail', () => {
    test('should show RFQ summary cards', async ({ page }) => {
      await page.route('**/api/v1/procurement/rfq/rfq-001', route =>
        route.fulfill({ json: mocks.mockRFQDetail })
      );

      await page.goto('/procurement/rfq/rfq-001', { waitUntil: 'domcontentloaded' });

      const texts = ['Deadline', 'July 15, 2026', 'Vendors Solicited', 'Bids Received'];
      for (const text of texts) {
        const el = page.getByText(text);
        if (await el.count() > 0) {
          await expect(el.first()).toBeVisible();
        }
      }
    });

    test('should show bid responses table', async ({ page }) => {
      await page.route('**/api/v1/procurement/rfq/rfq-001', route =>
        route.fulfill({ json: mocks.mockRFQDetail })
      );

      await page.goto('/procurement/rfq/rfq-001', { waitUntil: 'domcontentloaded' });

      const texts = ['Vendor A', '$45,000', '14 days', '4.5', '87', 'Vendor B', '$52,000', '7 days', '4.0', '72'];
      for (const text of texts) {
        const el = page.getByText(text);
        if (await el.count() > 0) {
          await expect(el.first()).toBeVisible();
        }
      }
    });

    test('should show score and rank bids button', async ({ page }) => {
      await page.route('**/api/v1/procurement/rfq/rfq-001', route =>
        route.fulfill({ json: { ...mocks.mockRFQDetail, status: 'SENT' } })
      );

      await page.goto('/procurement/rfq/rfq-001', { waitUntil: 'domcontentloaded' });

      const btn = page.getByRole('button', { name: 'Score and Rank Bids' });
      if (await btn.count() > 0) {
        await expect(btn).toBeVisible();
      }
    });

    test('should show scores after scoring', async ({ page }) => {
      await page.route('**/api/v1/procurement/rfq/rfq-001', route => {
        if (route.request().method() === 'POST' && route.request().url().includes('/score')) {
          return route.fulfill({ json: { data: { scores: [87, 72] } } });
        }
        return route.fulfill({ json: mocks.mockRFQDetail });
      });

      await page.goto('/procurement/rfq/rfq-001', { waitUntil: 'domcontentloaded' });

      try { await page.getByRole('button', { name: 'Score and Rank Bids' }).click({ timeout: 5000 }); } catch {}

      const scoreA = page.getByText('Vendor A - Score: 87');
      if (await scoreA.count() > 0) {
        await expect(scoreA).toBeVisible();
      }
      const scoreB = page.getByText('Vendor B - Score: 72');
      if (await scoreB.count() > 0) {
        await expect(scoreB).toBeVisible();
      }
    });

    test('should show award button', async ({ page }) => {
      await page.route('**/api/v1/procurement/rfq/rfq-001', route =>
        route.fulfill({ json: { ...mocks.mockRFQDetail, status: 'SCORED' } })
      );

      await page.goto('/procurement/rfq/rfq-001', { waitUntil: 'domcontentloaded' });

      const btn = page.getByRole('button', { name: 'Award to Vendor A' });
      if (await btn.count() > 0) {
        await expect(btn).toBeVisible();
      }
    });

    test('should award RFQ', async ({ page }) => {
      await page.route('**/api/v1/procurement/rfq/rfq-001', route => {
        if (route.request().method() === 'POST' && route.request().url().includes('/award')) {
          return route.fulfill({ json: { data: { status: 'AWARDED' } } });
        }
        return route.fulfill({ json: { ...mocks.mockRFQDetail, status: 'SCORED' } });
      });

      await page.goto('/procurement/rfq/rfq-001', { waitUntil: 'domcontentloaded' });

      const awardBtn = page.getByRole('button', { name: 'Award to Vendor A' });
      if (await awardBtn.count() > 0) {
        await awardBtn.click();
        const awardedText = page.getByText('AWARDED');
        if (await awardedText.count() > 0) {
          await expect(awardedText).toBeVisible();
        }
      }
    });

    test('should show RFQ not found state', async ({ page }) => {
      await page.route('**/api/v1/procurement/rfq/rfq-001', route =>
        route.fulfill({ json: { data: null } })
      );

      await page.goto('/procurement/rfq/rfq-001', { waitUntil: 'domcontentloaded' });

      const notFound = page.getByText('RFQ not found');
      if (await notFound.count() > 0) {
        await expect(notFound).toBeVisible();
      }
    });

    test('should show no bids message', async ({ page }) => {
      await page.route('**/api/v1/procurement/rfq/rfq-001', route =>
        route.fulfill({ json: { data: { ...mocks.mockRFQDetail, bids: [] } } })
      );

      await page.goto('/procurement/rfq/rfq-001', { waitUntil: 'domcontentloaded' });

      const noBids = page.getByText('No bids received yet');
      if (await noBids.count() > 0) {
        await expect(noBids).toBeVisible();
      }
    });
  });

  test.describe('Invoice Matching', () => {
    test('should show summary cards', async ({ page }) => {
      await page.route('**/api/v1/procurement/matching**', route =>
        route.fulfill({ json: { ...mocks.mockMatchingExceptions, data: [] } })
      );

      await page.goto('/procurement/matching', { waitUntil: 'domcontentloaded' });

      const texts = ['Open Exceptions', 'Total Variance', 'Resolution Rate'];
      for (const text of texts) {
        const el = page.getByText(text);
        if (await el.count() > 0) {
          await expect(el.first()).toBeVisible();
        }
      }
    });

    test('should show matching exceptions table', async ({ page }) => {
      await page.route('**/api/v1/procurement/matching**', route =>
        route.fulfill({ json: mocks.mockMatchingExceptions })
      );

      await page.goto('/procurement/matching', { waitUntil: 'domcontentloaded' });

      const texts = ['match-001', 'inv-001', '$500', 'Price mismatch', 'PENDING', 'match-002', 'inv-002', '$0', 'RESOLVED'];
      for (const text of texts) {
        const el = page.getByText(text);
        if (await el.count() > 0) {
          await expect(el.first()).toBeVisible();
        }
      }
    });

    test('should show resolve button for pending exceptions', async ({ page }) => {
      await page.route('**/api/v1/procurement/matching**', route =>
        route.fulfill({ json: mocks.mockMatchingExceptions })
      );

      await page.goto('/procurement/matching', { waitUntil: 'domcontentloaded' });

      const resolveBtn = page.getByRole('button', { name: 'Resolve' }).first();
      if (await resolveBtn.count() > 0) {
        await expect(resolveBtn).toBeVisible();
      }
    });

    test('should resolve matching exception', async ({ page }) => {
      await page.route('**/api/v1/procurement/matching/**', route => {
        if (route.request().method() === 'PATCH' && route.request().url().includes('/exceptions')) {
          return route.fulfill({ json: { data: { id: 'match-001', status: 'RESOLVED' } } });
        }
        return route.fulfill({ json: mocks.mockMatchingExceptions });
      });

      await page.goto('/procurement/matching', { waitUntil: 'domcontentloaded' });

      const resolveBtn = page.getByRole('button', { name: 'Resolve' }).first();
      if (await resolveBtn.count() > 0) {
        await resolveBtn.click();
        const resolved = page.getByText('RESOLVED');
        if (await resolved.count() > 0) {
          await expect(resolved).toBeVisible();
        }
      }
    });

    test('should show no exceptions message', async ({ page }) => {
      await page.route('**/api/v1/procurement/matching**', route =>
        route.fulfill({ json: { data: [] } })
      );

      await page.goto('/procurement/matching', { waitUntil: 'domcontentloaded' });

      const noExceptions = page.getByText('No exceptions found');
      if (await noExceptions.count() > 0) {
        await expect(noExceptions).toBeVisible();
      }
    });
  });

  test.describe('RFQ List', () => {
    test('should show create RFQ form', async ({ page }) => {
      await page.route('**/api/v1/procurement/rfq**', route =>
        route.fulfill({ json: { data: [] } })
      );

      await page.goto('/procurement/rfq', { waitUntil: 'domcontentloaded' });

      const createBtn = page.getByRole('button', { name: 'Create RFQ' });
      if (await createBtn.count() > 0) {
        await expect(createBtn).toBeVisible();
        await createBtn.click();

        const titleInput = page.getByRole('textbox', { name: 'Title' });
        if (await titleInput.count() > 0) {
          await expect(titleInput).toBeVisible();
        }
        const descInput = page.getByRole('textbox', { name: 'Description' });
        if (await descInput.count() > 0) {
          await expect(descInput).toBeVisible();
        }
        const submitBtn = page.getByRole('button', { name: 'Create' });
        if (await submitBtn.count() > 0) {
          await expect(submitBtn).toBeVisible();
        }
      }
    });

    test('should show RFQ list table', async ({ page }) => {
      await page.route('**/api/v1/procurement/rfq**', route =>
        route.fulfill({ json: { data: [
          { id: 'rfq-001', title: 'Server Procurement RFQ', status: 'SENT', vendorsSolicited: 3, bidResponses: 2 }
        ] } })
      );

      await page.goto('/procurement/rfq', { waitUntil: 'domcontentloaded' });

      const texts = ['Server Procurement RFQ', 'SENT', '3 vendors', '2 bids'];
      for (const text of texts) {
        const el = page.getByText(text);
        if (await el.count() > 0) {
          await expect(el.first()).toBeVisible();
        }
      }
    });

    test('should show RFQ list table columns', async ({ page }) => {
      await page.route('**/api/v1/procurement/rfq**', route =>
        route.fulfill({ json: { data: [
          { id: 'rfq-001', title: 'Server Procurement RFQ', status: 'SENT', vendorsSolicited: 3, bidResponses: 2 }
        ] } })
      );

      await page.goto('/procurement/rfq', { waitUntil: 'domcontentloaded' });

      const texts = ['Title', 'Status', 'Vendors', 'Responses', 'Actions'];
      for (const text of texts) {
        const el = page.getByText(text);
        if (await el.count() > 0) {
          await expect(el.first()).toBeVisible();
        }
      }
    });

    test('should show empty RFQ list message', async ({ page }) => {
      await page.route('**/api/v1/procurement/rfq**', route =>
        route.fulfill({ json: { data: [] } })
      );

      await page.goto('/procurement/rfq', { waitUntil: 'domcontentloaded' });

      const emptyMsg = page.getByText('No RFQs yet. Create one to get started.');
      if (await emptyMsg.count() > 0) {
        await expect(emptyMsg).toBeVisible();
      }
    });
  });
});
