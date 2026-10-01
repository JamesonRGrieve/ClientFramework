// SPDX-License-Identifier: AGPL-3.0-or-later
import { render, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Role } from 'zephyrex/pages/team';
import { TestWrapper, testConfig } from 'zephyrex/testing';
import { TeamInvitations } from './TeamInvitations';

const SERVER = testConfig.server.baseUrl;
const TEAM = 't1';
const HTTP_OK = 200;
const HTTP_NO_CONTENT = 204;
const HTTP_FORBIDDEN = 403;
const SENT = '2026-09-02T00:00:00Z';
const PENDING_LIST = 'Pending team invitations';
const INVITEE = 'new@example.com';
const USER_ROLE_ID = 'r-user';

const ROLES: Role[] = [
  { id: USER_ROLE_ID, name: 'user', friendly_name: 'User', parent_id: null, team_id: null },
  { id: 'r-admin', name: 'admin', friendly_name: 'Admin', parent_id: USER_ROLE_ID, team_id: null },
];

const PENDING = {
  id: 'inv-1',
  code: 'AB12CD34',
  role_id: USER_ROLE_ID,
  team_id: TEAM,
  created_at: SENT,
  invitees: [{ id: 'e1', email: INVITEE, created_at: SENT }],
};
const ANSWERED = {
  id: 'inv-2',
  role_id: USER_ROLE_ID,
  created_at: SENT,
  invitees: [{ id: 'e2', email: 'done@example.com', created_at: SENT, accepted_at: SENT }],
};

interface Server {
  invitations: object[];
  revokeStatus: number;
  calls: { url: string; init: RequestInit | undefined }[];
}

const serve = (server: Server): void => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: RequestInit) => {
      server.calls.push({ url, init });
      if (url === `${SERVER}/v1/invitation/inv-1` && init?.method === 'DELETE') {
        if (server.revokeStatus !== HTTP_NO_CONTENT) {
          return Promise.resolve(new Response('{"detail":"Not your invitation"}', { status: server.revokeStatus }));
        }
        server.invitations = [];
        return Promise.resolve(new Response(null, { status: HTTP_NO_CONTENT }));
      }
      const body = url.startsWith(`${SERVER}/v1/team/${TEAM}/invitation`)
        ? { invitations: server.invitations, pagination: { has_more: false } }
        : {};
      return Promise.resolve(new Response(JSON.stringify(body), { status: HTTP_OK }));
    }),
  );
};

const renderSection = (admin: boolean): ReturnType<typeof render> =>
  render(
    <TestWrapper>
      <TeamInvitations teamId={TEAM} teamName='Alpha' admin={admin} roles={ROLES} assignable={ROLES} />
    </TestWrapper>,
  );

describe('TeamInvitations', () => {
  let server: Server;

  beforeEach(() => {
    server = { invitations: [PENDING, ANSWERED], revokeStatus: HTTP_NO_CONTENT, calls: [] };
    serve(server);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows an admin the invitations still awaiting an answer, with their role, and revokes one', async () => {
    const user = userEvent.setup();
    const view = renderSection(true);
    const list = await view.findByRole('list', { name: PENDING_LIST });
    expect(within(list).getByText(INVITEE)).toBeInTheDocument();
    expect(within(list).getByText('User')).toBeInTheDocument();
    expect(view.queryByText('done@example.com')).toBeNull();
    await user.click(within(list).getByRole('button', { name: /^Revoke the invitation/ }));
    expect(await view.findByText('No pending invitations.')).toBeInTheDocument();
  });

  it('keeps the invitation, saying why, when the server refuses to revoke it', async () => {
    server.revokeStatus = HTTP_FORBIDDEN;
    const user = userEvent.setup();
    const view = renderSection(true);
    const list = await view.findByRole('list', { name: PENDING_LIST });
    await user.click(within(list).getByRole('button', { name: /^Revoke the invitation/ }));
    expect(await within(list).findByRole('alert')).toHaveTextContent('Not your invitation');
    expect(within(list).getByText(INVITEE)).toBeInTheDocument();
  });

  it('copies a pending invitee’s link, naming the team', async () => {
    const user = userEvent.setup();
    // userEvent.setup() installs its own clipboard, so spy on that one.
    const writeText = vi.spyOn(navigator.clipboard, 'writeText');
    const view = renderSection(true);
    await user.click(await view.findByRole('button', { name: `Copy link for ${INVITEE}` }));
    expect(await view.findByRole('status')).toHaveTextContent(`Copied the invite link for ${INVITEE}.`);
    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/?code=AB12CD34&email=new%40example.com&team=Alpha`);
  });

  it('offers the invite form to an admin', async () => {
    const view = renderSection(true);
    expect(await view.findByText('Invite people')).toBeInTheDocument();
  });

  it('shows a member who is not an admin nothing, and asks the server nothing', () => {
    const view = renderSection(false);
    expect(view.queryByText('Invite people')).toBeNull();
    expect(view.queryByText('Pending invitations')).toBeNull();
    expect(server.calls.some(({ url }) => url.includes('/invitation'))).toBe(false);
  });
});
