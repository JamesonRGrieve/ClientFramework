// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { useCallback, useState } from 'react';
import useSWR from 'swr';
import { z } from 'zod';
import { useClient } from './hooks';

const MIN_QUERY_LENGTH = 2;
const DEFAULT_DEBOUNCE_MS = 300;

export interface SearchOptions<T> {
  /** The resource's route, e.g. `/v1/team`; the search runs as POST `${path}/search`. */
  path: string;
  /** The resource's singular body key, e.g. `team`. */
  entity: string;
  /** The response's list key, e.g. `teams`. */
  plural: string;
  /** The string field to match, e.g. `name`. */
  field: string;
  /** Each result's shape. */
  item: z.ZodType<T>;
  debounceMs?: number;
}

export interface SearchState<T> {
  query: string;
  search: (query: string) => void;
  clear: () => void;
  results: T[];
  error: Error | undefined;
  isLoading: boolean;
}

/**
 * Search a resource with the server's generic search route: records whose `field`
 * contains the query (`{ [entity]: { [field]: { inc: query } } }`). Needs two characters.
 */
export function useSearch<T>({
  path,
  entity,
  plural,
  field,
  item,
  debounceMs = DEFAULT_DEBOUNCE_MS,
}: SearchOptions<T>): SearchState<T> {
  const client = useClient();
  const [query, setQuery] = useState('');

  const { data, error, isLoading } = useSWR<T[], Error>(
    query.length >= MIN_QUERY_LENGTH ? [`${path}/search`, field, query] : null,
    async () => {
      const response = await client.post(`${path}/search`, { [entity]: { [field]: { inc: query } } });
      return z.object({ [plural]: z.array(item) }).parse(response)[plural] ?? [];
    },
    { dedupingInterval: debounceMs },
  );

  const search = useCallback((next: string) => {
    setQuery(next);
  }, []);

  const clear = useCallback(() => {
    setQuery('');
  }, []);

  return { query, search, clear, results: data ?? [], error, isLoading };
}
