import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCMDBItems, useCMDBItem, useCreateCMDBItem, useUpdateCMDBItem, useCMDBImpactAnalysis } from '@/lib/hooks';
import React from 'react';

jest.mock('@/lib/api', () => ({
  api: {
    getCMDBItems: jest.fn().mockResolvedValue({
      data: {
        data: [
          { id: 'ci1', name: 'Server A', type: 'SERVER' },
          { id: 'ci2', name: 'Database B', type: 'DATABASE' },
        ],
        total: 2,
      },
    }),
    getCMDBItem: jest.fn().mockResolvedValue({
      data: { data: { id: 'ci1', name: 'Server A', type: 'SERVER' } },
    }),
    createCMDBItem: jest.fn().mockResolvedValue({
      data: { data: { id: 'ci3', name: 'New CI', type: 'APPLICATION' } },
    }),
    updateCMDBItem: jest.fn().mockResolvedValue({
      data: { data: { id: 'ci1', name: 'Updated Server A', type: 'SERVER' } },
    }),
    getCMDBImpactAnalysis: jest.fn().mockResolvedValue({
      data: { data: { impacted: ['ci2', 'ci3'], impactedCount: 2 } },
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

describe('useCMDBItems Hook', () => {
  it('fetches CMDB items from API', async () => {
    const { result } = renderHook(() => useCMDBItems(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data).toHaveLength(2);
    expect(result.current.data?.data?.[0]?.name).toBe('Server A');
  });
});

describe('useCMDBItem Hook', () => {
  it('fetches single CMDB item by ID', async () => {
    const { result } = renderHook(() => useCMDBItem('ci1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.id).toBe('ci1');
    expect(result.current.data?.name).toBe('Server A');
  });

  it('is disabled when ID is empty', () => {
    const { result } = renderHook(() => useCMDBItem(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
  });
});

describe('useCreateCMDBItem Hook', () => {
  it('creates CMDB item and invalidates list', async () => {
    const { result } = renderHook(() => useCreateCMDBItem(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ name: 'New CI', type: 'APPLICATION' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.id).toBe('ci3');
  });
});

describe('useUpdateCMDBItem Hook', () => {
  it('updates CMDB item and invalidates queries', async () => {
    const { result } = renderHook(() => useUpdateCMDBItem(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ id: 'ci1', data: { name: 'Updated Server A' } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.name).toBe('Updated Server A');
  });
});

describe('useCMDBImpactAnalysis Hook', () => {
  it('fetches impact analysis for a CMDB item', async () => {
    const { result } = renderHook(() => useCMDBImpactAnalysis('ci1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.impactedCount).toBe(2);
  });
});
