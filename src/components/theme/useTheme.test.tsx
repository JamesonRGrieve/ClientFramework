// SPDX-License-Identifier: AGPL-3.0-or-later
import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useTheme } from './useTheme';

describe('useTheme', () => {
  beforeEach(() => {
    document.cookie = 'theme=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.documentElement.className = '';
  });

  it('returns default themes', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.themes).toContain('light');
    expect(result.current.themes).toContain('dark');
    expect(result.current.themes).toContain('colorblind');
  });

  it('defaults to light theme', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.currentTheme).toBe('light');
  });

  it('accepts initial theme', () => {
    const { result } = renderHook(() => useTheme([], 'dark'));
    expect(result.current.currentTheme).toBe('dark');
  });

  it('merges custom themes', () => {
    const { result } = renderHook(() => useTheme(['custom-theme']));
    expect(result.current.themes).toContain('custom-theme');
  });

  it('setTheme updates current theme', () => {
    const { result } = renderHook(() => useTheme());
    act(() => {
      result.current.setTheme('dark');
    });
    expect(result.current.currentTheme).toBe('dark');
  });

  it('persists the choice in the theme cookie and applies it to <html>', () => {
    const { result } = renderHook(() => useTheme());
    act(() => {
      result.current.setTheme('dark');
    });
    expect(document.cookie).toContain('theme=dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    act(() => {
      result.current.setTheme('light');
    });
    expect(document.cookie).toContain('theme=light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('restores a previously persisted choice on the next visit', () => {
    document.cookie = 'theme=colorblind-dark; path=/';
    const { result } = renderHook(() => useTheme());
    expect(result.current.currentTheme).toBe('colorblind-dark');
  });
});
