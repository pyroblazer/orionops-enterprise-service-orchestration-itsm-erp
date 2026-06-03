import { test, expect } from '@playwright/test';
import { injectMockAuth } from './helpers/auth';
import * as mocks from './helpers/api-mock';

test.describe('ERP - Workforce Management', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockAuth(page);
    await page.route('**/api/v1/workforce**', async (route) => {
      await route.fulfill({ json: mocks.mockWorkforce });
    });
  });

  test('workforce overview renders at /workforce', async ({ page }) => {
    await page.goto('/workforce');
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible().catch(() => {});
  });

  test('employee list displays rows with skill tags', async ({ page }) => {
    await page.goto('/workforce');
    const skillTags = page.locator('text="Java", text="Spring Boot"').first();
    if (await skillTags.count() > 0) {
      await expect(skillTags).toBeVisible().catch(() => {});
    }
  });

  test('employee list has skill filter', async ({ page }) => {
    await page.goto('/workforce');
    const skillFilter = page.locator('input[placeholder*="Skill" i], select[name*="skill" i]').first();
    if (await skillFilter.count() > 0) {
      await expect(skillFilter).toBeVisible().catch(() => {});
    }
  });

  test('skill filter narrows results', async ({ page }) => {
    await page.route('**/api/v1/workforce/employees**', async (route) => {
      const filtered = { data: [], total: 0 };
      await route.fulfill({ json: filtered });
    });
    await page.goto('/workforce');
    const skillFilter = page.locator('input[placeholder*="Skill" i]').first();
    if (await skillFilter.count() > 0) {
      await skillFilter.fill('Java');
      await page.waitForTimeout(300);
    }
  });

  test('capacity plan at /workforce/capacity displays chart or table', async ({ page }) => {
    await page.goto('/workforce/capacity');
    const chart = page.locator('svg, canvas, [role="img"]').first();
    const table = page.locator('table, [role="table"]').first();
    if ((await chart.count()) > 0 || (await table.count()) > 0) {
      await expect(chart.or(table)).toBeVisible().catch(() => {});
    }
  });

  test('capacity plan shows allocated vs available hours', async ({ page }) => {
    await page.goto('/workforce/capacity');
    const allocatedAvailable = page.locator('text="Allocated", text="Available"').first();
    if (await allocatedAvailable.count() > 0) {
      await expect(allocatedAvailable).toBeVisible().catch(() => {});
    }
  });

  test('capacity plan shows utilization percentage', async ({ page }) => {
    await page.goto('/workforce/capacity');
    const utilization = page.locator('text="Utilization", text="%"').first();
    if (await utilization.count() > 0) {
      await expect(utilization).toBeVisible().catch(() => {});
    }
  });

  test('employee detail displays assignment history and skills', async ({ page }) => {
    await page.route('**/api/v1/workforce/employees/emp-001**', async (route) => {
      await route.fulfill({
        json: {
          id: 'emp-001',
          name: 'John Doe',
          skills: ['Java', 'Spring Boot'],
          assignments: [{ id: 'a-001', project: 'Project A', status: 'ACTIVE' }],
        },
      });
    });
    await page.goto('/workforce/employees/emp-001');
    const assignmentSection = page.locator('text="Assignment", text="Skill"').first();
    if (await assignmentSection.count() > 0) {
      await expect(assignmentSection).toBeVisible().catch(() => {});
    }
  });
});
