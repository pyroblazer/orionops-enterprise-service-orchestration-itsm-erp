import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DashboardShell } from '../dashboard-shell';
import * as hooksModule from '@/lib/hooks';
import { createMockNotification, mockUseNotifications, mockUseMarkAllNotificationsRead, mockUseTheme } from '@/lib/__tests__/mocks/hooks';

jest.mock('@/lib/hooks');
jest.mock('@/lib/api');
jest.mock('next/navigation');
jest.mock('@/components/ui/sidebar', () => ({ Sidebar: () => <div data-testid="sidebar">Sidebar</div> }));
jest.mock('@/components/search/search-modal', () => ({ SearchModal: () => <div>SearchModal</div> }));
jest.mock('@/components/tutorial/interactive-tutorial', () => ({
  InteractiveTutorial: () => <div>Tutorial</div>,
  useTutorialState: jest.fn(() => ({
    showTutorial: false,
    startTutorial: jest.fn(),
    handleTutorialClose: jest.fn(),
  })),
}));

describe('DashboardShell', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (hooksModule.useNotifications as jest.Mock).mockReturnValue(mockUseNotifications([]));
    (hooksModule.useMarkAllNotificationsRead as jest.Mock).mockReturnValue(mockUseMarkAllNotificationsRead());
    (hooksModule.useTheme as jest.Mock).mockReturnValue(mockUseTheme());
  });

  it('renders dashboard shell', () => {
    render(<DashboardShell><div>Test</div></DashboardShell>);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('displays unread notification count when notifications exist', () => {
    const notifications = [
      createMockNotification({ id: '1', read: false }),
      createMockNotification({ id: '2', read: false }),
    ];
    (hooksModule.useNotifications as jest.Mock).mockReturnValue(mockUseNotifications(notifications));
    
    render(<DashboardShell><div>Test</div></DashboardShell>);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('calls markAllRead.mutate when mark all read button is clicked', async () => {
    const mockMutate = jest.fn();
    (hooksModule.useMarkAllNotificationsRead as jest.Mock).mockReturnValue({ mutate: mockMutate });
    const notifications = [createMockNotification({ id: '1', read: false })];
    (hooksModule.useNotifications as jest.Mock).mockReturnValue(mockUseNotifications(notifications));
    
    render(<DashboardShell><div>Test</div></DashboardShell>);
    const user = userEvent.setup();
    // Open the notifications dropdown first — "Mark all read" lives inside it.
    await user.click(screen.getByRole('button', { name: /Notifications:/i }));
    await user.click(await screen.findByText('Mark all read'));
    expect(mockMutate).toHaveBeenCalled();
  });
});
