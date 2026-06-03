import React from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BillingPage from '@/app/(dashboard)/billing/page';

jest.mock('@/lib/api', () => ({
  api: {
    getBillingUsage: jest.fn().mockResolvedValue({
      data: {
        data: [
          { id: '1', serviceName: 'Network', quantity: 100, unitPrice: 10 },
        ],
      },
    }),
    getBillingRecords: jest.fn().mockResolvedValue({
      data: {
        data: [
          { id: '1', month: '2025-01', amount: 1000, status: 'PAID' },
        ],
      },
    }),
    getCostModels: jest.fn().mockResolvedValue({
      data: {
        data: [
          { id: '1', name: 'Flat Rate', modelType: 'FLAT' },
        ],
      },
    }),
  },
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  usePathname: () => '/billing',
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
  SelectValue: () => null,
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => (value ? <div>{children}</div> : null),
}));

jest.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TabsList: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TabsTrigger: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
  TabsContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}

describe('Billing Page', () => {
  it('renders without crashing', () => {
    const { container } = renderWithProviders(<BillingPage />);
    expect(container).toBeInTheDocument();
  });

  it('renders main content', () => {
    const { container } = renderWithProviders(<BillingPage />);
    const main = container.querySelector('main');
    expect(main || container.firstChild).toBeTruthy();
  });
});
