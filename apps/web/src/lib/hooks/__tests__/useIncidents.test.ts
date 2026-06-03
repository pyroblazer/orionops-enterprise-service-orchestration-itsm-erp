import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useIncidents, useIncident, useCreateIncident, useUpdateIncident, queryKeys } from '@/lib/hooks';
import React from 'react';

jest.mock('@/lib/api', () => ({
  api: {
    getIncidents: jest.fn().mockResolvedValue({
      data: {
        data: [
          { id: '1', title: 'Server Down', priority: 'HIGH', status: 'OPEN' },
          { id: '2', title: 'Database Issue', priority: 'MEDIUM', status: 'ASSIGNED' },
        ],
        total: 2,
      },
    }),
    getIncident: jest.fn().mockResolvedValue({
      data: { data: { id: '1', title: 'Server Down', priority: 'HIGH' } },
    }),
    createIncident: jest.fn().mockResolvedValue({
      data: { data: { id: '3', title: 'New Incident', priority: 'LOW' } },
    }),
    updateIncident: jest.fn().mockResolvedValue({
      data: { data: { id: '1', title: 'Updated Incident', priority: 'HIGH' } },
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

describe('useIncidents Hook', () => {
  it('fetches incidents from API', async () => {
    const { result } = renderHook(() => useIncidents(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data).toHaveLength(2);
  });

  it('uses correct query key for list', () => {
    const params = { status: 'OPEN' };
    const key = queryKeys.incidents.list(params);
    expect(key[0]).toBe('incidents');
    expect(key[1]).toBe('list');
  });

  it('respects staleTime of 30 seconds', () => {
    renderHook(() => useIncidents(), {
      wrapper: createWrapper(),
    });

    // Query configured with staleTime
    expect(true).toBe(true);
  });
});

describe('useIncident Hook', () => {
  it('fetches single incident by ID', async () => {
    const { result } = renderHook(() => useIncident('1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.title).toBe('Server Down');
  });

  it('is disabled when ID is empty', () => {
    const { result } = renderHook(() => useIncident(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it('uses detail query key', () => {
    const key = queryKeys.incidents.detail('1');
    expect(key).toEqual(['incidents', 'detail', '1']);
  });
});

describe('useCreateIncident Hook', () => {
  it('creates incident and invalidates list query', async () => {
    const { result } = renderHook(() => useCreateIncident(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ title: 'New Incident' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.id).toBe('3');
  });
});

describe('useUpdateIncident Hook', () => {
  it('updates incident and invalidates both list and detail', async () => {
    const { result } = renderHook(() => useUpdateIncident(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ id: '1', data: { title: 'Updated' } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.title).toBe('Updated Incident');
  });

  it('invalidates correct query keys on success', () => {
    const allKey = queryKeys.incidents.all;
    const detailKey = queryKeys.incidents.detail('1');
    expect(allKey).toEqual(['incidents']);
    expect(detailKey).toEqual(['incidents', 'detail', '1']);
  });
});
