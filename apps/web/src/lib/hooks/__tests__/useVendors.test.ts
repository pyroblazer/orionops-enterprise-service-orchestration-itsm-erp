import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useVendors, useVendor, useCreateVendor, useUpdateVendor, useVendorPerformance } from '@/lib/hooks';
import React from 'react';

jest.mock('@/lib/api', () => ({
  api: {
    getVendors: jest.fn().mockResolvedValue({
      data: {
        data: [
          { id: '1', name: 'Vendor A', type: 'software', status: 'active' },
          { id: '2', name: 'Vendor B', type: 'hardware', status: 'active' },
        ],
        total: 2,
      },
    }),
    getVendor: jest.fn().mockResolvedValue({
      data: { data: { id: '1', name: 'Vendor A', type: 'software', status: 'active' } },
    }),
    createVendor: jest.fn().mockResolvedValue({
      data: { data: { id: '3', name: 'Vendor C', type: 'services', status: 'active' } },
    }),
    updateVendor: jest.fn().mockResolvedValue({
      data: { data: { id: '1', name: 'Updated Vendor A', type: 'software', status: 'active' } },
    }),
    getVendorPerformance: jest.fn().mockResolvedValue({
      data: { data: { vendorId: '1', entries: [], averageRating: 4.5, avgSlaCompliance: 95.5, avgOnTimeDelivery: 95.5, totalTransactions: 10 } },
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

describe('useVendors Hook', () => {
  it('fetches vendors from API', async () => {
    const { result } = renderHook(() => useVendors(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data).toHaveLength(2);
    expect(result.current.data?.data?.[0]?.name).toBe('Vendor A');
  });
});

describe('useVendor Hook', () => {
  it('fetches single vendor by ID', async () => {
    const { result } = renderHook(() => useVendor('1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.id).toBe('1');
  });

  it('is disabled when ID is empty', () => {
    const { result } = renderHook(() => useVendor(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
  });
});

describe('useCreateVendor Hook', () => {
  it('creates vendor and invalidates list', async () => {
    const { result } = renderHook(() => useCreateVendor(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ name: 'Vendor C', type: 'services' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.id).toBe('3');
  });
});

describe('useUpdateVendor Hook', () => {
  it('updates vendor and invalidates queries', async () => {
    const { result } = renderHook(() => useUpdateVendor(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ id: '1', data: { name: 'Updated Vendor A' } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.name).toBe('Updated Vendor A');
  });
});

describe('useVendorPerformance Hook', () => {
  it('fetches vendor performance metrics', async () => {
    const { result } = renderHook(() => useVendorPerformance('1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.avgOnTimeDelivery).toBe(95.5);
  });
});
