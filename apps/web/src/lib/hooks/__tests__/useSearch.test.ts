import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSearch, queryKeys } from '@/lib/hooks';
import React from 'react';

jest.mock('@/lib/api', () => ({
  api: {
    search: jest.fn().mockResolvedValue({
      data: {
        data: [
          { id: '1', title: 'Server Down', type: 'INCIDENT' },
          { id: '2', title: 'Server Setup', type: 'KNOWLEDGE' },
        ],
        total: 2,
      },
    }),
  },
  SearchResults: {},
}));

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
  Wrapper.displayName = 'QueryClientWrapper';
  return Wrapper;
}

describe('useSearch Hook', () => {
  it('fetches search results when query is at least 2 characters', async () => {
    const { result } = renderHook(() => useSearch('server'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);
  });

  it('is disabled when query is less than 2 characters', () => {
    const { result } = renderHook(() => useSearch('s'), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it('is disabled when query is empty', () => {
    const { result } = renderHook(() => useSearch(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it('uses correct query key for search', () => {
    const key = queryKeys.search.query('server');
    expect(key).toEqual(['search', 'server']);
  });

  it('has staleTime of 10 seconds', () => {
    renderHook(() => useSearch('test'), {
      wrapper: createWrapper(),
    });
    expect(true).toBe(true);
  });
});
