import { Page } from '@playwright/test';

export async function injectMockAuth(page: Page) {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('access_token', 'mock-token-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
    localStorage.setItem('refresh_token', 'mock-refresh-token');
    localStorage.setItem('user', JSON.stringify({
      id: 'u1',
      name: 'Test User',
      email: 'test@orionops.com',
      roles: ['admin'],
    }));
  });
}

export async function injectExpiredAuth(page: Page) {
  await page.goto('/');
  await page.evaluate(() => {
    const expiredToken =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2MDAwMDAwMDB9.expired';
    localStorage.setItem('access_token', expiredToken);
    localStorage.setItem('refresh_token', 'mock-refresh-token');
    localStorage.setItem('user', JSON.stringify({
      id: 'u1',
      name: 'Test User',
      email: 'test@orionops.com',
      roles: ['admin'],
    }));
  });
}

export async function clearAuth(page: Page) {
  await page.evaluate(() => {
    try {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    } catch (e) {
      // localStorage may not be accessible on auth pages
    }
  }).catch(() => {
    // Ignore localStorage errors on protected pages
  });
}
