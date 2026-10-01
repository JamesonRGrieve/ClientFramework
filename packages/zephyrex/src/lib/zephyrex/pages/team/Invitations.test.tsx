// SPDX-License-Identifier: AGPL-3.0-or-later
import { render, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { deleteCookie, getCookie, setCookie } from 'cookies-next/client';
import { afterEach, describe, expect, it, type Mock, vi } from 'vitest';
import { ACTIVE_TEAM_COOKIE } from '../../cookies';
import { PendingInvitations } from './Invitations';
import { TestWrapper, testConfig } from '@/testing/TestWrapper';

const SERVER = testConfig.server.baseUrl;

const HTTP_OK = 200;
const HTTP_GONE = 410;
const ALPHA_TEAM_ID = 'team-alpha';
const ALPHA_INVITATION = 'Alpha as Admin';

const invitations = [
  {
    id: 'inv-1',
    team_id: ALPHA_TEAM_ID,
    created_at: '2026-09-20T00:00:00Z',
    team: { name: 'Alpha' },
    role: { name: 'Admin' },
    invitees: [{ id: 'row-1', status: 'pending' }],
  },
  {
    id: 'inv-2',
    created_at: '2026-09-21T00:00:00Z',
    team: { name: 'Gamma' },
    invitees: [{ id: 'row-2', status: 'pending' }],
  },
];

const serve = (patchStatus = HTTP_OK): Mock<(url: string, init: RequestInit) => Promise<Response>> => {
  let pending = [...invitations];
  const fetchMock = vi.fn(async (url: string, init: RequestInit) => {
    if (init.method === 'PATCH') {
      if (patchStatus !== HTTP_OK) {
        return Promise.resolve(new Response('{"detail":"Invitation has expired"}', { status: patchStatus }));
      }
      pending = pending.filter((item) => !url.endsWith(item.id));
      return Promise.resolve(new Response('{}', { status: HTTP_OK }));
    }
    // The invitation list; the rest of the app shell's reads get nothing.
    return Promise.resolve(
      new Response(JSON.stringify(url.endsWith('/v1/user/invitation') ? { invitations: pending } : {}), { status: HTTP_OK }),
    );
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

const renderInvitations = (): ReturnType<typeof render> =>
  render(
    <TestWrapper>
      <PendingInvitations />
    </TestWrapper>,
  );

describe('PendingInvitations', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    deleteCookie(ACTIVE_TEAM_COOKIE);
  });

  it('lists each invitation with its team and role', async () => {
    serve();
    const view = renderInvitations();
    const list = await view.findByRole('list', { name: 'Pending invitations' });
    expect(
      within(list)
        .getAllByRole('listitem')
        .map((item) => item.querySelector('p')?.textContent),
    ).toEqual([ALPHA_INVITATION, 'Gamma']);
    expect(within(list).getAllByRole('button', { name: /^Accept the invitation to / })).toHaveLength(2);
  });

  it('accepts with the caller’s invitee row and drops the answered invitation', async () => {
    const fetchMock = serve();
    const user = userEvent.setup();
    const view = renderInvitations();
    await user.click(await view.findByRole('button', { name: 'Accept the invitation to Alpha' }));
    await vi.waitFor(() => {
      expect(view.queryByText(ALPHA_INVITATION)).not.toBeInTheDocument();
    });
    expect(fetchMock).toHaveBeenCalledWith(
      `${SERVER}/v1/invitation/inv-1`,
      expect.objectContaining({ method: 'PATCH', body: '{"invitation":{"invitee_id":"row-1","action":"accept"}}' }),
    );
    expect(getCookie(ACTIVE_TEAM_COOKIE)).toBe(ALPHA_TEAM_ID);
  });

  it('leaves the active team alone when declining', async () => {
    setCookie(ACTIVE_TEAM_COOKIE, 'team-current');
    serve();
    const user = userEvent.setup();
    const view = renderInvitations();
    await user.click(await view.findByRole('button', { name: 'Decline the invitation to Alpha' }));
    await vi.waitFor(() => {
      expect(view.queryByText(ALPHA_INVITATION)).not.toBeInTheDocument();
    });
    expect(getCookie(ACTIVE_TEAM_COOKIE)).toBe('team-current');
  });

  it('shows the server’s reason when an answer is refused', async () => {
    serve(HTTP_GONE);
    const user = userEvent.setup();
    const view = renderInvitations();
    await user.click(await view.findByRole('button', { name: 'Decline the invitation to Alpha' }));
    expect(await view.findByRole('alert')).toHaveTextContent('Invitation has expired');
  });
});
