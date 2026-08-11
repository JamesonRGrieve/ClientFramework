// SPDX-License-Identifier: AGPL-3.0-or-later
import { renderHook, act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useAppearance } from './useAppearance';

describe('useAppearance', () => {
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
