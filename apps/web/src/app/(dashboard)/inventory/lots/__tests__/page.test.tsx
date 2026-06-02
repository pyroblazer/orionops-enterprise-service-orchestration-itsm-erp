import React from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LotTrackingPage from '@/app/(dashboard)/inventory/lots/page';

jest.mock('@/lib/api', () => ({
  api: {
    getLots: jest.fn().mockResolvedValue({ data: { data: [] } }),
    getExpiringLots: jest.fn().mockResolvedValue({ data: { data: [] } }),
  },
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/inventory/lots',
}));

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}

describe('Lot Tracking Page', () => {
  it('renders without crashing', () => {
    const { container } = renderWithProviders(<LotTrackingPage />);
    expect(container).toBeInTheDocument();
  });

  it('renders main content', () => {
    const { container } = renderWithProviders(<LotTrackingPage />);
    const main = container.querySelector('main');
    expect(main || container.firstChild).toBeTruthy();
  });
});
