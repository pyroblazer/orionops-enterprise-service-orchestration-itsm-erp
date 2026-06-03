import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSLADefinitions, useSLAInstances, useCreateSLADefinition, useUpdateSLADefinition } from '@/lib/hooks';
import React from 'react';

jest.mock('@/lib/api', () => ({
  api: {
    getSLADefinitions: jest.fn().mockResolvedValue({
      data: [
        { id: '1', name: 'P1 SLA', responseTime: 1, resolutionTime: 4 },
        { id: '2', name: 'P2 SLA', responseTime: 4, resolutionTime: 8 },
      ],
    }),
    getSLAInstances: jest.fn().mockResolvedValue({
      data: {
        data: [{ id: '1', slaDefinitionId: '1', status: 'ACTIVE', breached: false }],
        total: 1,
      },
    }),
    createSLADefinition: jest.fn().mockResolvedValue({
      data: { data: { id: '3', name: 'P3 SLA', responseTime: 8, resolutionTime: 24 } },
    }),
    updateSLADefinition: jest.fn().mockResolvedValue({
      data: { data: { id: '1', name: 'Updated P1 SLA', responseTime: 2, resolutionTime: 4 } },
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

describe('useSLADefinitions Hook', () => {
  it('fetches SLA definitions from API', async () => {
    const { result } = renderHook(() => useSLADefinitions(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(Array.isArray(result.current.data)).toBe(true);
    expect((result.current.data as any)?.length).toBe(2);
  });
});

describe('useSLAInstances Hook', () => {
  it('fetches SLA instances', async () => {
    const { result } = renderHook(() => useSLAInstances(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data).toBeDefined();
  });
});

describe('useCreateSLADefinition Hook', () => {
  it('creates SLA definition and invalidates list query', async () => {
    const { result } = renderHook(() => useCreateSLADefinition(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ name: 'P3 SLA' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.id).toBe('3');
  });
});

describe('useUpdateSLADefinition Hook', () => {
  it('updates SLA definition and invalidates queries', async () => {
    const { result } = renderHook(() => useUpdateSLADefinition(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ id: '1', data: { name: 'Updated P1 SLA' } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.name).toBe('Updated P1 SLA');
  });
});
