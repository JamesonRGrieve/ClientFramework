// SPDX-License-Identifier: AGPL-3.0-or-later
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useMembershipActions, useTeamAccess, useTeamActions } from './useTeamManagement';
import { withSession } from '@/testing/session';
import { TestWrapper as wrapper, testConfig } from '@/testing/TestWrapper';

let signOut: () => void = () => undefined;
beforeEach(() => {
  signOut = withSession();
});
afterEach(() => {
  signOut();
});

const SERVER = testConfig.server.baseUrl;
const TEAM = 't1';
const ME = '22222222-2222-2222-2222-222222222222';
const HTTP_OK = 200;
const HTTP_CREATED = 201;

const json = (body: object, status = HTTP_OK): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const ROLES = [
  { id: 'r-user', name: 'user', parent_id: null, team_id: null },
  { id: 'r-admin', name: 'admin', parent_id: 'r-user', team_id: null },
];

describe('useTeamManagement', () => {
  let calls: { url: string; init: RequestInit | undefined }[];

  beforeEach(() => {
    calls = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: URL | string, init?: RequestInit) => {
        const url = String(input);
        calls.push({ url, init });
        if (url === `${SERVER}/v1/user`) {
          return Promise.resolve(json({ user: { id: ME, email: 'me@example.com' } }));
        }
        if (url === `${SERVER}/v1/team/${TEAM}/user`) {
          return Promise.resolve(
            json({
              user_teams: [
                {
                  id: 'm1',
                  user_id: ME,
                  team_id: TEAM,
                  role_id: 'r-admin',
                  user: { id: ME, email: 'me@example.com' },
                  role: { id: 'r-admin', name: 'admin', parent_id: 'r-user' },
                },
              ],
            }),
          );
        }
        if (url.startsWith(`${SERVER}/v1/role`)) {
          return Promise.resolve(json({ roles: ROLES, pagination: { has_more: false } }));
        }
        if (url === `${SERVER}/v1/team` && init?.method === 'POST') {
          return Promise.resolve(json({ team: { id: 't-new', name: 'Beta' } }, HTTP_CREATED));
        }
        return Promise.resolve(json({}));
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('works out the viewer’s role and what they may grant', async () => {
    const { result } = renderHook(() => useTeamAccess(TEAM), { wrapper });
    await waitFor(() => {
      expect(result.current.admin).toBe(true);
    });
    expect(result.current.ownRoleId).toBe('r-admin');
    expect(result.current.assignable.map((role) => role.id)).toEqual(['r-user', 'r-admin']);
  });

  it('asks nothing for no team', () => {
    const { result } = renderHook(() => useTeamAccess(undefined), { wrapper });
    expect(result.current.admin).toBe(false);
    expect(calls.some(({ url }) => url.includes('/v1/team/'))).toBe(false);
  });

  it('sends each write the server’s shape, guarding changes by the row as loaded', async () => {
    const TEAM_VERSION = '2026-10-03T08:00:00.000001';
    const MEMBER_VERSION = '2026-10-03T08:30:00.000002';
    const team = { id: TEAM, name: 'Alpha', updated_at: TEAM_VERSION };
    const member = {
      id: 'm2',
      user_id: 'u-2',
      team_id: TEAM,
      role_id: 'r-user',
      user: { id: 'u-2' },
      role: { id: 'r-user', name: 'user' },
      created_at: MEMBER_VERSION,
    };
    const teamActions = renderHook(() => useTeamActions(), { wrapper }).result;
    const memberActions = renderHook(() => useMembershipActions(TEAM), { wrapper }).result;
    await expect(teamActions.current.createTeam('Beta', 'parent-1')).resolves.toBe('t-new');
    await expect(teamActions.current.rename.save(team, { name: 'Gamma' })).resolves.toBe(true);
    await expect(memberActions.current.changeRole.save(member, { role_id: 'r-admin' })).resolves.toBe(true);
    await expect(memberActions.current.remove.save(member, {})).resolves.toBe(true);
    const writes = calls.filter(({ init }) => (init?.method ?? 'GET') !== 'GET');
    expect(
      writes.map(({ url, init }) => [init?.method, url, init?.body, new Headers(init?.headers).get('If-Match')]),
    ).toEqual([
      ['POST', `${SERVER}/v1/team`, '{"team":{"name":"Beta","parent_id":"parent-1"}}', null],
      ['PUT', `${SERVER}/v1/team/${TEAM}`, '{"team":{"name":"Gamma"}}', `"${TEAM_VERSION}"`],
      ['PATCH', `${SERVER}/v1/team/${TEAM}/user/u-2`, '{"user_team":{"role_id":"r-admin"}}', `"${MEMBER_VERSION}"`],
      ['DELETE', `${SERVER}/v1/team/${TEAM}/user/u-2`, undefined, `"${MEMBER_VERSION}"`],
    ]);
  });
});
