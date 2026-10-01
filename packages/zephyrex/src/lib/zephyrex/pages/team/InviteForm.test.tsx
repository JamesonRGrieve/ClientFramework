// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { InviteForm } from './InviteForm';
import type { Role } from './teamModel';
import { TestWrapper, testConfig } from '@/testing/TestWrapper';

const SERVER = testConfig.server.baseUrl;
const TEAM = 't1';
const EMAILS = 'Email addresses';
const SEND = 'Send invitations';
const HTTP_CREATED = 201;
const HTTP_FORBIDDEN = 403;

const ROLES: Role[] = [
  { id: 'r-user', name: 'user', friendly_name: 'User', parent_id: null, team_id: null },
  { id: 'r-admin', name: 'admin', friendly_name: 'Admin', parent_id: 'r-user', team_id: null },
];

const renderForm = (onInvited = vi.fn(async () => Promise.resolve())): ReturnType<typeof render> =>
  render(
    <TestWrapper>
      <InviteForm teamId={TEAM} roles={ROLES} onInvited={onInvited} />
    </TestWrapper>,
  );

describe('InviteForm', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('invites every address with the chosen role, then refreshes the list', async () => {
    const fetchMock = vi.fn(async () => Promise.resolve(new Response('{}', { status: HTTP_CREATED })));
    vi.stubGlobal('fetch', fetchMock);
    const onInvited = vi.fn(async () => Promise.resolve());
    const user = userEvent.setup();
    const view = renderForm(onInvited);
    await user.type(view.getByLabelText(EMAILS), 'Ada@Example.com, grace@example.com');
    await user.selectOptions(view.getByLabelText('Role'), 'r-admin');
    await user.click(view.getByRole('button', { name: SEND }));
    expect(await view.findByRole('status')).toHaveTextContent('Invited ada@example.com, grace@example.com.');
    expect(fetchMock).toHaveBeenCalledWith(
      `${SERVER}/v1/team/${TEAM}/invitation`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ invitation: { role_id: 'r-admin', email: ['ada@example.com', 'grace@example.com'] } }),
      }),
    );
    expect(onInvited).toHaveBeenCalled();
    expect(view.getByLabelText(EMAILS)).toHaveValue('');
  });

  it('preselects the lowest role', () => {
    const view = renderForm();
    expect(view.getByLabelText('Role')).toHaveValue('r-user');
  });

  it('explains a bad address without sending anything', async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => Promise.resolve(new Response('{}', { status: HTTP_CREATED })));
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    const view = renderForm();
    await user.type(view.getByLabelText(EMAILS), 'not-an-address');
    await user.click(view.getByRole('button', { name: SEND }));
    expect(await view.findByRole('alert')).toHaveTextContent('Not an email address: not-an-address');
    expect(fetchMock).not.toHaveBeenCalledWith(expect.stringContaining('/invitation'), expect.anything());
  });

  it('shows the server’s refusal', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        Promise.resolve(new Response('{"detail":"Cannot invite to a role above your own"}', { status: HTTP_FORBIDDEN })),
      ),
    );
    const user = userEvent.setup();
    const view = renderForm();
    await user.type(view.getByLabelText(EMAILS), 'ada@example.com');
    await user.click(view.getByRole('button', { name: SEND }));
    expect(await view.findByRole('alert')).toHaveTextContent('Cannot invite to a role above your own');
  });
});
