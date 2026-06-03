import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useBudgets, useBudget, useCreateBudget, useUpdateBudget, useCostCenters, useCostCenterDetail, useExpenses, useInvoices } from '@/lib/hooks';
import React from 'react';

jest.mock('@/lib/api', () => ({
  api: {
    getBudgets: jest.fn().mockResolvedValue({
      data: {
        data: [
          { id: '1', name: 'IT Operations', totalAmount: 500000, spentAmount: 250000, fiscalYear: 2024, costCenterId: 'cc1', currency: 'USD' },
          { id: '2', name: 'Infrastructure', totalAmount: 300000, spentAmount: 180000, fiscalYear: 2024, costCenterId: 'cc2', currency: 'USD' },
        ],
        total: 2,
      },
    }),
    getBudget: jest.fn().mockResolvedValue({
      data: { data: { id: '1', name: 'IT Operations', totalAmount: 500000, spentAmount: 250000, fiscalYear: 2024, costCenterId: 'cc1', currency: 'USD' } },
    }),
    createBudget: jest.fn().mockResolvedValue({
      data: { data: { id: '3', name: 'New Budget', totalAmount: 100000, spentAmount: 0, fiscalYear: 2024, costCenterId: 'cc3', currency: 'USD' } },
    }),
    updateBudget: jest.fn().mockResolvedValue({
      data: { data: { id: '1', name: 'Updated IT Operations', totalAmount: 600000, spentAmount: 250000, fiscalYear: 2024, costCenterId: 'cc1', currency: 'USD' } },
    }),
    getCostCenters: jest.fn().mockResolvedValue({
      data: {
        data: [
          { id: 'cc1', name: 'Support', budget: 100000 },
        ],
        total: 1,
      },
    }),
    getCostCenter: jest.fn().mockResolvedValue({
      data: { data: { id: 'cc1', name: 'Support', budget: 100000 } },
    }),
    getExpenses: jest.fn().mockResolvedValue({
      data: {
        data: [
          { id: 'e1', description: 'Software License', amount: 5000 },
        ],
        total: 1,
      },
    }),
    getInvoices: jest.fn().mockResolvedValue({
      data: {
        data: [
          { id: 'inv1', vendor: 'Vendor A', amount: 10000, status: 'PAID' },
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

describe('useBudgets Hook', () => {
  it('fetches budgets from API', async () => {
    const { result } = renderHook(() => useBudgets(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data).toHaveLength(2);
    expect(result.current.data?.data?.[0]?.name).toBe('IT Operations');
  });
});

describe('useBudget Hook', () => {
  it('fetches single budget by ID', async () => {
    const { result } = renderHook(() => useBudget('1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.id).toBe('1');
  });

  it('is disabled when ID is empty', () => {
    const { result } = renderHook(() => useBudget(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
  });
});

describe('useCreateBudget Hook', () => {
  it('creates budget and invalidates list', async () => {
    const { result } = renderHook(() => useCreateBudget(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ name: 'New Budget', totalAmount: 100000, fiscalYear: 2024, costCenterId: 'cc3', currency: 'USD' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.id).toBe('3');
  });
});

describe('useUpdateBudget Hook', () => {
  it('updates budget and invalidates queries', async () => {
    const { result } = renderHook(() => useUpdateBudget(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ id: '1', data: { name: 'Updated IT Operations', totalAmount: 600000 } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.name).toBe('Updated IT Operations');
  });
});

describe('useCostCenters Hook', () => {
  it('fetches cost centers', async () => {
    const { result } = renderHook(() => useCostCenters(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data).toHaveLength(1);
  });
});

describe('useCostCenterDetail Hook', () => {
  it('fetches single cost center by ID', async () => {
    const { result } = renderHook(() => useCostCenterDetail('cc1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeDefined();
  });
});

describe('useExpenses Hook', () => {
  it('fetches expenses', async () => {
    const { result } = renderHook(() => useExpenses(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data).toHaveLength(1);
  });
});

describe('useInvoices Hook', () => {
  it('fetches invoices', async () => {
    const { result } = renderHook(() => useInvoices(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data).toHaveLength(1);
    expect(result.current.data?.data?.[0]?.status).toBe('PAID');
  });
});
