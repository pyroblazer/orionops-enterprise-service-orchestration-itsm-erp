import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import FinancePage from '@/app/(dashboard)/finance/page';

jest.mock('@/lib/hooks', () => ({
  useBudgets: jest.fn(() => ({
    data: { data: [{ id: '1', name: 'IT Operations', amount: 500000, spent: 250000 }] },
    isLoading: false,
  })),
  useCostCenters: jest.fn(() => ({
    data: { data: [{ id: 'cc1', name: 'Support', budget: 100000 }] },
    isLoading: false,
  })),
}));

jest.mock('@/lib/api', () => ({
  api: {},
}));

function createQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}

describe('Finance Page', () => {
  it('renders page heading', () => {
    renderWithProviders(<FinancePage />);
    const heading = screen.queryByRole('heading', { name: /finance/i });
    expect(heading).toBeTruthy();
  });
});
