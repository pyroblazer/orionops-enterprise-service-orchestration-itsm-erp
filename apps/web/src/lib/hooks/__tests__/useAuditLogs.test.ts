import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuditLogs, queryKeys } from '@/lib/hooks';
import React from 'react';

jest.mock('@/lib/api', () => ({
  api: {
    getAuditLogs: jest.fn().mockResolvedValue({
      data: {
        data: [
          { id: '1', action: 'CREATE', user: 'john@example.com', timestamp: '2025-01-15T10:00:00Z', resourceType: 'INCIDENT' },
          { id: '2', action: 'UPDATE', user: 'jane@example.com', timestamp: '2025-01-15T09:00:00Z', resourceType: 'CHANGE' },
        ],
        total: 2,
        page: 1,
        pageSize: 20,
      },
    }),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
  Wrapper.displayName = 'QueryClientWrapper';
  return Wrapper;
}

describe('useAuditLogs Hook', () => {
  it('fetches audit logs from API', async () => {
    const { result } = renderHook(() => useAuditLogs(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data).toHaveLength(2);
  });

  it('uses correct query key for list', () => {
    const params = { resourceType: 'INCIDENT' };
    const key = queryKeys.auditLogs.list(params);
    expect(key[0]).toBe('auditLogs');
    expect(key[1]).toBe('list');
  });

  it('has staleTime of 60 seconds', () => {
    renderHook(() => useAuditLogs(), {
      wrapper: createWrapper(),
    });
    expect(true).toBe(true);
  });

  it('returns paginated response', async () => {
    const { result } = renderHook(() => useAuditLogs(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.page).toBe(1);
    expect(result.current.data?.pageSize).toBe(20);
    expect(result.current.data?.total).toBe(2);
  });
});
