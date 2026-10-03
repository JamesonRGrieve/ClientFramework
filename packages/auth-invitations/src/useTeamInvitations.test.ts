// SPDX-License-Identifier: AGPL-3.0-or-later
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestWrapper as wrapper, testConfig } from 'zephyrex/testing';
import { useInvitationActions, useTeamInvitations } from './useTeamInvitations';

const SERVER = testConfig.server.baseUrl;
const TEAM = 't1';
const HTTP_OK = 200;
const SENT = '2026-09-02T00:00:00Z';

const json = (body: object): Response => new Response(JSON.stringify(body), { status: HTTP_OK });

describe('team invitations', () => {
  let calls: { url: string; init: RequestInit | undefined }[];

  beforeEach(() => {
    calls = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        calls.push({ url, init });
        if (url.startsWith(`${SERVER}/v1/team/${TEAM}/invitation`) && (init?.method ?? 'GET') === 'GET') {
          return Promise.resolve(
            json({
              invitations: [
                { id: 'inv-1', created_at: SENT, invitees: [{ id: 'e1', email: 'new@example.com', created_at: SENT }] },
                { id: 'inv-2', created_at: '2026-09-03T00:00:00Z' },
              ],
              pagination: { has_more: false },
            }),
          );
        }
        return Promise.resolve(json({}));
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads each invitation with who it went to, in one request', async () => {
    const { result } = renderHook(() => useTeamInvitations(TEAM).data, { wrapper });
    await waitFor(() => {
      expect(result.current).toHaveLength(2);
    });
    expect(result.current?.map(({ invitees }) => invitees.map((invitee) => invitee.email))).toEqual([
      ['new@example.com'],
      [],
    ]);
    expect(calls.filter(({ url }) => url.includes('/invitation')).map(({ url }) => url)).toEqual([
      `${SERVER}/v1/team/${TEAM}/invitation?include=invitees&offset=0&limit=100`,
    ]);
  });

  it('asks nothing for no team', () => {
    renderHook(() => useTeamInvitations(undefined).data, { wrapper });
    expect(calls.some(({ url }) => url.includes('/invitation'))).toBe(false);
  });

  it('invites and revokes with the server’s shapes', async () => {
    const { result } = renderHook(() => useInvitationActions(), { wrapper });
    const sent = '2026-10-03T10:00:00.000001';
    await result.current.invite(TEAM, 'r-user', ['a@example.com', 'b@example.com']);
    await expect(result.current.revoke.save({ id: 'inv-1', created_at: sent }, {})).resolves.toBe(true);
    const writes = calls.filter(({ init }) => (init?.method ?? 'GET') !== 'GET');
    expect(
      writes.map(({ url, init }) => [init?.method, url, init?.body, new Headers(init?.headers).get('If-Match')]),
    ).toEqual([
      [
        'POST',
        `${SERVER}/v1/team/${TEAM}/invitation`,
        '{"invitation":{"role_id":"r-user","email":["a@example.com","b@example.com"]}}',
        null,
      ],
      ['DELETE', `${SERVER}/v1/invitation/inv-1`, undefined, `"${sent}"`],
    ]);
  });
});
