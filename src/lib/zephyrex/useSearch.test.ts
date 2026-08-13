// SPDX-License-Identifier: AGPL-3.0-or-later
import { renderHook, act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TestWrapper } from '@/__tests__/test-wrapper';
import { useSearch } from './useSearch';

describe('useSearch', () => {
  it('starts with empty query and no results', () => {
    const { result } = renderHook(() => useSearch('/v1/user'), { wrapper: TestWrapper });
    expect(result.current.query).toBe('');
    expect(result.current.results).toEqual([]);
  });

  it('search updates query', () => {
    const { result } = renderHook(() => useSearch('/v1/user'), { wrapper: TestWrapper });
    act(() => {
      result.current.search('test');
    });
    expect(result.current.query).toBe('test');
  });

  it('clear resets query', () => {
    const { result } = renderHook(() => useSearch('/v1/user'), { wrapper: TestWrapper });
    act(() => {
      result.current.search('test');
    });
    act(() => {
      result.current.clear();
    });
    expect(result.current.query).toBe('');
  });
});
