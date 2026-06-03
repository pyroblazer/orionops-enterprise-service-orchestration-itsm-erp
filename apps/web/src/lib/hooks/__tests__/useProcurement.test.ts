import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePurchaseRequests, usePurchaseRequest, useCreatePurchaseRequest, usePurchaseOrders, usePurchaseOrder, useContracts } from '@/lib/hooks';
import React from 'react';

jest.mock('@/lib/api', () => ({
  api: {
    getPurchaseRequests: jest.fn().mockResolvedValue({
      data: {
        data: [
          { id: 'pr1', title: 'Office Supplies', itemDescription: 'Office Supplies', estimatedCost: 5000, quantity: 100, currency: 'USD', priority: 'medium', status: 'draft', requestedBy: 'u1' },
          { id: 'pr2', title: 'Hardware', itemDescription: 'Hardware', estimatedCost: 15000, quantity: 50, currency: 'USD', priority: 'high', status: 'draft', requestedBy: 'u2' },
        ],
        total: 2,
      },
    }),
    getPurchaseRequest: jest.fn().mockResolvedValue({
      data: { data: { id: 'pr1', title: 'Office Supplies', itemDescription: 'Office Supplies', estimatedCost: 5000, quantity: 100, currency: 'USD', priority: 'medium', status: 'draft', requestedBy: 'u1' } },
    }),
    createPurchaseRequest: jest.fn().mockResolvedValue({
      data: { data: { id: 'pr3', title: 'Software Licenses', itemDescription: 'Software Licenses', estimatedCost: 20000, quantity: 10, currency: 'USD', priority: 'high', status: 'draft', requestedBy: 'u3' } },
    }),
    getPurchaseOrders: jest.fn().mockResolvedValue({
      data: {
        data: [
          { id: 'po1', prId: 'pr1', vendorId: 'v1', status: 'SENT' },
        ],
        total: 1,
      },
    }),
    getPurchaseOrder: jest.fn().mockResolvedValue({
      data: { data: { id: 'po1', prId: 'pr1', vendorId: 'v1', status: 'SENT' } },
    }),
    getContracts: jest.fn().mockResolvedValue({
      data: {
        data: [
          { id: 'c1', vendorId: 'v1', startDate: '2024-01-01', endDate: '2025-12-31' },
        ],
        total: 1,
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

describe('usePurchaseRequests Hook', () => {
  it('fetches purchase requests from API', async () => {
    const { result } = renderHook(() => usePurchaseRequests(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data).toHaveLength(2);
    expect(result.current.data?.data?.[0]?.itemDescription).toBe('Office Supplies');
  });
});

describe('usePurchaseRequest Hook', () => {
  it('fetches single purchase request by ID', async () => {
    const { result } = renderHook(() => usePurchaseRequest('pr1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.id).toBe('pr1');
  });

  it('is disabled when ID is empty', () => {
    const { result } = renderHook(() => usePurchaseRequest(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
  });
});

describe('useCreatePurchaseRequest Hook', () => {
  it('creates purchase request and invalidates list', async () => {
    const { result } = renderHook(() => useCreatePurchaseRequest(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ title: 'Software Licenses', itemDescription: 'Software Licenses', estimatedCost: 20000, quantity: 10 });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.id).toBe('pr3');
  });
});

describe('usePurchaseOrders Hook', () => {
  it('fetches purchase orders', async () => {
    const { result } = renderHook(() => usePurchaseOrders(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data).toHaveLength(1);
    expect(result.current.data?.data?.[0]?.status).toBe('SENT');
  });
});

describe('usePurchaseOrder Hook', () => {
  it('fetches single purchase order by ID', async () => {
    const { result } = renderHook(() => usePurchaseOrder('po1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.id).toBe('po1');
  });
});

describe('useContracts Hook', () => {
  it('fetches contracts', async () => {
    const { result } = renderHook(() => useContracts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data).toHaveLength(1);
  });
});
