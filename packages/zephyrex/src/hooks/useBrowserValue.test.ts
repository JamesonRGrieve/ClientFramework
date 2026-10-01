// SPDX-License-Identifier: AGPL-3.0-or-later
import { renderHook } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { createElement } from 'react';
import { describe, expect, it } from 'vitest';
import { useBrowserValue } from './useBrowserValue';

const SERVER_VALUE = 'server';
const BROWSER_VALUE = 'browser';

function Probe(): string {
  return useBrowserValue(() => BROWSER_VALUE, SERVER_VALUE);
}

describe('useBrowserValue', () => {
  it('renders what the browser reads', () => {
    const { result } = renderHook(() => useBrowserValue(() => BROWSER_VALUE, SERVER_VALUE));
    expect(result.current).toBe(BROWSER_VALUE);
  });

  it('renders the server value on the server', () => {
    expect(renderToString(createElement(Probe))).toBe(SERVER_VALUE);
  });

  it('reads again on each render', () => {
    let value = 'first';
    const { result, rerender } = renderHook(() => useBrowserValue(() => value, SERVER_VALUE));
    expect(result.current).toBe('first');
    value = 'second';
    rerender();
    expect(result.current).toBe('second');
  });
});
