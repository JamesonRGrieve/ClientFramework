// SPDX-License-Identifier: AGPL-3.0-or-later
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from './client';
import { OBSERVABILITY_STATUS_PATH, useObservabilityStatus } from './useObservabilityStatus';
import { TestWrapper, testConfig } from '@/__tests__/test-wrapper';

const HTTP_OK = 200;
const HTTP_FORBIDDEN = 403;

const status = {
  metrics: { backend: 'prometheus', active: true, endpoint: '/metrics' },
  error_reporter: { backend: null, active: false, dsn_set: false },
};

describe('useObservabilityStatus', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reads the status from the configured server', async () => {
    const fetchMock = vi.fn(async (url: string) =>
      Promise.resolve(
        new Response(JSON.stringify(url.endsWith(OBSERVABILITY_STATUS_PATH) ? status : {}), { status: HTTP_OK }),
      ),
    );
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useObservabilityStatus(), { wrapper: TestWrapper });
    await waitFor(() => {
      expect(result.current.data).toEqual(status);
    });
    expect(fetchMock.mock.calls.map(([url]) => url)).toContain(`${testConfig.server.baseUrl}${OBSERVABILITY_STATUS_PATH}`);
  });

  it('rejects a backend the client does not know', async () => {
    const unknown = { ...status, metrics: { ...status.metrics, backend: 'statsd' } };
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) =>
        Promise.resolve(
          new Response(JSON.stringify(url.endsWith(OBSERVABILITY_STATUS_PATH) ? unknown : {}), { status: HTTP_OK }),
        ),
      ),
    );
    const { result } = renderHook(() => useObservabilityStatus(), { wrapper: TestWrapper });
    await waitFor(() => {
      expect(result.current.error).toBeDefined();
    });
    expect(result.current.data).toBeUndefined();
  });

  it('surfaces the server’s refusal as a 403 ApiError', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.resolve(new Response('{"detail":"Root only"}', { status: HTTP_FORBIDDEN }))),
    );
    const { result } = renderHook(() => useObservabilityStatus(), { wrapper: TestWrapper });
    await waitFor(() => {
      expect(result.current.error).toBeInstanceOf(ApiError);
    });
    expect(result.current.error).toMatchObject({ status: HTTP_FORBIDDEN });
  });
});
