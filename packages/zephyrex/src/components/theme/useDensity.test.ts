// SPDX-License-Identifier: AGPL-3.0-or-later
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useDensity } from './useDensity';

const COMPACT = 'compact';

describe('useDensity', () => {
  beforeEach(() => {
    document.cookie = 'density=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    delete document.documentElement.dataset.density;
  });

  it('is comfortable by default, with no attribute on <html>', () => {
    const { result } = renderHook(() => useDensity());
    expect(result.current.density).toBe('comfortable');
    expect(document.documentElement.dataset.density).toBeUndefined();
  });

  it('marks <html> and keeps the choice in the density cookie', () => {
    const { result } = renderHook(() => useDensity());
    act(() => {
      result.current.setDensity(COMPACT);
    });
    expect(document.documentElement.dataset.density).toBe(COMPACT);
    expect(document.cookie).toContain('density=compact');
    act(() => {
      result.current.setDensity('comfortable');
    });
    expect(document.documentElement.dataset.density).toBeUndefined();
  });

  it('starts from the cookie, or from the server’s read of it', () => {
    document.cookie = 'density=compact; path=/';
    expect(renderHook(() => useDensity()).result.current.density).toBe(COMPACT);
    expect(renderHook(() => useDensity('comfortable')).result.current.density).toBe('comfortable');
  });
});
