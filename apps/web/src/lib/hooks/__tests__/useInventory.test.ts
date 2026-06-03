import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useInventoryItems, useInventoryItem, useCreateInventoryItem, useAssets, useAsset, useWarehouses, useStockMovements } from '@/lib/hooks';
import React from 'react';

jest.mock('@/lib/api', () => ({
  api: {
    getInventoryItems: jest.fn().mockResolvedValue({
      data: {
        data: [
          { id: 'ii1', sku: 'SKU001', quantity: 100, location: 'Warehouse A' },
          { id: 'ii2', sku: 'SKU002', quantity: 50, location: 'Warehouse B' },
        ],
        total: 2,
      },
    }),
    getInventoryItem: jest.fn().mockResolvedValue({
      data: { data: { id: 'ii1', sku: 'SKU001', quantity: 100, location: 'Warehouse A' } },
    }),
    createInventoryItem: jest.fn().mockResolvedValue({
      data: { data: { id: 'ii3', sku: 'SKU003', quantity: 75, location: 'Warehouse C' } },
    }),
    getAssets: jest.fn().mockResolvedValue({
      data: {
        data: [
          { id: 'a1', name: 'Laptop', status: 'IN_USE', location: 'Office A' },
        ],
        total: 1,
      },
    }),
    getAsset: jest.fn().mockResolvedValue({
      data: { data: { id: 'a1', name: 'Laptop', status: 'IN_USE', location: 'Office A' } },
    }),
    getWarehouses: jest.fn().mockResolvedValue({
      data: {
        data: [
          { id: 'w1', name: 'Main Warehouse', capacity: 5000 },
          { id: 'w2', name: 'Regional Hub', capacity: 2000 },
        ],
      },
    }),
    getStockMovements: jest.fn().mockResolvedValue({
      data: {
        data: [
          { id: 'sm1', itemId: 'ii1', quantity: 10, type: 'INBOUND' },
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

describe('useInventoryItems Hook', () => {
  it('fetches inventory items from API', async () => {
    const { result } = renderHook(() => useInventoryItems(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data).toHaveLength(2);
    expect(result.current.data?.data?.[0]?.sku).toBe('SKU001');
  });
});

describe('useInventoryItem Hook', () => {
  it('fetches single inventory item by ID', async () => {
    const { result } = renderHook(() => useInventoryItem('ii1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.id).toBe('ii1');
  });

  it('is disabled when ID is empty', () => {
    const { result } = renderHook(() => useInventoryItem(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
  });
});

describe('useCreateInventoryItem Hook', () => {
  it('creates inventory item and invalidates list', async () => {
    const { result } = renderHook(() => useCreateInventoryItem(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ sku: 'SKU003', quantity: 75, location: 'Warehouse C' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.id).toBe('ii3');
  });
});

describe('useAssets Hook', () => {
  it('fetches assets from API', async () => {
    const { result } = renderHook(() => useAssets(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data).toHaveLength(1);
    expect(result.current.data?.data?.[0]?.name).toBe('Laptop');
  });
});

describe('useAsset Hook', () => {
  it('fetches single asset by ID', async () => {
    const { result } = renderHook(() => useAsset('a1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.id).toBe('a1');
  });

  it('is disabled when ID is empty', () => {
    const { result } = renderHook(() => useAsset(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
  });
});

describe('useWarehouses Hook', () => {
  it('fetches all warehouses', async () => {
    const { result } = renderHook(() => useWarehouses(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[0]?.name).toBe('Main Warehouse');
  });
});

describe('useStockMovements Hook', () => {
  it('fetches stock movements', async () => {
    const { result } = renderHook(() => useStockMovements(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data).toHaveLength(1);
    expect(result.current.data?.data?.[0]?.type).toBe('INBOUND');
  });
});
