// SPDX-License-Identifier: AGPL-3.0-or-later
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { useSearch } from './useSearch';
import { TestWrapper, testConfig } from '@/testing/TestWrapper';

const HTTP_OK = 200;
const TeamSchema = z.object({ id: z.string(), name: z.string() });
const options = { path: '/v1/team', entity: 'team', plural: 'teams', field: 'name', item: TeamSchema };

describe('useSearch', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('starts with an empty query and no results', () => {
    const { result } = renderHook(() => useSearch(options), { wrapper: TestWrapper });
    expect(result.current.query).toBe('');
    expect(result.current.results).toEqual([]);
  });

  it('does not search until the query has two characters', () => {
    const fetchMock = vi.fn(async () => Promise.resolve(new Response('{}', { status: HTTP_OK })));
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useSearch(options), { wrapper: TestWrapper });
    act(() => {
      result.current.search('a');
    });
    expect(fetchMock).not.toHaveBeenCalledWith(expect.stringContaining('/search'), expect.anything());
  });

  it('POSTs a contains-match on the field and returns the parsed results', async () => {
    const fetchMock = vi.fn(async () =>
      Promise.resolve(new Response(JSON.stringify({ teams: [{ id: 't1', name: 'Alpha' }] }), { status: HTTP_OK })),
    );
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useSearch(options), { wrapper: TestWrapper });
    act(() => {
      result.current.search('Alp');
    });
    await waitFor(() => {
      expect(result.current.results).toEqual([{ id: 't1', name: 'Alpha' }]);
    });
    expect(fetchMock).toHaveBeenCalledWith(
      `${testConfig.server.baseUrl}/v1/team/search`,
      expect.objectContaining({ method: 'POST', body: '{"team":{"name":{"inc":"Alp"}}}' }),
    );
  });

  it('clear resets the query and results', () => {
    const { result } = renderHook(() => useSearch(options), { wrapper: TestWrapper });
    act(() => {
      result.current.search('test');
    });
    act(() => {
      result.current.clear();
    });
    expect(result.current.query).toBe('');
    expect(result.current.results).toEqual([]);
  });
});
