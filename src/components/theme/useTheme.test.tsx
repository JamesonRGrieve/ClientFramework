// SPDX-License-Identifier: AGPL-3.0-or-later
import { renderHook, act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useTheme } from './useTheme';

describe('useTheme', () => {
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
});
