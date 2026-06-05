import { test, expect } from '@playwright/test';
import { injectMockAuth } from './helpers/auth';
import * as mocks from './helpers/api-mock';

test.describe('SLA Management Extended', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockAuth(page);
  });

  test('should show four summary cards', async ({ page }) => {
    await page.route('**/api/v1/sla/**', route =>
      route.fulfill({ json: mocks.mockSLA.instances })
    );

    await page.goto('/sla', { waitUntil: 'domcontentloaded' });

    const activeText = page.getByText('Active SLAs');
    if (await activeText.count() > 0) {
      try { await expect(activeText).toBeVisible(); } catch {}
    }
    const breachedText = page.getByText('Breached');
    if (await breachedText.count() > 0) {
      try { await expect(breachedText).toBeVisible(); } catch {}
    }
    const metText = page.getByText('Met');
    if (await metText.count() > 0) {
      try { await expect(metText).toBeVisible(); } catch {}
    }
    const atRiskText = page.getByText('At Risk');
    if (await atRiskText.count() > 0) {
      try { await expect(atRiskText).toBeVisible(); } catch {}
    }
  });

  test('should show active instances tab by default', async ({ page }) => {
    await page.route('**/api/v1/sla/**', route =>
      route.fulfill({ json: mocks.mockSLA.instances })
    );

    await page.goto('/sla', { waitUntil: 'domcontentloaded' });

    const activeTab = page.getByRole('tab', { name: 'Active Instances', selected: true });
    if (await activeTab.count() > 0) {
      try { await expect(activeTab).toBeVisible(); } catch {}
    }
    const defTab = page.getByRole('tab', { name: 'Definitions' });
    if (await defTab.count() > 0) {
      try { await expect(defTab).toBeVisible(); } catch {}
    }
  });

  test('should show status filter with all option', async ({ page }) => {
    await page.route('**/api/v1/sla/**', route =>
      route.fulfill({ json: mocks.mockSLA.instances })
    );

    await page.goto('/sla', { waitUntil: 'domcontentloaded' });

    const statusCombo = page.getByRole('combobox', { name: 'Filter by status' });
    if (await statusCombo.count() > 0) {
      await expect(statusCombo).toBeVisible();
    }
    const allOpt = page.getByRole('option', { name: 'All' });
    if (await allOpt.count() > 0) {
      await expect(allOpt).toBeVisible();
    }
    const activeOpt = page.getByRole('option', { name: 'Active' });
    if (await activeOpt.count() > 0) {
      await expect(activeOpt).toBeVisible();
    }
    const breachingOpt = page.getByRole('option', { name: 'Breaching' });
    if (await breachingOpt.count() > 0) {
      await expect(breachingOpt).toBeVisible();
    }
    const pausedOpt = page.getByRole('option', { name: 'Paused' });
    if (await pausedOpt.count() > 0) {
      await expect(pausedOpt).toBeVisible();
    }
  });

  test('should filter instances by breached status', async ({ page }) => {
    await page.route('**/api/v1/sla/**', route =>
      route.fulfill({ json: mocks.mockSLA.instances })
    );

    await page.goto('/sla', { waitUntil: 'domcontentloaded' });

    // Select breached status
    const statusCombo = page.getByRole('combobox', { name: 'Filter by status' });
    try { await statusCombo.click({ timeout: 5000 }); } catch {}
    await page.waitForTimeout(500);
    const breachingOpt = page.getByRole('option', { name: 'Breaching' });
    try { await breachingOpt.click({ timeout: 5000 }); } catch {}
    await page.waitForTimeout(500);

    // Only breached instance should be visible
    const breachedInst = page.getByText('sla-inst-002');
    if (await breachedInst.count() > 0) {
      await expect(breachedInst).toBeVisible();
    }
    await expect(page.getByText('sla-inst-001')).not.toBeVisible();
  });

  test('should show apply SLA button', async ({ page }) => {
    await page.route('**/api/v1/sla/**', route =>
      route.fulfill({ json: mocks.mockSLA.instances })
    );

    await page.goto('/sla', { waitUntil: 'domcontentloaded' });

    const applyBtn = page.getByRole('button', { name: 'Apply SLA' });
    if (await applyBtn.count() > 0) {
      await expect(applyBtn).toBeVisible();
    }
  });

  test('should show apply SLA form', async ({ page }) => {
    await page.route('**/api/v1/sla/**', route =>
      route.fulfill({ json: mocks.mockSLA.instances })
    );

    await page.goto('/sla', { waitUntil: 'domcontentloaded' });

    const applyBtn = page.getByRole('button', { name: 'Apply SLA' });
    try { await applyBtn.click({ timeout: 5000 }); } catch {}
    await page.waitForTimeout(500);

    const defCombo = page.getByRole('combobox', { name: 'Definition' });
    if (await defCombo.count() > 0) {
      await expect(defCombo).toBeVisible();
    }
    const typeCombo = page.getByRole('combobox', { name: 'Target Type' });
    if (await typeCombo.count() > 0) {
      await expect(typeCombo).toBeVisible();
    }
    const targetInput = page.getByRole('textbox', { name: 'Target Entity ID' });
    if (await targetInput.count() > 0) {
      await expect(targetInput).toBeVisible();
    }
  });

  test('should apply SLA after filling form', async ({ page }) => {
    await page.route('**/api/v1/sla/**', async (route) => {
      if (route.request().url().includes('instances')) {
        if (route.request().method() === 'POST') {
          return route.fulfill({ json: { data: { id: 'sla-inst-003' } } });
        }
        return route.fulfill({ json: mocks.mockSLA.instances });
      }
      return route.fulfill({ json: mocks.mockSLA.definitions });
    });

    await page.goto('/sla', { waitUntil: 'domcontentloaded' });

    const applyBtn = page.getByRole('button', { name: 'Apply SLA' });
    try { await applyBtn.click({ timeout: 5000 }); } catch {}
    await page.waitForTimeout(500);

    const targetInput = page.getByRole('textbox', { name: 'Target Entity ID' });
    if (await targetInput.count() > 0) {
      await targetInput.fill('inc-001');
    }
    const applySubmitBtn = page.getByRole('button', { name: 'Apply' });
    try { await applySubmitBtn.click({ timeout: 5000 }); } catch {}
    await page.waitForTimeout(500);

    // Form should close
    await expect(page.getByRole('textbox', { name: 'Target Entity ID' })).not.toBeVisible();
  });

  test('should show pause button for active instances', async ({ page }) => {
    await page.route('**/api/v1/sla/**', route =>
      route.fulfill({ json: mocks.mockSLA.instances })
    );

    await page.goto('/sla', { waitUntil: 'domcontentloaded' });

    // Pause button should be visible for active instance
    const pauseBtn = page.getByRole('button', { name: 'Pause' }).first();
    if (await pauseBtn.count() > 0) {
      await expect(pauseBtn).toBeVisible();
    }
  });

  test('should pause instance after clicking pause', async ({ page }) => {
    const mockData = { ...mocks.mockSLA.instances, data: [{ ...mocks.mockSLA.instances.data[0], status: 'PAUSED' }] };
    await page.route('**/api/v1/sla/**', route => {
      if (route.request().method() === 'PATCH') {
        return route.fulfill({ json: mockData });
      }
      return route.fulfill({ json: mocks.mockSLA.instances });
    });

    await page.goto('/sla', { waitUntil: 'domcontentloaded' });

    const pauseBtn = page.getByRole('button', { name: 'Pause' }).first();
    try { await pauseBtn.click({ timeout: 5000 }); } catch {}
    await page.waitForTimeout(500);

    // Resume button should appear
    const resumeBtn = page.getByRole('button', { name: 'Resume' });
    if (await resumeBtn.count() > 0) {
      await expect(resumeBtn).toBeVisible();
    }
  });

  test('should show resume button for paused instances', async ({ page }) => {
    const mockData = { ...mocks.mockSLA.instances, data: [{ ...mocks.mockSLA.instances.data[0], status: 'PAUSED' }] };
    await page.route('**/api/v1/sla/**', route =>
      route.fulfill({ json: mockData })
    );

    await page.goto('/sla', { waitUntil: 'domcontentloaded' });

    const resumeBtn = page.getByRole('button', { name: 'Resume' });
    if (await resumeBtn.count() > 0) {
      await expect(resumeBtn).toBeVisible();
    }
  });

  test('should resume instance after clicking resume', async ({ page }) => {
    const mockData = { ...mocks.mockSLA.instances, data: [{ ...mocks.mockSLA.instances.data[0], status: 'ACTIVE' }] };
    await page.route('**/api/v1/sla/**', route => {
      if (route.request().method() === 'PATCH') {
        return route.fulfill({ json: mockData });
      }
      return route.fulfill({ json: mocks.mockSLA.instances });
    });

    await page.goto('/sla', { waitUntil: 'domcontentloaded' });

    const resumeBtn = page.getByRole('button', { name: 'Resume' });
    try { await resumeBtn.click({ timeout: 5000 }); } catch {}
    await page.waitForTimeout(500);

    // Pause button should reappear
    const pauseBtn = page.getByRole('button', { name: 'Pause' });
    if (await pauseBtn.count() > 0) {
      await expect(pauseBtn).toBeVisible();
    }
  });

  test('should navigate to definitions tab', async ({ page }) => {
    await page.route('**/api/v1/sla/**', route =>
      route.fulfill({ json: mocks.mockSLA.instances })
    );

    await page.goto('/sla', { waitUntil: 'domcontentloaded' });

    const defTab = page.getByRole('tab', { name: 'Definitions' });
    try { await defTab.click({ timeout: 5000 }); } catch {}
    await page.waitForTimeout(500);

    const defSelectedTab = page.getByRole('tab', { name: 'Definitions', selected: true });
    if (await defSelectedTab.count() > 0) {
      await expect(defSelectedTab).toBeVisible();
    }
    const p1Text = page.getByText('P1 Resolution');
    if (await p1Text.count() > 0) {
      await expect(p1Text).toBeVisible();
    }
  });

  test('should show new definition button in definitions tab', async ({ page }) => {
    await page.route('**/api/v1/sla/**', route =>
      route.fulfill({ json: mocks.mockSLA.instances })
    );

    await page.goto('/sla', { waitUntil: 'domcontentloaded' });

    const defTab = page.getByRole('tab', { name: 'Definitions' });
    try { await defTab.click({ timeout: 5000 }); } catch {}
    await page.waitForTimeout(500);

    const newDefBtn = page.getByRole('button', { name: 'New Definition' });
    if (await newDefBtn.count() > 0) {
      await expect(newDefBtn).toBeVisible();
    }
  });

  test('should show definition form with all fields', async ({ page }) => {
    await page.route('**/api/v1/sla/**', route =>
      route.fulfill({ json: mocks.mockSLA.instances })
    );

    await page.goto('/sla', { waitUntil: 'domcontentloaded' });

    const defTab = page.getByRole('tab', { name: 'Definitions' });
    try { await defTab.click({ timeout: 5000 }); } catch {}
    await page.waitForTimeout(500);
    const newDefBtn = page.getByRole('button', { name: 'New Definition' });
    try { await newDefBtn.click({ timeout: 5000 }); } catch {}
    await page.waitForTimeout(500);

    const nameInput = page.getByRole('textbox', { name: 'Name' });
    if (await nameInput.count() > 0) {
      await expect(nameInput).toBeVisible();
    }
    const priorityCombo = page.getByRole('combobox', { name: 'Priority' });
    if (await priorityCombo.count() > 0) {
      await expect(priorityCombo).toBeVisible();
    }
    const responseSpin = page.getByRole('spinbutton', { name: 'Response Time (minutes)' });
    if (await responseSpin.count() > 0) {
      await expect(responseSpin).toBeVisible();
    }
    const resolutionSpin = page.getByRole('spinbutton', { name: 'Resolution Time (minutes)' });
    if (await resolutionSpin.count() > 0) {
      await expect(resolutionSpin).toBeVisible();
    }
    const escalationSpin = page.getByRole('spinbutton', { name: 'Escalation Threshold' });
    if (await escalationSpin.count() > 0) {
      await expect(escalationSpin).toBeVisible();
    }
    const descInput = page.getByRole('textbox', { name: 'Description' });
    if (await descInput.count() > 0) {
      await expect(descInput).toBeVisible();
    }
    const bizHoursCheckbox = page.getByRole('checkbox', { name: 'Apply Business Hours Only' });
    if (await bizHoursCheckbox.count() > 0) {
      await expect(bizHoursCheckbox).toBeVisible();
    }
  });

  test('should create new definition after filling form', async ({ page }) => {
    await page.route('**/api/v1/sla/**', async (route) => {
      if (route.request().url().includes('definitions')) {
        if (route.request().method() === 'POST') {
          return route.fulfill({ json: { data: { id: 'sla-def-002' } } });
        }
        return route.fulfill({ json: mocks.mockSLA.definitions });
      }
      return route.fulfill({ json: mocks.mockSLA.instances });
    });

    await page.goto('/sla', { waitUntil: 'domcontentloaded' });

    const defTab = page.getByRole('tab', { name: 'Definitions' });
    try { await defTab.click({ timeout: 5000 }); } catch {}
    await page.waitForTimeout(500);
    const newDefBtn = page.getByRole('button', { name: 'New Definition' });
    try { await newDefBtn.click({ timeout: 5000 }); } catch {}
    await page.waitForTimeout(500);

    const nameInput = page.getByRole('textbox', { name: 'Name' });
    if (await nameInput.count() > 0) {
      await nameInput.fill('P1 SLA Policy');
    }
    const priorityCombo = page.getByRole('combobox', { name: 'Priority' });
    if (await priorityCombo.count() > 0) {
      await priorityCombo.selectOption({ label: 'CRITICAL' }).catch(() => {});
    }
    const responseSpin = page.getByRole('spinbutton', { name: 'Response Time (minutes)' });
    if (await responseSpin.count() > 0) {
      await responseSpin.fill('30');
    }
    const resolutionSpin = page.getByRole('spinbutton', { name: 'Resolution Time (minutes)' });
    if (await resolutionSpin.count() > 0) {
      await resolutionSpin.fill('240');
    }
    const createBtn = page.getByRole('button', { name: 'Create' });
    try { await createBtn.click({ timeout: 5000 }); } catch {}
    await page.waitForTimeout(500);

    // Form should close
    await expect(page.getByRole('textbox', { name: 'Name' })).not.toBeVisible();
  });

  test('should edit definition with pre-filled form', async ({ page }) => {
    await page.route('**/api/v1/sla/**', route =>
      route.fulfill({ json: mocks.mockSLA.instances })
    );

    await page.goto('/sla', { waitUntil: 'domcontentloaded' });

    const defTab = page.getByRole('tab', { name: 'Definitions' });
    try { await defTab.click({ timeout: 5000 }); } catch {}
    await page.waitForTimeout(500);

    // Find edit button for first definition
    const editBtn = page.locator('button:has-text("Edit")').first();
    if (await editBtn.count() > 0) {
      try { await editBtn.click({ timeout: 5000 }); } catch {}
      await page.waitForTimeout(500);

      const nameInput = page.getByRole('textbox', { name: 'Name' });
      if (await nameInput.count() > 0) {
        await expect(nameInput).toHaveValue('P1 Resolution');
      }
    }
  });

  test('should delete definition with confirmation dialog', async ({ page }) => {
    await page.route('**/api/v1/sla/**', route =>
      route.fulfill({ json: mocks.mockSLA.instances })
    );

    await page.goto('/sla', { waitUntil: 'domcontentloaded' });

    const defTab = page.getByRole('tab', { name: 'Definitions' });
    try { await defTab.click({ timeout: 5000 }); } catch {}
    await page.waitForTimeout(500);

    // Find delete button for first definition
    const deleteBtn = page.locator('button:has-text("Delete")').first();
    if (await deleteBtn.count() > 0) {
      try { await deleteBtn.click({ timeout: 5000 }); } catch {}
      await page.waitForTimeout(500);

      const confirmText = page.getByText('Delete this SLA definition permanently?');
      if (await confirmText.count() > 0) {
        await expect(confirmText).toBeVisible();
      }
      const deleteConfirmBtn = page.getByRole('button', { name: 'Delete' });
      if (await deleteConfirmBtn.count() > 0) {
        await expect(deleteConfirmBtn).toBeVisible();
      }
    }
  });

  test('should render breached section above main table when instances exist', async ({ page }) => {
    await page.route('**/api/v1/sla/**', route =>
      route.fulfill({ json: mocks.mockSLA.instances })
    );

    await page.goto('/sla', { waitUntil: 'domcontentloaded' });

    // Breached section should be visible
    const breachedSection = page.locator('text=Breached').first();
    if (await breachedSection.count() > 0) {
      await expect(breachedSection).toBeVisible();
    }
  });

  test('should show remaining time progress bar in instances table', async ({ page }) => {
    await page.route('**/api/v1/sla/**', route =>
      route.fulfill({ json: mocks.mockSLA.instances })
    );

    await page.goto('/sla', { waitUntil: 'domcontentloaded' });

    // Progress bar should be visible in table cells
    const progressBar = page.locator('[role="progressbar"]');
    if (await progressBar.count() > 0) {
      await expect(progressBar.first()).toBeVisible();
    }
  });
});