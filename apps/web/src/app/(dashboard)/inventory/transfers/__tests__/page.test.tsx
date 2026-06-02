import React from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import InventoryTransfersPage from '@/app/(dashboard)/inventory/transfers/page';

jest.mock('@/lib/api', () => ({
  api: {
    getTransfers: jest.fn().mockResolvedValue({ data: { data: [] } }),
  },
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/inventory/transfers',
}));

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}

describe('Inventory Transfers Page', () => {
  it('renders without crashing', () => {
    const { container } = renderWithProviders(<InventoryTransfersPage />);
    expect(container).toBeInTheDocument();
  });

  it('renders main content', () => {
    const { container } = renderWithProviders(<InventoryTransfersPage />);
    const main = container.querySelector('main');
    expect(main || container.firstChild).toBeTruthy();
  });
});
