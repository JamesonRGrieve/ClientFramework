// SPDX-License-Identifier: AGPL-3.0-or-later
import { render, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TeamMembers } from './TeamMembers';
import { withSession } from '@/testing/session';
import { TestWrapper, testConfig } from '@/testing/TestWrapper';

let signOut: () => void = () => undefined;
beforeEach(() => {
  signOut = withSession();
});
afterEach(() => {
  signOut();
});

const SERVER = testConfig.server.baseUrl;
const TEAM = '11111111-1111-1111-1111-111111111111';
const ME = '22222222-2222-2222-2222-222222222222';
const THEM = '33333333-3333-3333-3333-333333333333';
const HTTP_OK = 200;
const HTTP_NO_CONTENT = 204;

const ROLES = [
  { id: 'r-user', name: 'user', friendly_name: 'User', parent_id: null, team_id: null },
  { id: 'r-admin', name: 'admin', friendly_name: 'Admin', parent_id: 'r-user', team_id: null },
  { id: 'r-super', name: 'superadmin', friendly_name: 'Superadmin', parent_id: 'r-admin', team_id: null },
];

const json = (body: object): Response =>
  new Response(JSON.stringify(body), { status: HTTP_OK, headers: { 'Content-Type': 'application/json' } });

const member = (id: string, userId: string, roleId: string, email: string): object => ({
  id,
  user_id: userId,
  team_id: TEAM,
  role_id: roleId,
  user: { id: userId, email },
  role: ROLES.find((role) => role.id === roleId),
});

const HTTP_CONFLICT = 409;
const LAST_ADMIN = 'A team must keep at least one admin';

interface Server {
  myRole: string;
  invitations: object[];
  /** Whether THEM has been removed from the team. */
  themRemoved: boolean;
  calls: { url: string; init: RequestInit | undefined }[];
}

const MY_EMAIL = 'me@example.com';
const THEIR_EMAIL = 'them@example.com';
const HTTP_SERVER_ERROR = 500;

/** The server's answer to a write; an unexpected one fails loudly. */
function written(server: Server, url: string, method: string): Response {
  const members = `${SERVER}/v1/team/${TEAM}/user`;
  if (url.startsWith(members) && method === 'PATCH') {
    return json({ message: 'Role updated successfully' });
  }
  if (url === `${members}/${THEM}` && method === 'DELETE') {
    server.themRemoved = true;
    return new Response(null, { status: HTTP_NO_CONTENT });
  }
  if (url === `${members}/${ME}` && method === 'DELETE') {
    return new Response(JSON.stringify({ detail: LAST_ADMIN }), { status: HTTP_CONFLICT });
  }
  if (url === `${SERVER}/v1/invitation/inv-1` && method === 'DELETE') {
    server.invitations = [];
    return new Response(null, { status: HTTP_NO_CONTENT });
  }
  return new Response('{"detail":"unexpected"}', { status: HTTP_SERVER_ERROR });
}

/** The server's answer to a read; the app shell's own reads get nothing. */
function read(server: Server, url: string): Response {
  if (url === `${SERVER}/v1/user`) {
    return json({ user: { id: ME, email: MY_EMAIL } });
  }
  if (url === `${SERVER}/v1/team`) {
    return json({ teams: [{ id: TEAM, name: 'Alpha', description: null }] });
  }
  if (url === `${SERVER}/v1/team/${TEAM}/user`) {
    return json({
      user_teams: [
        member('m1', ME, server.myRole, MY_EMAIL),
        ...(server.themRemoved ? [] : [member('m2', THEM, 'r-user', THEIR_EMAIL)]),
      ],
    });
  }
  if (url.startsWith(`${SERVER}/v1/role`)) {
    return json({ roles: ROLES, pagination: { has_more: false } });
  }
  if (url.startsWith(`${SERVER}/v1/team/${TEAM}/invitation`)) {
    return json({ invitations: server.invitations, pagination: { has_more: false } });
  }
  return json({});
}

const serve = (server: Server): void => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: URL | string, init?: RequestInit) => {
      const url = String(input);
      server.calls.push({ url, init });
      const method = init?.method ?? 'GET';
      return Promise.resolve(method === 'GET' ? read(server, url) : written(server, url, method));
    }),
  );
};

