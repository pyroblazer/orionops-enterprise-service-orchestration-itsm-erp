import { Page } from '@playwright/test';

/**
 * Inject mock authentication state WITHOUT navigating to any page.
 * Sets cookies via the context API and localStorage via addInitScript.
 * This avoids frame detachment errors that occur when navigating twice in sequence.
 */
export async function injectMockAuth(page: Page) {
  const context = page.context();

  // Set auth cookie via context API (works before any navigation)
  await context.addCookies([{
    name: 'orionops_authenticated',
    value: 'true',
    domain: 'localhost',
    path: '/',
  }]);

  // Inject localStorage values via addInitScript so they're set on every page load
  await page.addInitScript(() => {
    localStorage.setItem('orionops_access_token', 'mock-token-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
    localStorage.setItem('orionops_refresh_token', 'mock-refresh-token');
    localStorage.setItem('user', JSON.stringify({
      id: 'u1',
      name: 'Test User',
      email: 'test@orionops.com',
      roles: ['admin'],
    }));
  });
}

export async function injectExpiredAuth(page: Page) {
  const context = page.context();
  await context.addCookies([{
    name: 'orionops_authenticated',
    value: 'true',
    domain: 'localhost',
    path: '/',
  }]);
  await page.addInitScript(() => {
    const expiredToken =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2MDAwMDAwMDB9.expired';
    localStorage.setItem('orionops_access_token', expiredToken);
    localStorage.setItem('orionops_refresh_token', 'mock-refresh-token');
    localStorage.setItem('user', JSON.stringify({
      id: 'u1',
      name: 'Test User',
      email: 'test@orionops.com',
      roles: ['admin'],
    }));
  });
}

export async function clearAuth(page: Page) {
  await page.context().clearCookies();
  await page.evaluate(() => {
    try {
      localStorage.removeItem('orionops_access_token');
      localStorage.removeItem('orionops_refresh_token');
      localStorage.removeItem('user');
    } catch (e) {
      // localStorage may not be accessible on auth pages
    }
  }).catch(() => {
    // Ignore localStorage errors on protected pages
  });
}

export async function setupCallbackAuth(page: Page, code = 'mock-auth-code') {
  await page.evaluate(() => {
    sessionStorage.setItem('orionops_oauth_state', 'mock-state-value');
    sessionStorage.setItem('orionops_pkce_verifier', 'mock-pkce-verifier');
  });
}

/**
 * Mock all unmatched API calls with empty responses. Register this AFTER
 * your specific route mocks so the specific ones take priority.
 * Playwright checks routes in registration order (first match wins).
 */
export async function mockUnmatchedApiCalls(page: Page) {
  await page.route('**/api/v1/**', async (route) => {
    const method = route.request().method();
    if (method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [], total: 0 }),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: {} }),
    });
  });
}
