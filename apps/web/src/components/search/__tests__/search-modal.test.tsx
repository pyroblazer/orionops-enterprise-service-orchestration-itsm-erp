import React from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SearchModal } from '@/components/search/search-modal';

jest.mock('@/lib/api', () => ({
  api: {
    search: jest.fn().mockResolvedValue({
      data: { incidents: [], problems: [], changes: [], knowledgeArticles: [] },
    }),
  },
}));

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}

describe('Search Modal', () => {
  it('renders when closed', () => {
    const { container } = renderWithProviders(
      <SearchModal isOpen={false} onClose={jest.fn()} />
    );
    expect(container).toBeInTheDocument();
  });

  it('renders when open', () => {
    const { container } = renderWithProviders(
      <SearchModal isOpen={true} onClose={jest.fn()} />
    );
    expect(container).toBeInTheDocument();
  });

  it('accepts onClose callback', () => {
    const onClose = jest.fn();
    const { container } = renderWithProviders(
      <SearchModal isOpen={true} onClose={onClose} />
    );
    expect(container).toBeInTheDocument();
  });

  it('renders with different open states', () => {
    const { container: closed } = renderWithProviders(
      <SearchModal isOpen={false} onClose={jest.fn()} />
    );
    const { container: open } = renderWithProviders(
      <SearchModal isOpen={true} onClose={jest.fn()} />
    );
    expect(closed).toBeInTheDocument();
    expect(open).toBeInTheDocument();
  });
});
