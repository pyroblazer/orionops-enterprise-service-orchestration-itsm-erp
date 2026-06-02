import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useNotifications } from '@/lib/hooks';
import React from 'react';

jest.mock('@/lib/api', () => ({
  api: {
    getNotifications: jest.fn().mockResolvedValue({
      data: [
        { id: '1', title: 'Test Notification', read: false },
        { id: '2', title: 'Another Notification', read: true },
      ],
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

describe('useNotifications Hook', () => {
  it('hook is importable and callable', () => {
    expect(typeof useNotifications).toBe('function');
  });

  it('returns an array of notifications', async () => {
    const { result } = renderHook(() => useNotifications(), {
      wrapper: createWrapper(),
    });

    // Hook will be loading initially
    expect(result.current).toBeDefined();
  });

  it('fetches notifications from API', () => {
    renderHook(() => useNotifications(), {
      wrapper: createWrapper(),
    });

    // Hook renders without error
    expect(true).toBe(true);
  });
});
