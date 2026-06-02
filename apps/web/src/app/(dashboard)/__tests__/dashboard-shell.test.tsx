import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardShell } from '@/app/(dashboard)/dashboard-shell';

jest.mock('@/lib/api', () => ({
  api: { getCurrentUser: jest.fn().mockResolvedValue({ data: { name: 'Test User', email: 'test@example.com' } }) },
  auth: { clearTokens: jest.fn() },
}));

jest.mock('@/lib/hooks', () => ({
  useNotifications: jest.fn(() => ({ data: [] })),
  useMarkAllNotificationsRead: jest.fn(() => jest.fn()),
  useTheme: jest.fn(() => ({ theme: 'light', setTheme: jest.fn() })),
}));

jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({ push: jest.fn() }),
}));

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}

describe('Dashboard Shell', () => {
  it('renders with children', () => {
    const { container } = renderWithProviders(<DashboardShell><div>content</div></DashboardShell>);
    expect(container).toBeInTheDocument();
  });

  it('renders main content area', () => {
    const testContent = 'Test dashboard content';
    const { container } = renderWithProviders(<DashboardShell><div>{testContent}</div></DashboardShell>);
    expect(screen.getByText(testContent)).toBeInTheDocument();
  });

  it('accepts children prop', () => {
    const { container } = renderWithProviders(<DashboardShell><div>test</div></DashboardShell>);
    expect(screen.getByText('test')).toBeInTheDocument();
  });
});
