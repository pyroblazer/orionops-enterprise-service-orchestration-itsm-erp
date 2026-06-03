import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProblems, useProblem, useCreateProblem, useUpdateProblem, queryKeys } from '@/lib/hooks';
import React from 'react';

jest.mock('@/lib/api', () => ({
  api: {
    getProblems: jest.fn().mockResolvedValue({
      data: {
        data: [
          { id: '1', title: 'Recurring Network Outages', priority: 'HIGH', status: 'INVESTIGATING' },
          { id: '2', title: 'Database Performance', priority: 'MEDIUM', status: 'ANALYZED' },
        ],
        total: 2,
      },
    }),
    getProblem: jest.fn().mockResolvedValue({
      data: { data: { id: '1', title: 'Recurring Network Outages', priority: 'HIGH' } },
    }),
    createProblem: jest.fn().mockResolvedValue({
      data: { data: { id: '3', title: 'New Problem', priority: 'MEDIUM' } },
    }),
    updateProblem: jest.fn().mockResolvedValue({
      data: { data: { id: '1', title: 'Updated Problem', priority: 'HIGH' } },
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

describe('useProblems Hook', () => {
  it('fetches problems from API', async () => {
    const { result } = renderHook(() => useProblems(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data).toHaveLength(2);
  });

  it('uses correct query key for list', () => {
    const params = { status: 'INVESTIGATING' };
    const key = queryKeys.problems.list(params);
    expect(key[0]).toBe('problems');
    expect(key[1]).toBe('list');
  });
});

describe('useProblem Hook', () => {
  it('fetches single problem by ID', async () => {
    const { result } = renderHook(() => useProblem('1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.title).toBe('Recurring Network Outages');
  });

  it('is disabled when ID is empty', () => {
    const { result } = renderHook(() => useProblem(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it('uses detail query key', () => {
    const key = queryKeys.problems.detail('1');
    expect(key).toEqual(['problems', 'detail', '1']);
  });
});

describe('useCreateProblem Hook', () => {
  it('creates problem and invalidates list query', async () => {
    const { result } = renderHook(() => useCreateProblem(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ title: 'New Problem' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.id).toBe('3');
  });
});

describe('useUpdateProblem Hook', () => {
  it('updates problem and invalidates both list and detail', async () => {
    const { result } = renderHook(() => useUpdateProblem(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ id: '1', data: { title: 'Updated' } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.title).toBe('Updated Problem');
  });

  it('invalidates correct query keys on success', () => {
    const allKey = queryKeys.problems.all;
    const detailKey = queryKeys.problems.detail('1');
    expect(allKey).toEqual(['problems']);
    expect(detailKey).toEqual(['problems', 'detail', '1']);
  });
});
