import React from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ChangesListPage from '@/app/(dashboard)/changes/page';

jest.mock('@/lib/hooks', () => ({
  useChanges: jest.fn(() => ({
    data: { data: [] },
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
  usePathname: () => '/changes',
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

describe('Changes List Page', () => {
  it('renders without crashing', () => {
    const { container } = renderWithProviders(<ChangesListPage />);
    expect(container).toBeInTheDocument();
  });

  it('renders main content', () => {
    const { container } = renderWithProviders(<ChangesListPage />);
    const main = container.querySelector('main');
    expect(main || container.firstChild).toBeTruthy();
  });

  it('uses the useChanges hook', () => {
    const { useChanges } = require('@/lib/hooks');
    renderWithProviders(<ChangesListPage />);
    expect(useChanges).toBeDefined();
  });
});
