// SPDX-License-Identifier: AGPL-3.0-or-later
import { act, renderHook, waitFor } from '@testing-library/react';
import { deleteCookie, getCookie, setCookie } from 'cookies-next/client';
import type { ReactElement } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import {
  ADMIN_ROLE_ID,
  type Notification as InboxNotification,
  SUPERADMIN_ROLE_ID,
  SYSTEM_TEAM_ID,
  toInbox,
  useHasSession,
  useMarkNotificationRead,
  useNotifications,
  useRole,
  useSelectedTeam,
  useTeams,
  useUser,
} from './hooks';
import { withSession } from '@/testing/session';
import { TestWrapper, testConfig } from '@/testing/TestWrapper';

const HTTP_OK = 200;
const HTTP_PRECONDITION_FAILED = 412;
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

let endSession: () => void = () => undefined;

const signIn = (): void => {
  endSession = withSession();
};

const signOut = (): void => {
  endSession();
  deleteCookie('auth-team');
  vi.unstubAllGlobals();
};

function SessionProbe(): ReactElement {
  return <p>{useHasSession() ? 'signed in' : 'signed out'}</p>;
}

describe('useHasSession', () => {
  beforeEach(signIn);
  afterEach(signOut);

  it('renders signed out on the server, and hydrates without a mismatch before showing the session', async () => {
    const html = renderToString(<SessionProbe />);
    expect(html).toContain('signed out');
    const container = document.createElement('div');
    container.innerHTML = html;
    const onRecoverableError = vi.fn();
    await act(async () => {
      hydrateRoot(container, <SessionProbe />, { onRecoverableError });
      await Promise.resolve();
    });
    expect(onRecoverableError).not.toHaveBeenCalled();
    expect(container.textContent).toBe('signed in');
  });

  it('is signed out without the session cookie', () => {
    endSession();
    expect(renderHook(() => useHasSession()).result.current).toBe(false);
  });
});

describe('useUser', () => {
  beforeEach(signIn);
  afterEach(signOut);

  it('unwraps the `{ user }` envelope from GET /v1/user', async () => {
    serve({ '/v1/user': { user: ME } });
    const { result } = renderHook(() => useUser().data, { wrapper: TestWrapper });
    await waitFor(() => {
      expect(result.current).toEqual(ME);
    });
  });

  it('asks nothing without a session', () => {
    endSession();
    const fetchMock = serve({ '/v1/user': { user: ME } });
    const { result } = renderHook(() => useUser().data, { wrapper: TestWrapper });
    expect(result.current).toBeUndefined();
    expect(fetchMock.mock.calls.map(([url]) => url)).not.toContain(`${BASE}/v1/user`);
  });
});

describe('useRole', () => {
  beforeEach(signIn);
  afterEach(signOut);

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
  const alpha = { id: 't1', name: 'Alpha', description: null };

  beforeEach(signIn);
  afterEach(signOut);

  it('lists the teams from the `{ teams }` envelope, without the system team', async () => {
    serve({ '/v1/team': { teams: [alpha, { id: SYSTEM_TEAM_ID, name: 'System', description: null }] } });
    const { result } = renderHook(() => useTeams().data, { wrapper: TestWrapper });
    await waitFor(() => {
      expect(result.current).toEqual([alpha]);
    });
  });

  it('selects a named team, or the active one, from the user’s teams', async () => {
    const beta = { id: 't2', name: 'Beta', description: null };
    serve({ '/v1/team': { teams: [alpha, beta] } });
    setCookie('auth-team', 't2');
    const { result } = renderHook(
      () => ({ named: useSelectedTeam('t1'), active: useSelectedTeam(), gone: useSelectedTeam('x') }),
      {
        wrapper: TestWrapper,
      },
    );
    await waitFor(() => {
      expect(result.current).toEqual({ named: alpha, active: beta, gone: null });
    });
  });

  it('has no selected team until the teams load', () => {
    serve({});
    const { result } = renderHook(() => useSelectedTeam('t1'), { wrapper: TestWrapper });
    expect(result.current).toBeUndefined();
  });

  it('makes the first team active when the active one is not theirs', async () => {
    serve({ '/v1/team': { teams: [alpha] } });
    const { result } = renderHook(() => useTeams().data, { wrapper: TestWrapper });
    await waitFor(() => {
      expect(result.current).toEqual([alpha]);
    });
    expect(getCookie('auth-team')).toBe('t1');
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
          { id: 'd1', notification_id: 'n1', read: true, acknowledged: false, created_at: 'c1', updated_at: 'u1' },
          { id: 'd2', notification_id: 'n2', read: false, acknowledged: false, created_at: 'c2' },
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
        delivery: { created_at: 'c2', updated_at: undefined },
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
        delivery: { created_at: 'c1', updated_at: 'u1' },
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

  const DELIVERED = '2026-09-02T00:00:01.000001';
  const CHANGED = '2026-09-02T00:05:00.000002';
  const unread: InboxNotification = {
    id: 'd2',
    notificationId: 'n2',
    title: 'Invite',
    content: 'Join',
    referenceType: null,
    referenceId: null,
    createdAt: newer.created_at,
    read: false,
    acknowledged: false,
    delivery: { created_at: DELIVERED },
  };
  const READ_PATH = `${BASE}/v1/user-notifications/d2/read`;
  type Fetch = (url: string, init?: RequestInit) => Promise<Response>;
  const marks = (fetchMock: Mock<Fetch>): (string | null)[] =>
    fetchMock.mock.calls
      .filter(([url, init]) => url === READ_PATH && init?.method === 'PATCH')
      .map(([, init]) => new Headers(init?.headers).get('If-Match'));
  const staleThen = (current: object): Mock<Fetch> => {
    let refused = false;
    const fetchMock = vi.fn<Fetch>(async (url) => {
      if (url === READ_PATH && !refused) {
        refused = true;
        return Promise.resolve(
          new Response(JSON.stringify({ detail: 'Precondition failed', current }), { status: HTTP_PRECONDITION_FAILED }),
        );
      }
      return Promise.resolve(new Response(JSON.stringify(inboxRoutes[url.replace(BASE, '')] ?? {}), { status: HTTP_OK }));
    });
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
  };

  it('marks a delivery read with PATCH …/{id}/read, guarded by the delivery as loaded', async () => {
    const fetchMock = serve(inboxRoutes);
    const { result } = renderHook(() => useMarkNotificationRead(), { wrapper: TestWrapper });
    await act(async () => {
      await result.current(unread);
    });
    expect(fetchMock).toHaveBeenCalledWith(READ_PATH, expect.objectContaining({ method: 'PATCH', body: '{}' }));
    expect(marks(fetchMock)).toEqual([`"${DELIVERED}"`]);
  });

  it('marks it against the current version when the delivery changed first and is still unread', async () => {
    const fetchMock = staleThen({ id: 'd2', notification_id: 'n2', read: false, acknowledged: true, updated_at: CHANGED });
    const { result } = renderHook(() => useMarkNotificationRead(), { wrapper: TestWrapper });
    await act(async () => {
      await result.current(unread);
    });
    expect(marks(fetchMock)).toEqual([`"${DELIVERED}"`, `"${CHANGED}"`]);
  });

  it('leaves a delivery that was read elsewhere first', async () => {
    const fetchMock = staleThen({ id: 'd2', notification_id: 'n2', read: true, acknowledged: false, updated_at: CHANGED });
    const { result } = renderHook(() => useMarkNotificationRead(), { wrapper: TestWrapper });
    await act(async () => {
      await result.current(unread);
    });
    expect(marks(fetchMock)).toEqual([`"${DELIVERED}"`]);
  });
});
