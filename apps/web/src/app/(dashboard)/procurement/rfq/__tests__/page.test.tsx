import React from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RFQManagementPage from '@/app/(dashboard)/procurement/rfq/page';

jest.mock('@/lib/api', () => ({
  api: {
    getRFQs: jest.fn().mockResolvedValue({ data: { data: [], totalPages: 0 } }),
  },
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/procurement/rfq',
}));

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}

describe('RFQ Management Page', () => {
  it('renders without crashing', () => {
    const { container } = renderWithProviders(<RFQManagementPage />);
    expect(container).toBeInTheDocument();
  });

  it('renders main content', () => {
    const { container } = renderWithProviders(<RFQManagementPage />);
    const main = container.querySelector('main');
    expect(main || container.firstChild).toBeTruthy();
  });
});
