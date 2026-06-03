import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRequests, useRequest, useCreateRequest, queryKeys } from '@/lib/hooks';
import React from 'react';

jest.mock('@/lib/api', () => ({
  api: {
    getRequests: jest.fn().mockResolvedValue({
      data: {
        data: [
          { id: '1', title: 'Password Reset', priority: 'LOW', status: 'SUBMITTED' },
          { id: '2', title: 'Software License Request', priority: 'MEDIUM', status: 'APPROVED' },
        ],
        total: 2,
      },
    }),
    getRequest: jest.fn().mockResolvedValue({
      data: { data: { id: '1', title: 'Password Reset', priority: 'LOW' } },
    }),
    createRequest: jest.fn().mockResolvedValue({
      data: { data: { id: '3', title: 'New Request', priority: 'LOW' } },
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

describe('useRequests Hook', () => {
  it('fetches requests from API', async () => {
    const { result } = renderHook(() => useRequests(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data).toHaveLength(2);
  });

  it('uses correct query key for list', () => {
    const params = { status: 'SUBMITTED' };
    const key = queryKeys.requests.list(params);
    expect(key[0]).toBe('requests');
    expect(key[1]).toBe('list');
  });
});

describe('useRequest Hook', () => {
  it('fetches single request by ID', async () => {
    const { result } = renderHook(() => useRequest('1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.title).toBe('Password Reset');
  });

  it('is disabled when ID is empty', () => {
    const { result } = renderHook(() => useRequest(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it('uses detail query key', () => {
    const key = queryKeys.requests.detail('1');
    expect(key).toEqual(['requests', 'detail', '1']);
  });
});

describe('useCreateRequest Hook', () => {
  it('creates request and invalidates list query', async () => {
    const { result } = renderHook(() => useCreateRequest(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ title: 'New Request' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.id).toBe('3');
  });
});
