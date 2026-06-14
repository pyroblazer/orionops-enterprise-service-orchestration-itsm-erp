import { Page } from '@playwright/test';

export async function waitForColdStartBannerToDismiss(page: Page, timeout: number = 120000) {
  const banner = page.locator('.fixed.bottom-0.left-0.right-0.bg-yellow-50');

  try {
    // Wait for banner to disappear, or timeout
    await banner.waitFor({ state: 'hidden', timeout }).catch(() => {
      // Banner might not appear, which is fine
    });
  } catch {
    // If banner persists, use force:true for clicks
  }
}

export async function dismissColdStartBannerAndClick(page: Page, locator: any) {
  // First try to dismiss the banner if present
  await waitForColdStartBannerToDismiss(page, 5000);

  // Then click with force to bypass any remaining overlays
  await locator.click({ force: true });
}
