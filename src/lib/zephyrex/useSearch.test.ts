// SPDX-License-Identifier: AGPL-3.0-or-later
import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('./hooks', () => ({
  useClient: vi.fn(() => ({
    get: vi.fn().mockResolvedValue([{ id: '1', name: 'Result' }]),
  })),
}));

vi.mock('swr', () => ({
  default: vi.fn((key: string | null) => ({
    data: key ? [{ id: '1', name: 'Result' }] : undefined,
    error: undefined,
    isLoading: false,
  })),
}));

import { useSearch } from './useSearch';

describe('useSearch', () => {
  it('starts with empty query and no results', () => {
    const { result } = renderHook(() => useSearch('/v1/user'));
    expect(result.current.query).toBe('');
    expect(result.current.results).toEqual([]);
  });

  it('search updates query', () => {
    const { result } = renderHook(() => useSearch('/v1/user'));
    act(() => { result.current.search('test'); });
    expect(result.current.query).toBe('test');
  });

  it('returns results when query is long enough', () => {
    const { result } = renderHook(() => useSearch('/v1/user'));
    act(() => { result.current.search('ab'); });
    expect(result.current.results).toEqual([{ id: '1', name: 'Result' }]);
  });

  it('clear resets query', () => {
    const { result } = renderHook(() => useSearch('/v1/user'));
    act(() => { result.current.search('test'); });
    act(() => { result.current.clear(); });
    expect(result.current.query).toBe('');
  });
});
