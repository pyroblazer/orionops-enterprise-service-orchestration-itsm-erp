'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function SearchModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');

  const search = useQuery({
    queryKey: ['search', query],
    queryFn: async () => {
      if (!query.trim()) return null;
      const response = await api.search({
        query: query.trim(),
        page: 0,
        size: 20,
        entityTypes: ['incident', 'problem', 'change', 'knowledge'],
      });
      return response.data.data;
    },
    enabled: !!query.trim(),
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose}>
      <div
        className="fixed top-1/4 left-1/2 -translate-x-1/2 w-full max-w-2xl bg-white rounded-lg shadow-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          autoFocus
          type="text"
          placeholder="Search incidents, problems, changes, knowledge... (Ctrl+K)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full px-4 py-3 border-b outline-none text-lg"
        />

        <div className="max-h-96 overflow-y-auto">
          {search.isLoading && (
            <div className="p-4 text-center text-gray-500">Searching...</div>
          )}

          {search.data && search.data.length === 0 && query && (
            <div className="p-4 text-center text-gray-500">No results found</div>
          )}

          {search.data?.map((result: any) => (
            <a
              key={`${result.entityType}-${result.id}`}
              href={`/${result.entityType}s/${result.id}`}
              className="block p-4 hover:bg-slate-50 border-b cursor-pointer"
              onClick={onClose}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-semibold">{result.title}</div>
                  <div className="text-sm text-gray-600 line-clamp-2">{result.description}</div>
                </div>
                <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded ml-2 whitespace-nowrap">
                  {result.entityType}
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
