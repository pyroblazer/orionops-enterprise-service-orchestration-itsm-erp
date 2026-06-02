import React from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BudgetForecastPage from '@/app/(dashboard)/finance/forecast/page';

jest.mock('@/lib/api', () => ({
  api: {
    getBudgets: jest.fn().mockResolvedValue({ data: { data: [] } }),
    getBudgetAlerts: jest.fn().mockResolvedValue({ data: { data: [] } }),
  },
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/finance/forecast',
}));

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}

describe('Budget Forecast Page', () => {
  it('renders without crashing', () => {
    const { container } = renderWithProviders(<BudgetForecastPage />);
    expect(container).toBeInTheDocument();
  });

  it('renders main content', () => {
    const { container } = renderWithProviders(<BudgetForecastPage />);
    const main = container.querySelector('main');
    expect(main || container.firstChild).toBeTruthy();
  });
});
