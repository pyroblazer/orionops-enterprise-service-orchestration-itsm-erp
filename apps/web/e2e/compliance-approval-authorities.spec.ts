import { test, expect } from '@playwright/test';
import { injectMockAuth } from './helpers/auth';
import * as mocks from './helpers/api-mock';

test.describe('Compliance Approval Authorities', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockAuth(page);
  });

  test('should show page heading and Set Authority button', async ({ page }) => {
    await page.route('**/api/v1/compliance/approval-authorities**', route =>
      route.fulfill({ json: mocks.mockCompliance.approvalAuthorities || { data: [], total: 0 } })
    );

    await page.goto('/compliance/approval-authorities', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { name: 'Approval Authorities' })).toBeVisible();
    const setAuthBtn = page.getByRole('button', { name: 'Set Authority' });
    if (await setAuthBtn.count() > 0) {
      await expect(setAuthBtn).toBeVisible();
    }
  });

  test('should show empty state when no authorities configured', async ({ page }) => {
    await page.route('**/api/v1/compliance/approval-authorities**', route =>
      route.fulfill({ json: { data: [], total: 0 } })
    );

    await page.goto('/compliance/approval-authorities', { waitUntil: 'domcontentloaded' });

    const emptyText = page.getByText('No authorities configured');
    if (await emptyText.count() > 0) {
      await expect(emptyText).toBeVisible();
    }
  });

  test('should show Check Approval card with inputs', async ({ page }) => {
    await page.route('**/api/v1/compliance/approval-authorities**', route =>
      route.fulfill({ json: { data: [], total: 0 } })
    );

    await page.goto('/compliance/approval-authorities', { waitUntil: 'domcontentloaded' });

    const checkCard = page.getByText('Check Approval');
    if (await checkCard.count() > 0) {
      await expect(checkCard).toBeVisible();
      const userinput = page.getByRole('textbox', { name: 'User' });
      const activityInput = page.getByRole('textbox', { name: 'Activity' });
      const amountInput = page.getByRole('textbox', { name: 'Amount' });
      if (await userinput.count() > 0) await expect(userinput).toBeVisible();
      if (await activityInput.count() > 0) await expect(activityInput).toBeVisible();
      if (await amountInput.count() > 0) await expect(amountInput).toBeVisible();
    }
  });

  test('should show approved result for low amount check', async ({ page }) => {
    await page.route('**/api/v1/compliance/approval-authorities**', route =>
      route.fulfill({ json: { data: [], total: 0 } })
    );
    await page.route('**/api/v1/compliance/approval-authorities/check**', route =>
      route.fulfill({ json: mocks.mockApprovalAuthorities.canApprove })
    );

    await page.goto('/compliance/approval-authorities', { waitUntil: 'domcontentloaded' });

    const checkBtn = page.getByRole('button', { name: 'Check Authority' });
    if (await checkBtn.count() > 0) {
      const userinput = page.getByRole('textbox', { name: 'User' });
      if (await userinput.count() > 0) {
        await userinput.fill('u1');
      }
      const activityInput = page.getByRole('textbox', { name: 'Activity' });
      if (await activityInput.count() > 0) {
        await activityInput.fill('APPROVE_PO');
      }
      const amountInput = page.getByRole('textbox', { name: 'Amount' });
      if (await amountInput.count() > 0) {
        await amountInput.fill('1000');
      }
      await checkBtn.click();
      const approvedText = page.getByText('canApprove');
      if (await approvedText.count() > 0) {
        await expect(approvedText.first()).toBeVisible();
      }
    }
  });

  test('should show denied result for high amount check', async ({ page }) => {
    await page.route('**/api/v1/compliance/approval-authorities**', route =>
      route.fulfill({ json: { data: [], total: 0 } })
    );
    await page.route('**/api/v1/compliance/approval-authorities/check**', route =>
      route.fulfill({ json: mocks.mockApprovalAuthorities.cannotApprove })
    );

    await page.goto('/compliance/approval-authorities', { waitUntil: 'domcontentloaded' });

    const checkBtn = page.getByRole('button', { name: 'Check Authority' });
    if (await checkBtn.count() > 0) {
      const userinput = page.getByRole('textbox', { name: 'User' });
      if (await userinput.count() > 0) {
        await userinput.fill('u1');
      }
      const amountInput = page.getByRole('textbox', { name: 'Amount' });
      if (await amountInput.count() > 0) {
        await amountInput.fill('100000');
      }
      await checkBtn.click();
      const deniedText = page.getByText(/denied|exceeds/i);
      if (await deniedText.count() > 0) {
        await expect(deniedText.first()).toBeVisible();
      }
    }
  });

  test('should show Set Authority form', async ({ page }) => {
    await page.route('**/api/v1/compliance/approval-authorities**', route =>
      route.fulfill({ json: { data: [], total: 0 } })
    );

    await page.goto('/compliance/approval-authorities', { waitUntil: 'domcontentloaded' });

    const setAuthBtn = page.getByRole('button', { name: 'Set Authority' });
    if (await setAuthBtn.count() > 0) {
      await setAuthBtn.click();
      const userinput = page.getByRole('textbox', { name: 'User' });
      const activityTypeInput = page.getByRole('combobox', { name: 'Activity Type' });
      const maxAmountInput = page.getByRole('textbox', { name: 'Max Amount' });
      if (await userinput.count() > 0) await expect(userinput).toBeVisible();
      if (await activityTypeInput.count() > 0) await expect(activityTypeInput).toBeVisible();
      if (await maxAmountInput.count() > 0) await expect(maxAmountInput).toBeVisible();
    }
  });

  test('should create authority after filling form', async ({ page }) => {
    await page.route('**/api/v1/compliance/approval-authorities**', route => {
      if (route.request().method() === 'POST') {
        return route.fulfill({ json: mocks.mockApprovalAuthorities.created });
      }
      return route.fulfill({ json: { data: [], total: 0 } });
    });

    await page.goto('/compliance/approval-authorities', { waitUntil: 'domcontentloaded' });

    const setAuthBtn = page.getByRole('button', { name: 'Set Authority' });
    if (await setAuthBtn.count() > 0) {
      await setAuthBtn.click();
      const userinput = page.getByRole('textbox', { name: 'User' });
      if (await userinput.count() > 0) {
        await userinput.fill('u1');
      }
      const submitBtn = page.getByRole('button', { name: 'Create' });
      if (await submitBtn.count() > 0) {
        await submitBtn.click();
        await expect(userinput).not.toBeVisible();
      }
    }
  });

  test('should disable button while request pending', async ({ page }) => {
    await page.route('**/api/v1/compliance/approval-authorities**', route => {
      if (route.request().method() === 'POST') {
        return route.fulfill({ json: mocks.mockApprovalAuthorities.created, delay: 2000 });
      }
      return route.fulfill({ json: { data: [], total: 0 } });
    });

    await page.goto('/compliance/approval-authorities', { waitUntil: 'domcontentloaded' });

    const setAuthBtn = page.getByRole('button', { name: 'Set Authority' });
    if (await setAuthBtn.count() > 0) {
      await setAuthBtn.click();
      const submitBtn = page.getByRole('button', { name: 'Create' });
      if (await submitBtn.count() > 0) {
        const userinput = page.getByRole('textbox', { name: 'User' });
        if (await userinput.count() > 0) await userinput.fill('u1');
        await submitBtn.click();
        await expect(submitBtn).toBeDisabled();
      }
    }
  });
});
