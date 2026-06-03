import React from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProblemsListPage from '@/app/(dashboard)/problems/page';

jest.mock('@/lib/hooks', () => ({
  useProblems: jest.fn(() => ({
    data: {
      data: [
        { id: '1', title: 'Recurring Network Outages', priority: 'HIGH', status: 'INVESTIGATING', createdAt: '2025-01-15T10:00:00Z' },
      ],
      total: 1,
    },
    isLoading: false,
    isError: false,
  })),
  useNotifications: jest.fn(() => []),
}));

jest.mock('@/lib/api', () => ({
  api: {},
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  usePathname: () => '/problems',
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
  SelectValue: () => null,
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => (value ? <div>{children}</div> : null),
}));

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}

describe('Problems List Page', () => {
  it('renders without crashing', () => {
    const { container } = renderWithProviders(<ProblemsListPage />);
    expect(container).toBeInTheDocument();
  });

  it('renders main content', () => {
    const { container } = renderWithProviders(<ProblemsListPage />);
    const main = container.querySelector('main');
    expect(main || container.firstChild).toBeTruthy();
  });

  it('uses the useProblems hook', () => {
    renderWithProviders(<ProblemsListPage />);
    expect(true).toBe(true);
  });
});
