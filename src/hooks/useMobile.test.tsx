// SPDX-License-Identifier: AGPL-3.0-or-later
import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { useIsMobile } from './useMobile';

const MOBILE_BREAKPOINT = 768;

function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', { value: width, writable: true });
}

describe('useIsMobile', () => {
  let listeners: Array<() => void>;

  beforeEach(() => {
    listeners = [];
    const mql = {
      matches: false,
      addEventListener: vi.fn((_event: string, cb: () => void) => {
        listeners.push(cb);
      }),
      removeEventListener: vi.fn(),
    };
    vi.spyOn(window, 'matchMedia').mockReturnValue(mql as unknown as MediaQueryList);
  });

  it('returns true for mobile viewport (375px)', () => {
    setViewportWidth(375);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it('returns true for small mobile (320px)', () => {
    setViewportWidth(320);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it('returns false for tablet viewport (768px)', () => {
    setViewportWidth(768);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it('returns false for desktop viewport (1024px)', () => {
    setViewportWidth(1024);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it('responds to viewport resize from desktop to mobile', () => {
    setViewportWidth(1024);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);

    act(() => {
      setViewportWidth(375);
      for (const listener of listeners) listener();
    });
    expect(result.current).toBe(true);
  });

  it('boundary: 767px is mobile, 768px is not', () => {
    setViewportWidth(767);
    const { result: mobileResult } = renderHook(() => useIsMobile());
    expect(mobileResult.current).toBe(true);

    setViewportWidth(MOBILE_BREAKPOINT);
    const { result: tabletResult } = renderHook(() => useIsMobile());
    expect(tabletResult.current).toBe(false);
  });
});
