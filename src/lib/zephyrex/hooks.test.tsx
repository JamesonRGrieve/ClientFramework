// SPDX-License-Identifier: AGPL-3.0-or-later
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, type Mock, vi } from 'vitest';
import {
  ADMIN_ROLE_ID,
  SUPERADMIN_ROLE_ID,
  toInbox,
  useMarkNotificationRead,
  useNotifications,
  useRole,
  useTeams,
  useUser,
} from './hooks';
import { TestWrapper, testConfig } from '@/__tests__/test-wrapper';

const HTTP_OK = 200;
const BASE = testConfig.server.baseUrl;
const ME = { id: 'u-me', email: 'me@example.com', first_name: 'Me' };

type Routes = Record<string, object>;

/** Serve JSON by exact path; anything else is an empty object. Returns the fetch mock. */
const serve = (routes: Routes): Mock<(url: string) => Promise<Response>> => {
  const fetchMock = vi.fn(async (url: string) =>
    Promise.resolve(new Response(JSON.stringify(routes[url.replace(BASE, '')] ?? {}), { status: HTTP_OK })),
  );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

const members = (roleId: string): object => ({
  user_teams: [
    { user_id: 'u-other', team_id: 't1', role_id: SUPERADMIN_ROLE_ID },
    { user_id: ME.id, team_id: 't1', role_id: roleId },
  ],
});

describe('useUser', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('unwraps the `{ user }` envelope from GET /v1/user', async () => {
    serve({ '/v1/user': { user: ME } });
    const { result } = renderHook(() => useUser(), { wrapper: TestWrapper });
    await waitFor(() => {
      expect(result.current.data).toEqual(ME);
    });
  });
});

describe('useRole', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reads the signed-in user’s membership role in the team', async () => {
    serve({ '/v1/user': { user: ME }, '/v1/team/t1/user': members(ADMIN_ROLE_ID) });
    const { result } = renderHook(() => useRole('t1'), { wrapper: TestWrapper });
    await waitFor(() => {
      expect(result.current).toEqual({ isAdmin: true, isSuperAdmin: false, roleId: ADMIN_ROLE_ID });
    });
  });

  it('treats a superadmin as an admin too', async () => {
    serve({ '/v1/user': { user: ME }, '/v1/team/t1/user': members(SUPERADMIN_ROLE_ID) });
    const { result } = renderHook(() => useRole('t1'), { wrapper: TestWrapper });
    await waitFor(() => {
      expect(result.current).toEqual({ isAdmin: true, isSuperAdmin: true, roleId: SUPERADMIN_ROLE_ID });
    });
  });

  it('has no role without an active team', () => {
    const fetchMock = serve({ '/v1/user': { user: ME } });
    const { result } = renderHook(() => useRole(null), { wrapper: TestWrapper });
    expect(result.current).toEqual({ isAdmin: false, isSuperAdmin: false, roleId: null });
    expect(fetchMock.mock.calls.map(([url]) => url)).not.toContainEqual(expect.stringContaining('/v1/team/'));
  });
});

describe('useTeams', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists the teams from the `{ teams }` envelope', async () => {
    serve({ '/v1/team': { teams: [{ id: 't1', name: 'Alpha', description: null }] } });
    const { result } = renderHook(() => useTeams(), { wrapper: TestWrapper });
    await waitFor(() => {
      expect(result.current.data).toEqual([{ id: 't1', name: 'Alpha', description: null }]);
    });
  });
});

const older = { id: 'n1', title: 'Welcome', content: 'Hi', created_at: '2026-09-01T00:00:00Z' };
const newer = {
  id: 'n2',
  title: 'Invite',
  content: 'Join',
  reference_type: 'invitation',
  reference_id: 'inv1',
  created_at: '2026-09-02T00:00:00Z',
};

describe('toInbox', () => {
  it('joins each delivery to its notification, newest first, skipping deliveries without one', () => {
    expect(
      toInbox(
        [
          { id: 'd1', notification_id: 'n1', read: true, acknowledged: false },
          { id: 'd2', notification_id: 'n2', read: false, acknowledged: false },
          { id: 'd3', notification_id: 'gone', read: false, acknowledged: false },
        ],
        [older, newer],
      ),
    ).toEqual([
      {
        id: 'd2',
        notificationId: 'n2',
        title: 'Invite',
        content: 'Join',
        referenceType: 'invitation',
        referenceId: 'inv1',
        createdAt: '2026-09-02T00:00:00Z',
        read: false,
        acknowledged: false,
      },
      {
        id: 'd1',
        notificationId: 'n1',
        title: 'Welcome',
        content: 'Hi',
        referenceType: null,
        referenceId: null,
        createdAt: '2026-09-01T00:00:00Z',
        read: true,
        acknowledged: false,
      },
    ]);
  });
});

describe('useNotifications', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const inboxRoutes: Routes = {
    '/v1/user-notifications': {
      user_notifications: [{ id: 'd2', notification_id: 'n2', read: false, acknowledged: false }],
    },
    '/v1/notifications': { notifications: [newer] },
  };

  it('loads the inbox from the user’s deliveries and the notifications', async () => {
    serve(inboxRoutes);
    const { result } = renderHook(() => useNotifications(), { wrapper: TestWrapper });
    await waitFor(() => {
      expect(result.current.data?.map((item) => [item.id, item.title, item.read])).toEqual([['d2', 'Invite', false]]);
    });
  });

  it('marks a delivery read with PATCH …/{id}/read', async () => {
    const fetchMock = serve(inboxRoutes);
    const { result } = renderHook(() => useMarkNotificationRead(), { wrapper: TestWrapper });
    await act(async () => {
      await result.current('d2');
    });
    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE}/v1/user-notifications/d2/read`,
      expect.objectContaining({ method: 'PATCH', body: '{}' }),
    );
  });
});
