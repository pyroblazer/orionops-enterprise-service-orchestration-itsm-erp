import React from 'react';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import IncidentsListPage from '@/app/(dashboard)/incidents/page';

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

describe('Incident List Page Accessibility', () => {
  beforeEach(() => {
    mockedUseIncidents.mockReturnValue({
      data: {
        data: [
          {
            id: 'inc-001',
            title: 'Test incident',
            status: 'new',
            priority: 'high',
            assignedToName: 'John Doe',
            serviceName: 'Network',
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
    const { container } = renderWithProviders(<IncidentsListPage />);
    const results = await axe(container, {
      rules: {
        // Color contrast requires actual CSS, so we skip in unit tests
        'color-contrast': { enabled: false },
      },
    });
    expect(results).toHaveNoViolations();
  });

  it('has proper heading structure', () => {
    renderWithProviders(<IncidentsListPage />);
    const h1 = document.querySelector('h1');
    expect(h1).toBeInTheDocument();
    expect(h1?.textContent).toBe('Incidents');
  });

  it('has accessible table structure', () => {
    renderWithProviders(<IncidentsListPage />);
    const table = document.querySelector('[role="table"]');
    expect(table).toBeInTheDocument();
  });
});
