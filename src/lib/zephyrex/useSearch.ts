// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { useCallback, useState } from 'react';
import useSWR from 'swr';
import { useClient } from './hooks';

export interface SearchResult {
  id: string;
  [key: string]: unknown;
}

export function useSearch<T extends SearchResult = SearchResult>(
  endpoint: string,
  options?: { debounceMs?: number },
) {
  const client = useClient();
  const [query, setQuery] = useState('');
  const debounceMs = options?.debounceMs ?? 300;

  const { data, error, isLoading } = useSWR<T[]>(
    query.length >= 2 ? `${endpoint}?search=${encodeURIComponent(query)}` : null,
    () => client.get<T[]>(endpoint, { search: query }),
    { dedupingInterval: debounceMs },
  );

  const search = useCallback((q: string) => {
    setQuery(q);
  }, []);

  const clear = useCallback(() => {
    setQuery('');
  }, []);

  return {
    query,
    search,
    clear,
    results: data ?? [],
    error,
    isLoading,
  };
}
