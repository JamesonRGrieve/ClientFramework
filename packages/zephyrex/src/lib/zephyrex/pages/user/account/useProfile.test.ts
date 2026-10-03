// SPDX-License-Identifier: AGPL-3.0-or-later
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PROFILE_ENDPOINT, useProfile } from './useProfile';
import { TestWrapper as wrapper, testConfig } from '@/testing/TestWrapper';

const PROFILE_URL = `${testConfig.server.baseUrl}${PROFILE_ENDPOINT}`;
const HTTP_OK = 200;
const HTTP_UNAUTHORIZED = 401;

const HTTP_PRECONDITION_FAILED = 412;
const LOADED = '2026-10-03T09:00:00.000001';
const CHANGED = '2026-10-03T09:05:00.000002';
const user = { id: 'u1', email: 'ada@example.com', first_name: 'Ada', timezone: null, updated_at: LOADED };
const ifMatchOf = (init: RequestInit | undefined): string | null => new Headers(init?.headers).get('If-Match');

const json = (body: object, status = HTTP_OK): Response => new Response(JSON.stringify(body), { status });

describe('useProfile', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads the signed-in user from GET /v1/user', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.resolve(json({ user }))),
    );
    const { result } = renderHook(() => useProfile(), { wrapper });
    await waitFor(() => {
      expect(result.current.profile).toEqual(user);
    });
  });

  it('PUTs the changes wrapped in `user` and adopts the saved profile', async () => {
    const saved = { ...user, first_name: 'Augusta' };
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) =>
      Promise.resolve(json({ user: init.method === 'PUT' ? saved : user })),
    );
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useProfile(), { wrapper });
    await waitFor(() => {
      expect(result.current.profile).toEqual(user);
    });

    await act(async () => {
      await expect(result.current.update({ first_name: 'Augusta' })).resolves.toBe(true);
    });
    expect(fetchMock).toHaveBeenCalledWith(
      PROFILE_URL,
      expect.objectContaining({ method: 'PUT', body: '{"user":{"first_name":"Augusta"}}' }),
    );
    expect(ifMatchOf(fetchMock.mock.calls.find(([, init]) => init.method === 'PUT')?.[1])).toBe(`"${LOADED}"`);
    expect(result.current.profile).toEqual(saved);
  });

  it("keeps the user's changes beside the current profile when it changed first, and saves them over it", async () => {
    const current = { ...user, first_name: 'Augusta Ada', updated_at: CHANGED };
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      if (init.method !== 'PUT') {
        return Promise.resolve(json({ user }));
      }
      return Promise.resolve(
        ifMatchOf(init) === `"${CHANGED}"`
          ? json({ user: { ...current, last_name: 'King', updated_at: '2026-10-03T09:06:00.000003' } })
          : json({ detail: 'The record was changed since it was read', current }, HTTP_PRECONDITION_FAILED),
      );
    });
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useProfile(), { wrapper });
    await waitFor(() => {
      expect(result.current.profile).toEqual(user);
    });

    await act(async () => {
      await expect(result.current.update({ last_name: 'King' })).resolves.toBe(false);
    });
    expect(result.current.conflict).toEqual({ mine: { last_name: 'King' }, theirs: current });

    await act(async () => {
      await expect(result.current.resolve({ last_name: 'King' })).resolves.toBe(true);
    });
    expect(result.current.conflict).toBeNull();
    expect(result.current.profile).toMatchObject({ first_name: 'Augusta Ada', last_name: 'King' });
  });

  it('PATCHes a password change, guarded by the profile as loaded, and returns the server’s message', async () => {
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) =>
      Promise.resolve(init.method === 'PATCH' ? json({ message: 'Password changed successfully' }) : json({ user })),
    );
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useProfile(), { wrapper });
    await waitFor(() => {
      expect(result.current.profile).toEqual(user);
    });
    const message = await result.current.changePassword('old', 'new');
    expect(message).toBe('Password changed successfully');
    expect(fetchMock).toHaveBeenCalledWith(
      PROFILE_URL,
      expect.objectContaining({ method: 'PATCH', body: '{"current_password":"old","new_password":"new"}' }),
    );
    expect(ifMatchOf(fetchMock.mock.calls.find(([, init]) => init.method === 'PATCH')?.[1])).toBe(`"${LOADED}"`);
  });

  it('refreshes the profile and asks again when it changed before a password change', async () => {
    const current = { ...user, display_name: 'Ada', updated_at: CHANGED };
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init: RequestInit) =>
        Promise.resolve(
          init.method === 'PATCH'
            ? json({ detail: 'The record was changed since it was read', current }, HTTP_PRECONDITION_FAILED)
            : json({ user }),
        ),
      ),
    );
    const { result } = renderHook(() => useProfile(), { wrapper });
    await waitFor(() => {
      expect(result.current.profile).toEqual(user);
    });
    await act(async () => {
      await expect(result.current.changePassword('old', 'new')).rejects.toThrow(/change your password again/);
    });
    expect(result.current.profile).toEqual(current);
  });

  it('exposes a failed load as an error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.resolve(json({ detail: 'Session has been revoked' }, HTTP_UNAUTHORIZED))),
    );
    const { result } = renderHook(() => useProfile(), { wrapper });
    await waitFor(() => {
      expect(result.current.error?.message).toBe('Session has been revoked');
    });
  });
});
