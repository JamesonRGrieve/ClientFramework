// SPDX-License-Identifier: AGPL-3.0-or-later
import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useAppearance } from './useAppearance';

describe('useAppearance', () => {
  // The hook remembers its choice in a cookie, which would otherwise carry from one test to the next.
  beforeEach(() => {
    document.cookie = 'appearance=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  });

  it('remembers the choice in the appearance cookie', () => {
    const { result } = renderHook(() => useAppearance());
    act(() => {
      result.current.setAppearance('icons');
    });
    expect(document.cookie).toContain('appearance=icons');
  });

  it('returns default appearances', () => {
    const { result } = renderHook(() => useAppearance());
    expect(result.current.appearances).toContain('icons');
    expect(result.current.appearances).toContain('labels');
  });

  it('defaults to labels', () => {
    const { result } = renderHook(() => useAppearance());
    expect(result.current.appearance).toBe('labels');
  });

  it('accepts initial appearance', () => {
    const { result } = renderHook(() => useAppearance([], 'icons'));
    expect(result.current.appearance).toBe('icons');
  });

  it('setAppearance updates current appearance', () => {
    const { result } = renderHook(() => useAppearance());
    act(() => {
      result.current.setAppearance('icons');
    });
    expect(result.current.appearance).toBe('icons');
  });
});
