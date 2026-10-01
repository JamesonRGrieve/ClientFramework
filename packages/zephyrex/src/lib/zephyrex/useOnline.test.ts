// SPDX-License-Identifier: AGPL-3.0-or-later
import { renderHook, act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useOnline } from './useOnline';

describe('useOnline', () => {
  it('defaults to online', () => {
    const { result } = renderHook(() => useOnline());
    expect(result.current).toBe(true);
  });

  it('responds to offline event', () => {
    const { result } = renderHook(() => useOnline());
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    expect(result.current).toBe(false);
  });

  it('responds to online event', () => {
    const { result } = renderHook(() => useOnline());
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    expect(result.current).toBe(false);
    act(() => {
      window.dispatchEvent(new Event('online'));
    });
    expect(result.current).toBe(true);
  });
});
