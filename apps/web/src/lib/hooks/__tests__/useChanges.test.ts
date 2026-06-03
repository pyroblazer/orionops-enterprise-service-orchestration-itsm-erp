import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useChanges, useChange, useCreateChange, useUpdateChange, queryKeys } from '@/lib/hooks';
import React from 'react';

jest.mock('@/lib/api', () => ({
  api: {
    getChanges: jest.fn().mockResolvedValue({
      data: {
        data: [
          { id: '1', title: 'OS Patch Update', priority: 'MEDIUM', status: 'SCHEDULED', riskLevel: 'LOW' },
          { id: '2', title: 'Database Migration', priority: 'HIGH', status: 'AUTHORIZED', riskLevel: 'HIGH' },
        ],
        total: 2,
      },
    }),
    getChange: jest.fn().mockResolvedValue({
      data: { data: { id: '1', title: 'OS Patch Update', priority: 'MEDIUM', riskLevel: 'LOW' } },
    }),
    createChange: jest.fn().mockResolvedValue({
      data: { data: { id: '3', title: 'New Change', priority: 'MEDIUM', riskLevel: 'MEDIUM' } },
    }),
    updateChange: jest.fn().mockResolvedValue({
      data: { data: { id: '1', title: 'Updated Change', priority: 'MEDIUM' } },
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

describe('useChanges Hook', () => {
  it('fetches changes from API', async () => {
    const { result } = renderHook(() => useChanges(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data).toHaveLength(2);
  });

  it('uses correct query key for list', () => {
    const params = { status: 'SCHEDULED' };
    const key = queryKeys.changes.list(params);
    expect(key[0]).toBe('changes');
    expect(key[1]).toBe('list');
  });
});

describe('useChange Hook', () => {
  it('fetches single change by ID', async () => {
    const { result } = renderHook(() => useChange('1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.title).toBe('OS Patch Update');
  });

  it('is disabled when ID is empty', () => {
    const { result } = renderHook(() => useChange(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it('uses detail query key', () => {
    const key = queryKeys.changes.detail('1');
    expect(key).toEqual(['changes', 'detail', '1']);
  });
});

describe('useCreateChange Hook', () => {
  it('creates change and invalidates list query', async () => {
    const { result } = renderHook(() => useCreateChange(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ title: 'New Change' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.id).toBe('3');
  });
});

describe('useUpdateChange Hook', () => {
  it('updates change and invalidates both list and detail', async () => {
    const { result } = renderHook(() => useUpdateChange(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ id: '1', data: { title: 'Updated' } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.title).toBe('Updated Change');
  });

  it('invalidates correct query keys on success', () => {
    const allKey = queryKeys.changes.all;
    const detailKey = queryKeys.changes.detail('1');
    expect(allKey).toEqual(['changes']);
    expect(detailKey).toEqual(['changes', 'detail', '1']);
  });
});
