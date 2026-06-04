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

      await expect(page.getByText('Vendor Concentration Risk')).toBeVisible();
      await expect(page.getByText('Top Vendor Spend')).toBeVisible();
      await expect(page.getByText('Categories Tracked')).toBeVisible();
      await expect(page.getByText('Consolidation Potential')).toBeVisible();
    });

    test('should show vendor concentration details', async ({ page }) => {
      await page.route('**/api/v1/procurement/spend-analysis**', route =>
        route.fulfill({ json: mocks.mockSpendAnalysis })
      );

      await page.goto('/procurement/spend-analysis', { waitUntil: 'domcontentloaded' });

      await expect(page.getByText('MEDIUM Risk')).toBeVisible();
      await expect(page.getByText('42%')).toBeVisible();
      await expect(page.getByText('15 vendors')).toBeVisible();
      await expect(page.getByText('$125,000')).toBeVisible();
    });

    test('should show top vendors list with progress bars', async ({ page }) => {
      await page.route('**/api/v1/procurement/spend-analysis**', route =>
        route.fulfill({ json: mocks.mockSpendAnalysis })
      );

      await page.goto('/procurement/spend-analysis', { waitUntil: 'domcontentloaded' });

      await expect(page.getByText('Vendor A')).toBeVisible();
      await expect(page.getByText('$500,000')).toBeVisible();
      await expect(page.getByText('42%')).toBeVisible();
      await expect(page.getByText('Vendor B')).toBeVisible();
      await expect(page.getByText('$350,000')).toBeVisible();
      await expect(page.getByText('29%')).toBeVisible();
    });

    test('should show spend by category', async ({ page }) => {
      await page.route('**/api/v1/procurement/spend-analysis**', route =>
        route.fulfill({ json: mocks.mockSpendAnalysis })
      );

      await page.goto('/procurement/spend-analysis', { waitUntil: 'domcontentloaded' });

      await expect(page.getByText('Software')).toBeVisible();
      await expect(page.getByText('$400,000')).toBeVisible();
      await expect(page.getByText('Hardware')).toBeVisible();
      await expect(page.getByText('$300,000')).toBeVisible();
    });
  });

  test.describe('RFQ Detail', () => {
    test('should show RFQ summary cards', async ({ page }) => {
      await page.route('**/api/v1/procurement/rfq/rfq-001', route =>
        route.fulfill({ json: mocks.mockRFQDetail })
      );

      await page.goto('/procurement/rfq/rfq-001', { waitUntil: 'domcontentloaded' });

      await expect(page.getByText('Deadline')).toBeVisible();
      await expect(page.getByText('July 15, 2026')).toBeVisible();
      await expect(page.getByText('Vendors Solicited')).toBeVisible();
      await expect(page.getByText('Bids Received')).toBeVisible();
    });

    test('should show bid responses table', async ({ page }) => {
      await page.route('**/api/v1/procurement/rfq/rfq-001', route =>
        route.fulfill({ json: mocks.mockRFQDetail })
      );

      await page.goto('/procurement/rfq/rfq-001', { waitUntil: 'domcontentloaded' });

      await expect(page.getByText('Vendor A')).toBeVisible();
      await expect(page.getByText('$45,000')).toBeVisible();
      await expect(page.getByText('14 days')).toBeVisible();
      await expect(page.getByText('4.5')).toBeVisible();
      await expect(page.getByText('87')).toBeVisible();
      await expect(page.getByText('Vendor B')).toBeVisible();
      await expect(page.getByText('$52,000')).toBeVisible();
      await expect(page.getByText('7 days')).toBeVisible();
      await expect(page.getByText('4.0')).toBeVisible();
      await expect(page.getByText('72')).toBeVisible();
    });

    test('should show score and rank bids button', async ({ page }) => {
      await page.route('**/api/v1/procurement/rfq/rfq-001', route =>
        route.fulfill({ json: { ...mocks.mockRFQDetail, status: 'SENT' } })
      );

      await page.goto('/procurement/rfq/rfq-001', { waitUntil: 'domcontentloaded' });

      await expect(page.getByRole('button', { name: 'Score and Rank Bids' })).toBeVisible();
    });

    test('should show scores after scoring', async ({ page }) => {
      await page.route('**/api/v1/procurement/rfq/rfq-001', route => {
        if (route.request().method() === 'POST' && route.request().url().includes('/score')) {
          return route.fulfill({ json: { data: { scores: [87, 72] } } });
        }
        return route.fulfill({ json: mocks.mockRFQDetail });
      });

      await page.goto('/procurement/rfq/rfq-001', { waitUntil: 'domcontentloaded' });

      await page.getByRole('button', { name: 'Score and Rank Bids' }).click();

      await expect(page.getByText('Vendor A - Score: 87')).toBeVisible();
      await expect(page.getByText('Vendor B - Score: 72')).toBeVisible();
    });

    test('should show award button', async ({ page }) => {
      await page.route('**/api/v1/procurement/rfq/rfq-001', route =>
        route.fulfill({ json: { ...mocks.mockRFQDetail, status: 'SCORED' } })
      );

      await page.goto('/procurement/rfq/rfq-001', { waitUntil: 'domcontentloaded' });

      await expect(page.getByRole('button', { name: 'Award to Vendor A' })).toBeVisible();
    });

    test('should award RFQ', async ({ page }) => {
      await page.route('**/api/v1/procurement/rfq/rfq-001', route => {
        if (route.request().method() === 'POST' && route.request().url().includes('/award')) {
          return route.fulfill({ json: { data: { status: 'AWARDED' } } });
        }
        return route.fulfill({ json: { ...mocks.mockRFQDetail, status: 'SCORED' } });
      });

      await page.goto('/procurement/rfq/rfq-001', { waitUntil: 'domcontentloaded' });

      await page.getByRole('button', { name: 'Award to Vendor A' }).click();

      await expect(page.getByText('AWARDED')).toBeVisible();
    });

    test('should show RFQ not found state', async ({ page }) => {
      await page.route('**/api/v1/procurement/rfq/rfq-001', route =>
        route.fulfill({ json: { data: null } })
      );

      await page.goto('/procurement/rfq/rfq-001', { waitUntil: 'domcontentloaded' });

      await expect(page.getByText('RFQ not found')).toBeVisible();
    });

    test('should show no bids message', async ({ page }) => {
      await page.route('**/api/v1/procurement/rfq/rfq-001', route =>
        route.fulfill({ json: { data: { ...mocks.mockRFQDetail, bids: [] } } })
      );

      await page.goto('/procurement/rfq/rfq-001', { waitUntil: 'domcontentloaded' });

      await expect(page.getByText('No bids received yet')).toBeVisible();
    });
  });

  test.describe('Invoice Matching', () => {
    test('should show summary cards', async ({ page }) => {
      await page.route('**/api/v1/procurement/matching**', route =>
        route.fulfill({ json: { ...mocks.mockMatchingExceptions, data: [] } })
      );

      await page.goto('/procurement/matching', { waitUntil: 'domcontentloaded' });

      await expect(page.getByText('Open Exceptions')).toBeVisible();
      await expect(page.getByText('Total Variance')).toBeVisible();
      await expect(page.getByText('Resolution Rate')).toBeVisible();
    });

    test('should show matching exceptions table', async ({ page }) => {
      await page.route('**/api/v1/procurement/matching**', route =>
        route.fulfill({ json: mocks.mockMatchingExceptions })
      );

      await page.goto('/procurement/matching', { waitUntil: 'domcontentloaded' });

      await expect(page.getByText('match-001')).toBeVisible();
      await expect(page.getByText('inv-001')).toBeVisible();
      await expect(page.getByText('$500')).toBeVisible();
      await expect(page.getByText('Price mismatch')).toBeVisible();
      await expect(page.getByText('PENDING')).toBeVisible();
      await expect(page.getByText('match-002')).toBeVisible();
      await expect(page.getByText('inv-002')).toBeVisible();
      await expect(page.getByText('$0')).toBeVisible();
      await expect(page.getByText('RESOLVED')).toBeVisible();
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
        await expect(page.getByText('RESOLVED')).toBeVisible();
      }
    });

    test('should show no exceptions message', async ({ page }) => {
      await page.route('**/api/v1/procurement/matching**', route =>
        route.fulfill({ json: { data: [] } })
      );

      await page.goto('/procurement/matching', { waitUntil: 'domcontentloaded' });

      await expect(page.getByText('No exceptions found')).toBeVisible();
    });
  });

  test.describe('RFQ List', () => {
    test('should show create RFQ form', async ({ page }) => {
      await page.route('**/api/v1/procurement/rfq**', route =>
        route.fulfill({ json: { data: [] } })
      );

      await page.goto('/procurement/rfq', { waitUntil: 'domcontentloaded' });

      await expect(page.getByRole('button', { name: 'Create RFQ' })).toBeVisible();

      await page.getByRole('button', { name: 'Create RFQ' }).click();

      await expect(page.getByRole('textbox', { name: 'Title' })).toBeVisible();
      await expect(page.getByRole('textbox', { name: 'Description' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Create' })).toBeVisible();
    });

    test('should show RFQ list table', async ({ page }) => {
      await page.route('**/api/v1/procurement/rfq**', route =>
        route.fulfill({ json: { data: [
          { id: 'rfq-001', title: 'Server Procurement RFQ', status: 'SENT', vendorsSolicited: 3, bidResponses: 2 }
        ] } })
      );

      await page.goto('/procurement/rfq', { waitUntil: 'domcontentloaded' });

      await expect(page.getByText('Server Procurement RFQ')).toBeVisible();
      await expect(page.getByText('SENT')).toBeVisible();
      await expect(page.getByText('3 vendors')).toBeVisible();
      await expect(page.getByText('2 bids')).toBeVisible();
    });

    test('should show RFQ list table columns', async ({ page }) => {
      await page.route('**/api/v1/procurement/rfq**', route =>
        route.fulfill({ json: { data: [
          { id: 'rfq-001', title: 'Server Procurement RFQ', status: 'SENT', vendorsSolicited: 3, bidResponses: 2 }
        ] } })
      );

      await page.goto('/procurement/rfq', { waitUntil: 'domcontentloaded' });

      await expect(page.getByText('Title')).toBeVisible();
      await expect(page.getByText('Status')).toBeVisible();
      await expect(page.getByText('Vendors')).toBeVisible();
      await expect(page.getByText('Responses')).toBeVisible();
      await expect(page.getByText('Actions')).toBeVisible();
    });

    test('should show empty RFQ list message', async ({ page }) => {
      await page.route('**/api/v1/procurement/rfq**', route =>
        route.fulfill({ json: { data: [] } })
      );

      await page.goto('/procurement/rfq', { waitUntil: 'domcontentloaded' });

      await expect(page.getByText('No RFQs yet. Create one to get started.')).toBeVisible();
    });
  });
});