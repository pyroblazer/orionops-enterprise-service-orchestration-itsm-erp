import React from 'react';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProblemsListPage from '@/app/(dashboard)/problems/page';

expect.extend(toHaveNoViolations as any);

jest.mock('@/lib/hooks', () => ({
  useProblems: jest.fn(),
}));

import { useProblems } from '@/lib/hooks';

const mockedUseProblems = useProblems as jest.MockedFunction<typeof useProblems>;

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

describe('Problems List Page Accessibility', () => {
  beforeEach(() => {
    mockedUseProblems.mockReturnValue({
      data: {
        data: [
          {
            id: 'prb-001',
            title: 'Recurring network issue',
            status: 'INVESTIGATING',
            priority: 'HIGH',
            createdAt: '2025-01-15T10:00:00Z',
          },
        ],
        total: 1,
        page: 1,
        pageSize: 20,
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
    const { container } = renderWithProviders(<ProblemsListPage />);
    const results = await axe(container, {
      rules: {
        'color-contrast': { enabled: false },
      },
    });
    expect(results).toHaveNoViolations();
  });

  it('has proper heading structure', () => {
    renderWithProviders(<ProblemsListPage />);
    const h1 = document.querySelector('h1');
    expect(h1).toBeInTheDocument();
    expect(h1?.textContent).toBe('Problems');
  });

  it('has accessible table structure', () => {
    renderWithProviders(<ProblemsListPage />);
    const table = document.querySelector('[role="table"]');
    expect(table).toBeInTheDocument();
  });
});
