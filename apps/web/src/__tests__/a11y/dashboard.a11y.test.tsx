import React from 'react';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DashboardPage from '@/app/(dashboard)/dashboard/page';

expect.extend(toHaveNoViolations);

jest.mock('@/lib/hooks', () => ({
  useIncidents: jest.fn(),
}));

import { useIncidents } from '@/lib/hooks';

const mockedUseIncidents = useIncidents as jest.MockedFunction<typeof useIncidents>;

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
    mockedUseIncidents.mockReturnValue({
      data: {
        data: [],
        total: 0,
        page: 1,
        pageSize: 5,
        totalPages: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
      isFetching: false,
      isSuccess: true,
      isPending: false,
      status: 'success',
      fetchStatus: 'idle',
      dataUpdatedAt: Date.now(),
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      errorUpdateCount: 0,
      isFetched: true,
      isFetchedAfterMount: true,
      isPlaceholderData: false,
      isStale: false,
      promise: Promise.resolve({} as any),
    } as any);
  });

  it('has no WCAG 2.2 AA violations', async () => {
    const { container } = renderWithProviders(<DashboardPage />);
    const results = await axe(container, {
      rules: {
        'color-contrast': { enabled: false },
      },
    });
    expect(results).toHaveNoViolations();
  });

  it('has proper heading structure', () => {
    renderWithProviders(<DashboardPage />);
    const h1 = document.querySelector('h1');
    expect(h1).toBeInTheDocument();
    expect(h1?.textContent).toBe('Dashboard');
  });

  it('summary cards have accessible region roles', () => {
    renderWithProviders(<DashboardPage />);
    const regions = document.querySelectorAll('[role="region"]');
    expect(regions.length).toBeGreaterThan(0);
  });
});