const renderMembers = (): ReturnType<typeof render> =>
  render(
    <TestWrapper>
      <TeamMembers teamId={TEAM} />
    </TestWrapper>,
  );

describe('TeamMembers', () => {
  let server: Server;

  beforeEach(() => {
    server = {
      myRole: 'r-admin',
      invitations: [
        {
          id: 'inv-1',
          code: 'AB12CD34',
          role_id: 'r-user',
          team_id: TEAM,
          created_at: '2026-09-02T00:00:00Z',
          invitees: [{ id: 'e1', email: 'new@example.com', created_at: '2026-09-02T00:00:00Z' }],
        },
      ],
      themRemoved: false,
      calls: [],
    };
    serve(server);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lets an admin change another member’s role, up to their own', async () => {
    const user = userEvent.setup();
    const view = renderMembers();
    const role = await view.findByLabelText('Role for them@example.com');
    expect(
      within(role)
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual(['User', 'Admin']);
    expect(view.queryByLabelText('Role for me@example.com')).toBeNull();
    await user.selectOptions(role, 'r-admin');
    await vi.waitFor(() => {
      expect(server.calls.some(({ init }) => init?.method === 'PATCH')).toBe(true);
    });
    const patch = server.calls.find(({ init }) => init?.method === 'PATCH');
    expect(patch?.url).toBe(`${SERVER}/v1/team/${TEAM}/user/${THEM}`);
    expect(patch?.init?.body).toBe('{"user_team":{"role_id":"r-admin"}}');
  });

  it('lets an admin remove a member after confirming', async () => {
    const user = userEvent.setup();
    const view = renderMembers();
    await user.click(await view.findByRole('button', { name: 'Remove them@example.com from the team' }));
    expect(server.calls.some(({ init }) => init?.method === 'DELETE')).toBe(false);
    await user.click(view.getByRole('button', { name: 'Yes, remove them@example.com' }));
    await vi.waitFor(() => {
      expect(view.queryByText(THEIR_EMAIL)).toBeNull();
    });
    expect(server.calls.find(({ init }) => init?.method === 'DELETE')?.url).toBe(`${SERVER}/v1/team/${TEAM}/user/${THEM}`);
  });

  it('keeps the team’s last admin, saying why, when they try to leave', async () => {
    const user = userEvent.setup();
    const view = renderMembers();
    await user.click(await view.findByRole('button', { name: 'Leave the team' }));
    await user.click(view.getByRole('button', { name: 'Yes, leave' }));
    expect(await view.findByRole('alert')).toHaveTextContent(LAST_ADMIN);
    expect(view.getByText('me@example.com')).toBeInTheDocument();
  });

  it('offers a member who is not an admin only leaving', async () => {
    server.myRole = 'r-user';
    const view = renderMembers();
    expect(await view.findByRole('button', { name: 'Leave the team' })).toBeInTheDocument();
    expect(view.queryByRole('button', { name: /^Remove / })).toBeNull();
  });

  it('shows an admin the pending invitations, and revokes one', async () => {
    const user = userEvent.setup();
    const view = renderMembers();
    const list = await view.findByRole('list', { name: 'Pending team invitations' });
    expect(await within(list).findByText('new@example.com')).toBeInTheDocument();
    await user.click(within(list).getByRole('button', { name: /^Revoke the invitation/ }));
    expect(await view.findByText('No pending invitations.')).toBeInTheDocument();
  });

  it('shows a member who is not an admin only the members', async () => {
    server.myRole = 'r-user';
    const view = renderMembers();
    const list = await view.findByRole('list', { name: 'Team members' });
    expect(await within(list).findByText(THEIR_EMAIL)).toBeInTheDocument();
    expect(await within(list).findAllByText('User')).toHaveLength(2);
    expect(view.queryByRole('combobox')).toBeNull();
    expect(view.queryByText('Invite people')).toBeNull();
    expect(server.calls.some(({ url }) => url.includes('/invitation'))).toBe(false);
  });
});
