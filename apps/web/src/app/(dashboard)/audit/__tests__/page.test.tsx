import React from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AuditPage from '@/app/(dashboard)/audit/page';

jest.mock('@/lib/api', () => ({
  api: {
    getAuditLogs: jest.fn().mockResolvedValue({
      data: {
        data: [
          { id: '1', action: 'CREATE', user: 'john@example.com', timestamp: '2025-01-15T10:00:00Z', resourceType: 'INCIDENT' },
        ],
        total: 1,
        page: 1,
        pageSize: 20,
      },
    }),
  },
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  usePathname: () => '/audit',
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

describe('Audit Log Page', () => {
  it('renders without crashing', () => {
    const { container } = renderWithProviders(<AuditPage />);
    expect(container).toBeInTheDocument();
  });

  it('renders main content', () => {
    const { container } = renderWithProviders(<AuditPage />);
    const main = container.querySelector('main');
    expect(main || container.firstChild).toBeTruthy();
  });
});
