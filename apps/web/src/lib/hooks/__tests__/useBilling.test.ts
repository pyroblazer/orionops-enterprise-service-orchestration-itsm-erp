import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useBillingUsage, useBillingRecords, useCostModels, queryKeys } from '@/lib/hooks';
import React from 'react';

jest.mock('@/lib/api', () => ({
  api: {
    getBillingUsage: jest.fn().mockResolvedValue({
      data: {
        data: [
          { id: '1', tenantId: 't1', usage: 1000, date: '2024-06-01' },
          { id: '2', tenantId: 't1', usage: 1200, date: '2024-06-02' },
        ],
        total: 2,
      },
    }),
    getBillingRecords: jest.fn().mockResolvedValue({
      data: {
        data: [
          { id: 'br1', tenantId: 't1', amount: 500, period: '2024-06' },
        ],
        total: 1,
      },
    }),
    getCostModels: jest.fn().mockResolvedValue({
      data: {
        data: [
          { id: 'cm1', name: 'Standard', costPerUnit: 0.5 },
        ],
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

describe('useBillingUsage Hook', () => {
  it('fetches billing usage records', async () => {
    const { result } = renderHook(() => useBillingUsage(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data).toHaveLength(2);
    expect(result.current.data?.data?.[0]?.usage).toBe(1000);
  });

  it('uses correct query key', () => {
    const key = queryKeys.billing.usage.list();
    expect(key[0]).toBe('billing');
    expect(key[1]).toBe('usage');
  });
});

describe('useBillingRecords Hook', () => {
  it('fetches billing records', async () => {
    const { result } = renderHook(() => useBillingRecords(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data).toHaveLength(1);
    expect(result.current.data?.data?.[0]?.amount).toBe(500);
  });
});

describe('useCostModels Hook', () => {
  it('fetches all cost models', async () => {
    const { result } = renderHook(() => useCostModels(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0]?.name).toBe('Standard');
  });
});
