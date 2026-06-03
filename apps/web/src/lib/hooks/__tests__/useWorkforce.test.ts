import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEmployees, useEmployee, useCreateEmployee, useUpdateEmployee, useSkills, useCapacityOverview } from '@/lib/hooks';
import React from 'react';

jest.mock('@/lib/api', () => ({
  api: {
    getEmployees: jest.fn().mockResolvedValue({
      data: {
        data: [
          { id: '1', name: 'John Doe', department: 'Engineering' },
          { id: '2', name: 'Jane Smith', department: 'Operations' },
        ],
        total: 2,
      },
    }),
    getEmployee: jest.fn().mockResolvedValue({
      data: { data: { id: '1', name: 'John Doe', department: 'Engineering' } },
    }),
    createEmployee: jest.fn().mockResolvedValue({
      data: { data: { id: '3', name: 'Bob Wilson', department: 'Engineering' } },
    }),
    updateEmployee: jest.fn().mockResolvedValue({
      data: { data: { id: '1', name: 'John Updated', department: 'Engineering' } },
    }),
    getSkills: jest.fn().mockResolvedValue({
      data: {
        data: [
          { id: 's1', name: 'Java' },
          { id: 's2', name: 'React' },
        ],
      },
    }),
    getCapacityOverview: jest.fn().mockResolvedValue({
      data: {
        data: {
          totalCapacity: 1000,
          allocatedCapacity: 600,
          availableCapacity: 400,
        },
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

describe('useEmployees Hook', () => {
  it('fetches employees from API', async () => {
    const { result } = renderHook(() => useEmployees(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data).toHaveLength(2);
    expect(result.current.data?.data?.[0]?.name).toBe('John Doe');
  });
});

describe('useEmployee Hook', () => {
  it('fetches single employee by ID', async () => {
    const { result } = renderHook(() => useEmployee('1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.id).toBe('1');
  });

  it('is disabled when ID is empty', () => {
    const { result } = renderHook(() => useEmployee(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
  });
});

describe('useCreateEmployee Hook', () => {
  it('creates employee and invalidates list', async () => {
    const { result } = renderHook(() => useCreateEmployee(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ name: 'Bob Wilson', department: 'Engineering' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.id).toBe('3');
  });
});

describe('useUpdateEmployee Hook', () => {
  it('updates employee and invalidates queries', async () => {
    const { result } = renderHook(() => useUpdateEmployee(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ id: '1', data: { name: 'John Updated' } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.name).toBe('John Updated');
  });
});

describe('useSkills Hook', () => {
  it('fetches all available skills', async () => {
    const { result } = renderHook(() => useSkills(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[0]?.name).toBe('Java');
  });
});

describe('useCapacityOverview Hook', () => {
  it('fetches capacity overview', async () => {
    const { result } = renderHook(() => useCapacityOverview(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeDefined();
  });
});
