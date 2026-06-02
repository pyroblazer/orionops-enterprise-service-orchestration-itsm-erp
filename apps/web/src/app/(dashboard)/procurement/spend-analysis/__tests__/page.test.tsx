import React from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SpendAnalysisPage from '@/app/(dashboard)/procurement/spend-analysis/page';

jest.mock('@/lib/api', () => ({
  api: {
    getVendorConcentration: jest.fn().mockResolvedValue({ data: {} }),
  },
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/procurement/spend-analysis',
}));

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}

describe('Spend Analysis Page', () => {
  it('renders without crashing', () => {
    const { container } = renderWithProviders(<SpendAnalysisPage />);
    expect(container).toBeInTheDocument();
  });

  it('renders main content', () => {
    const { container } = renderWithProviders(<SpendAnalysisPage />);
    const main = container.querySelector('main');
    expect(main || container.firstChild).toBeTruthy();
  });
});
