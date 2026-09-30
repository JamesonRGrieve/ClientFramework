// SPDX-License-Identifier: AGPL-3.0-or-later
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from './client';
import { ROOT_PROVIDER_STATUS_PATH, rootProviderStatusQuery, useRootProviderStatus } from './useRootProviderStatus';
import { TestWrapper, testConfig } from '@/__tests__/test-wrapper';

const HTTP_OK = 200;
const HTTP_FORBIDDEN = 403;

describe('useRootProviderStatus', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reads the status from the configured server’s root provider endpoint', async () => {
    const fetchMock = vi.fn(async (url: string) =>
      Promise.resolve(
        url.endsWith(ROOT_PROVIDER_STATUS_PATH)
          ? new Response(JSON.stringify({ providers: [] }), { status: HTTP_OK })
          : new Response('{}', { status: HTTP_OK }),
      ),
    );
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useRootProviderStatus(), { wrapper: TestWrapper });
    await waitFor(() => {
      expect(result.current.data).toEqual({ providers: [] });
    });
    expect(fetchMock.mock.calls.map(([url]) => url)).toContain(`${testConfig.server.baseUrl}${ROOT_PROVIDER_STATUS_PATH}`);
  });

  it('asks only for what the options name', () => {
    expect(rootProviderStatusQuery({})).toEqual({});
    expect(rootProviderStatusQuery({ health: false })).toEqual({});
    expect(rootProviderStatusQuery({ extension: 'secret_vault', health: true })).toEqual({
      extension: 'secret_vault',
      health: 'true',
    });
  });

  it('reads one extension’s providers with their health checks', async () => {
    const vault = {
      providers: [
        { provider: 'env', extension: 'secret_vault', configured: true, settings: [], health: { status: 'ok', detail: '' } },
      ],
    };
    const fetchMock = vi.fn(async (url: string) =>
      Promise.resolve(
        new Response(JSON.stringify(url.includes(ROOT_PROVIDER_STATUS_PATH) ? vault : {}), { status: HTTP_OK }),
      ),
    );
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useRootProviderStatus({ extension: 'secret_vault', health: true }), {
      wrapper: TestWrapper,
    });
    await waitFor(() => {
      expect(result.current.data).toEqual(vault);
    });
    expect(fetchMock.mock.calls.map(([url]) => url)).toContain(
      `${testConfig.server.baseUrl}${ROOT_PROVIDER_STATUS_PATH}?extension=secret_vault&health=true`,
    );
  });

  it('surfaces the server’s refusal as a 403 ApiError', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.resolve(new Response('{"detail":"Root only"}', { status: HTTP_FORBIDDEN }))),
    );
    const { result } = renderHook(() => useRootProviderStatus(), { wrapper: TestWrapper });
    await waitFor(() => {
      expect(result.current.error).toBeInstanceOf(ApiError);
    });
    expect(result.current.error).toMatchObject({ status: HTTP_FORBIDDEN });
  });
});
