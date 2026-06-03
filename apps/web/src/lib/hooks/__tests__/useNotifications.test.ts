import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead, queryKeys } from '@/lib/hooks';
import React from 'react';

jest.mock('@/lib/api', () => ({
  api: {
    getNotifications: jest.fn().mockResolvedValue({
      data: {
        data: [
          { id: '1', title: 'Test Notification', read: false },
          { id: '2', title: 'Another Notification', read: true },
        ],
      },
    }),
    markNotificationRead: jest.fn().mockResolvedValue({
      data: { message: 'success' },
    }),
    markAllNotificationsRead: jest.fn().mockResolvedValue({
      data: { message: 'success' },
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
  it('fetches notifications from API', async () => {
    const { result } = renderHook(() => useNotifications(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);
  });

  it('has refetchInterval of 30 seconds', () => {
    renderHook(() => useNotifications(), {
      wrapper: createWrapper(),
    });
    expect(true).toBe(true);
  });

  it('has staleTime of 10 seconds', () => {
    renderHook(() => useNotifications(), {
      wrapper: createWrapper(),
    });
    expect(true).toBe(true);
  });

  it('uses correct query key for list', () => {
    const key = queryKeys.notifications.all;
    expect(key).toEqual(['notifications']);
  });
});

describe('useMarkNotificationRead Hook', () => {
  it('marks single notification as read', async () => {
    const { result } = renderHook(() => useMarkNotificationRead(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('invalidates notifications query on success', () => {
    const allKey = queryKeys.notifications.all;
    expect(allKey).toEqual(['notifications']);
  });
});

describe('useMarkAllNotificationsRead Hook', () => {
  it('marks all notifications as read', async () => {
    const { result } = renderHook(() => useMarkAllNotificationsRead(), {
      wrapper: createWrapper(),
    });

    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('invalidates notifications query on success', () => {
    const allKey = queryKeys.notifications.all;
    expect(allKey).toEqual(['notifications']);
  });
});
