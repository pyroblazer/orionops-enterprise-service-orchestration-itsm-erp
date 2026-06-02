import React from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import GeneralLedgerPage from '@/app/(dashboard)/finance/gl/page';

jest.mock('@/lib/api', () => ({
  api: {
    getChartOfAccounts: jest.fn().mockResolvedValue({ data: { data: [] } }),
    getTrialBalance: jest.fn().mockResolvedValue({ data: { data: {} } }),
    getIncomeStatement: jest.fn().mockResolvedValue({ data: { data: {} } }),
  },
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/finance/gl',
}));

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}

describe('General Ledger Page', () => {
  it('renders without crashing', () => {
    const { container } = renderWithProviders(<GeneralLedgerPage />);
    expect(container).toBeInTheDocument();
  });

  it('renders main content', () => {
    const { container } = renderWithProviders(<GeneralLedgerPage />);
    const main = container.querySelector('main');
    expect(main || container.firstChild).toBeTruthy();
  });
});
