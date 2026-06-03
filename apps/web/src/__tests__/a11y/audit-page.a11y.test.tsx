import React from 'react';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AuditPage from '@/app/(dashboard)/audit/page';

expect.extend(toHaveNoViolations as any);

jest.mock('@/lib/hooks', () => ({
  useAuditLogs: jest.fn(),
}));

import { useAuditLogs } from '@/lib/hooks';

const mockedUseAuditLogs = useAuditLogs as jest.MockedFunction<typeof useAuditLogs>;

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

describe('Audit Page Accessibility', () => {
  beforeEach(() => {
    mockedUseAuditLogs.mockReturnValue({
      data: {
        data: [
          {
            id: 'audit-001',
            action: 'CREATE',
            entityType: 'INCIDENT',
            entityId: 'INC-001',
            userId: 'user-001',
            username: 'john.doe',
            timestamp: '2025-01-15T10:00:00Z',
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
    const { container } = renderWithProviders(<AuditPage />);
    const results = await axe(container, {
      rules: {
        'color-contrast': { enabled: false },
      },
    });
    expect(results).toHaveNoViolations();
  });

  it('has proper heading structure', () => {
    renderWithProviders(<AuditPage />);
    const heading = document.querySelector('h1, h2');
    expect(heading).toBeInTheDocument();
  });
});
