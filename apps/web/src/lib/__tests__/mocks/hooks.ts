// Test utilities for mocking hooks used across components

export interface MockNotification {
  id: string;
  read: boolean;
  title: string;
  message: string;
  notificationType?: string;
}

export const createMockNotification = (overrides: Partial<MockNotification> = {}): MockNotification => ({
  id: 'test-notification-1',
  read: false,
  title: 'Test Notification',
  message: 'This is a test notification',
  ...overrides,
});

export const mockUseNotifications = (notifications: MockNotification[] = []) => ({
  data: notifications,
  isLoading: false,
  error: null,
  isError: false,
  status: 'success' as const,
  refetch: jest.fn(),
});

export const mockUseMarkAllNotificationsRead = () => ({
  mutate: jest.fn(),
  mutateAsync: jest.fn(),
  isPending: false,
  isError: false,
  error: null,
  status: 'idle' as const,
});

export const mockUseTheme = () => ({
  theme: 'light' as const,
  setTheme: jest.fn(),
});
