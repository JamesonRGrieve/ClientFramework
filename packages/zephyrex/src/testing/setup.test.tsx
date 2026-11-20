// SPDX-License-Identifier: AGPL-3.0-or-later
import { act, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Toaster } from '../components/ui/toaster';
import { clearToasts, notify } from '../hooks/useToast';
import { installJsdomStandIns } from './setup';

const NOTICE = 'Peonies deleted';

describe('zephyrex/testing/setup', () => {
  it('gives jsdom the layout and pointer stand-ins Radix needs', () => {
    installJsdomStandIns();
    expect(typeof window.ResizeObserver).toBe('function');
    expect(typeof window.matchMedia).toBe('function');
    expect(document.body.hasPointerCapture(1)).toBe(false);
  });

  it('installs matchMedia where jsdom has the property but no function', () => {
    Object.defineProperty(window, 'matchMedia', { writable: true, configurable: true, value: undefined });
    installJsdomStandIns();
    expect(window.matchMedia('(prefers-color-scheme: dark)').matches).toBe(false);
  });

  it('clears every notice, so none outlives its test', () => {
    render(<Toaster />);
    act(() => {
      notify(NOTICE);
    });
    expect(screen.getByText(NOTICE)).toBeInTheDocument();
    act(() => {
      clearToasts();
    });
    expect(screen.queryByText(NOTICE)).toBeNull();
  });
});
