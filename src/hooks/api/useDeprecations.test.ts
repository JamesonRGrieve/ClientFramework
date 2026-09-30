// SPDX-License-Identifier: AGPL-3.0-or-later
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useDeprecations } from './useDeprecations';
import { configureApiClient, getApiClient } from '@/lib/api/client';

const HTTP_OK = 200;
const SUNSET = 'Wed, 01 Jan 2031 00:00:00 GMT';
const RESOURCE = '/v1/widgets';

const deprecatedResponse = (): Response =>
  new Response('{}', {
    status: HTTP_OK,
    headers: { 'Content-Type': 'application/json', Deprecation: 'true', Sunset: SUNSET },
  });

describe('useDeprecations', () => {
  it('lists each deprecated resource the API reports once, until it is dismissed', async () => {
    configureApiClient({ fetchImpl: vi.fn<typeof fetch>(async () => Promise.resolve(deprecatedResponse())) });
    const { result } = renderHook(() => useDeprecations());
    expect(result.current.notices).toEqual([]);

    await act(async () => {
      await getApiClient().get(RESOURCE);
      await getApiClient().get(RESOURCE);
    });
    await waitFor(() => expect(result.current.notices).toHaveLength(1));
    expect(result.current.notices[0]).toEqual({ resource: RESOURCE, deprecation: 'true', sunset: SUNSET });

    const listed = result.current.notices;
    await act(async () => {
      await getApiClient().get(RESOURCE);
    });
    expect(result.current.notices).toBe(listed);

    act(() => result.current.dismiss(RESOURCE));
    expect(result.current.notices).toEqual([]);
  });
});
