// SPDX-License-Identifier: AGPL-3.0-or-later
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useActiveExtensions } from './ExtensionRegistry';
import { useServerExtensions } from './hooks';
import type { ZephyrexClientExtension } from './types';
import { TestWrapper } from '@/__tests__/test-wrapper';

const HTTP_OK = 200;
const HTTP_UNAUTHORIZED = 401;
const HTTP_NOT_FOUND = 404;

const answer = (status: number, body: object = {}): ReturnType<typeof vi.fn> => {
  const fetchMock = vi.fn(async () => Promise.resolve(new Response(JSON.stringify(body), { status })));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

const signIn = (): void => {
  document.cookie = 'zx_csrf=csrf-1; path=/';
};

/** A client extension with no server half. */
const CLIENT_ONLY = 'client-only';
const WEBHOOKS = 'webhooks';
/** The server's row for its webhooks extension. */
const WEBHOOKS_ROW = { id: 'e1', name: WEBHOOKS };

const EXTENSIONS: ZephyrexClientExtension[] = [
  { name: CLIENT_ONLY },
  { name: WEBHOOKS, serverExtension: WEBHOOKS },
  { name: 'quota', serverExtension: 'quota' },
];

describe('useServerExtensions', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    document.cookie = 'zx_csrf=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  });

  it('asks nothing of the API without a session', () => {
    const fetchMock = answer(HTTP_OK, { extensions: [] });
    const { result } = renderHook(() => useServerExtensions(), { wrapper: TestWrapper });
    expect(result.current.data).toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([HTTP_UNAUTHORIZED, HTTP_NOT_FOUND])('reads a %i as no server extensions', async (status) => {
    signIn();
    answer(status);
    const { result } = renderHook(() => useServerExtensions(), { wrapper: TestWrapper });
    await waitFor(() => {
      expect(result.current.data).toEqual([]);
    });
    expect(result.current.error).toBeUndefined();
  });

  it('lists what a signed-in user’s server runs', async () => {
    signIn();
    answer(HTTP_OK, { extensions: [WEBHOOKS_ROW] });
    const { result } = renderHook(() => useServerExtensions(), { wrapper: TestWrapper });
    await waitFor(() => {
      expect(result.current.data).toEqual([WEBHOOKS_ROW]);
    });
  });
});

describe('useActiveExtensions', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    document.cookie = 'zx_csrf=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  });

  it('keeps only client-side extensions when there is no server list to check against', () => {
    const { result } = renderHook(() => useActiveExtensions(EXTENSIONS), { wrapper: TestWrapper });
    expect(result.current.active.map((ext) => ext.name)).toEqual([CLIENT_ONLY]);
  });

  it('adds the extensions whose server half the server runs', async () => {
    signIn();
    answer(HTTP_OK, { extensions: [WEBHOOKS_ROW] });
    const { result } = renderHook(() => useActiveExtensions(EXTENSIONS), { wrapper: TestWrapper });
    await waitFor(() => {
      expect(result.current.active.map((ext) => ext.name)).toEqual([CLIENT_ONLY, WEBHOOKS]);
    });
  });
});
