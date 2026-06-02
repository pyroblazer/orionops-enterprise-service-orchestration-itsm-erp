import React from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ThreeWayMatchingPage from '@/app/(dashboard)/procurement/matching/page';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/procurement/matching',
}));

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}

describe('Three-Way Matching Page', () => {
  it('renders without crashing', () => {
    const { container } = renderWithProviders(<ThreeWayMatchingPage />);
    expect(container).toBeInTheDocument();
  });

  it('renders main content', () => {
    const { container } = renderWithProviders(<ThreeWayMatchingPage />);
    const main = container.querySelector('main');
    expect(main || container.firstChild).toBeTruthy();
  });
});
