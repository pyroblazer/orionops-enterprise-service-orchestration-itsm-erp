import React from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SoDPage from '@/app/(dashboard)/compliance/sod/page';

jest.mock('@/lib/api', () => ({
  api: {
    getSoDRules: jest.fn().mockResolvedValue({ data: { data: [] } }),
  },
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/compliance/sod',
}));

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}

describe('Segregation of Duties Page', () => {
  it('renders without crashing', () => {
    const { container } = renderWithProviders(<SoDPage />);
    expect(container).toBeInTheDocument();
  });

  it('renders main content', () => {
    const { container } = renderWithProviders(<SoDPage />);
    const main = container.querySelector('main');
    expect(main || container.firstChild).toBeTruthy();
  });
});
