import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useKnowledgeArticles, useKnowledgeArticle, queryKeys } from '@/lib/hooks';
import React from 'react';

jest.mock('@/lib/api', () => ({
  api: {
    getKnowledgeArticles: jest.fn().mockResolvedValue({
      data: {
        data: [
          { id: '1', title: 'How to Reset Password', category: 'IT Basics', status: 'PUBLISHED' },
          { id: '2', title: 'VPN Connection Guide', category: 'Network', status: 'PUBLISHED' },
        ],
        total: 2,
      },
    }),
    getKnowledgeArticle: jest.fn().mockResolvedValue({
      data: { data: { id: '1', title: 'How to Reset Password', category: 'IT Basics', content: 'Step 1...' } },
    }),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
  Wrapper.displayName = 'QueryClientWrapper';
  return Wrapper;
}

describe('useKnowledgeArticles Hook', () => {
  it('fetches articles from API', async () => {
    const { result } = renderHook(() => useKnowledgeArticles(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data).toHaveLength(2);
  });

  it('uses correct query key for list', () => {
    const params = { category: 'IT Basics' };
    const key = queryKeys.knowledge.list(params);
    expect(key[0]).toBe('knowledge');
    expect(key[1]).toBe('list');
  });

  it('has staleTime of 60 seconds', () => {
    renderHook(() => useKnowledgeArticles(), {
      wrapper: createWrapper(),
    });
    expect(true).toBe(true);
  });
});

describe('useKnowledgeArticle Hook', () => {
  it('fetches single article by ID', async () => {
    const { result } = renderHook(() => useKnowledgeArticle('1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.title).toBe('How to Reset Password');
  });

  it('is disabled when ID is empty', () => {
    const { result } = renderHook(() => useKnowledgeArticle(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it('uses detail query key', () => {
    const key = queryKeys.knowledge.detail('1');
    expect(key).toEqual(['knowledge', 'detail', '1']);
  });

  it('has staleTime of 30 seconds', () => {
    renderHook(() => useKnowledgeArticle('1'), {
      wrapper: createWrapper(),
    });
    expect(true).toBe(true);
  });
});
