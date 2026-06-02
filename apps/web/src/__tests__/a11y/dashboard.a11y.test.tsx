import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@/__tests__/mocks/server';
import DashboardPage from '@/app/(dashboard)/dashboard/page';

expect.extend(toHaveNoViolations as any);

function createQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}

describe('Dashboard Accessibility', () => {
  beforeEach(() => {
    server.use(
      http.get('http://localhost:8080/api/v1/incidents', () =>
        HttpResponse.json({
          data: [
            { id: '1', title: 'Critical API Error', status: 'open', priority: 'critical' },
          ],
          total: 5,
          page: 1,
          pageSize: 5,
          totalPages: 1,
        })
      ),
      http.get('http://localhost:8080/api/v1/changes', () =>
        HttpResponse.json({
          data: [],
          total: 2,
          page: 1,
          pageSize: 10,
          totalPages: 1,
        })
      ),
      http.get('http://localhost:8080/api/v1/sla/instances', () =>
        HttpResponse.json({
          data: [
            { id: '1', status: 'met' },
            { id: '2', status: 'met' },
          ],
          total: 2,
          page: 1,
          pageSize: 200,
          totalPages: 1,
        })
      )
    );
  });

  it('has no WCAG 2.2 AA violations', async () => {
    const { container } = renderWithProviders(<DashboardPage />);
    await waitFor(() => {
      expect(document.querySelector('h1')).toBeInTheDocument();
    });
    const results = await axe(container, {
      rules: {
        'color-contrast': { enabled: false },
      },
    });
    expect(results).toHaveNoViolations();
  });

  it('has proper heading structure', async () => {
    renderWithProviders(<DashboardPage />);
    await waitFor(() => {
      const h1 = document.querySelector('h1');
      expect(h1).toBeInTheDocument();
      expect(h1?.textContent).toBe('Dashboard');
    });
  });

  it('summary cards are rendered as card containers', async () => {
    renderWithProviders(<DashboardPage />);
    await waitFor(() => {
      const cards = document.querySelectorAll('.rounded-2xl.bg-card');
      expect(cards.length).toBeGreaterThan(0);
    });
  });
});
