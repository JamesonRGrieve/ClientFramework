// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { deleteCookie, getCookie } from 'cookies-next/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Team } from './Team';
import { withSession } from '@/testing/session';
import { TestWrapper, testConfig } from '@/testing/TestWrapper';

let signOut: () => void = () => undefined;
beforeEach(() => {
  signOut = withSession();
});
afterEach(() => {
  signOut();
});

const push = vi.fn();
vi.mock('next/navigation.js', () => ({ useRouter: () => ({ push }) }));

const SERVER = testConfig.server.baseUrl;
const ALPHA = '11111111-1111-1111-1111-111111111111';
const BETA = '22222222-2222-2222-2222-222222222222';
const ME = '33333333-3333-3333-3333-333333333333';
const HTTP_OK = 200;
const HTTP_CREATED = 201;

const json = (body: object, status = HTTP_OK): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const team = (id: string, name: string): object => ({ id, name, description: null });

const renderTeam = (teamId: string): ReturnType<typeof render> =>
  render(
    <TestWrapper>
      <Team teamId={teamId} />
    </TestWrapper>,
  );

describe('Team', () => {
  let myRole: string;
  let calls: { url: string; init: RequestInit | undefined }[];

  beforeEach(() => {
    myRole = 'r-admin';
    calls = [];
    push.mockReset();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: URL | string, init?: RequestInit) => {
        const url = String(input);
        calls.push({ url, init });
        if (url === `${SERVER}/v1/user`) {
          return Promise.resolve(json({ user: { id: ME, email: 'me@example.com' } }));
        }
        if (url === `${SERVER}/v1/team`) {
          return Promise.resolve(
            init?.method === 'POST'
              ? json({ team: { id: 't-new' } }, HTTP_CREATED)
              : json({ teams: [team(ALPHA, 'Alpha'), team(BETA, 'Beta')] }),
          );
        }
        if (url.endsWith('/user')) {
          return Promise.resolve(
            json({
              user_teams: [
                {
                  id: 'm1',
                  user_id: ME,
                  team_id: ALPHA,
                  role_id: myRole,
                  user: { id: ME, email: 'me@example.com' },
                  role: { id: myRole, name: myRole === 'r-admin' ? 'admin' : 'user' },
                },
              ],
            }),
          );
        }
        if (url.startsWith(`${SERVER}/v1/role`)) {
          return Promise.resolve(
            json({
              roles: [
                { id: 'r-user', name: 'user', parent_id: null, team_id: null },
                { id: 'r-admin', name: 'admin', parent_id: 'r-user', team_id: null },
              ],
            }),
          );
        }
        return Promise.resolve(json({}));
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    deleteCookie('auth-team');
  });

  it('switches to another team, remembering it as active', async () => {
    const user = userEvent.setup();
    const view = renderTeam(ALPHA);
    const switcher = await view.findByLabelText('Team');
    await vi.waitFor(() => {
      expect(switcher).toHaveValue(ALPHA);
    });
    await user.selectOptions(switcher, BETA);
    expect(push).toHaveBeenCalledWith(`/team/${BETA}`);
    expect(getCookie('auth-team')).toBe(BETA);
  });

  it('lets an admin rename the team', async () => {
    const view = renderTeam(ALPHA);
    expect(await view.findByRole('button', { name: 'Rename team' })).toBeInTheDocument();
  });

  it('hides renaming from a member who is not an admin', async () => {
    myRole = 'r-user';
    const view = renderTeam(ALPHA);
    await view.findByLabelText('Team');
    // Once both the membership and the roles have loaded, the admin check has its answer.
    await vi.waitFor(() => {
      expect(calls.some(({ url }) => url.startsWith(`${SERVER}/v1/role`))).toBe(true);
      expect(calls.some(({ url }) => url === `${SERVER}/v1/team/${ALPHA}/user`)).toBe(true);
    });
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
    expect(view.queryByRole('button', { name: 'Rename team' })).toBeNull();
  });

  it('creates a team, confirming a name already in use, then opens it', async () => {
    const user = userEvent.setup();
    const view = renderTeam(ALPHA);
    await user.click(await view.findByRole('button', { name: 'Create team' }));
    await user.type(view.getByLabelText('Team name'), 'alpha');
    await user.click(view.getByRole('button', { name: 'Create' }));
    expect(await view.findByRole('status')).toHaveTextContent('You already belong to a team with this name.');
    await user.click(view.getByRole('button', { name: 'Create' }));
    await vi.waitFor(() => {
      expect(push).toHaveBeenCalledWith('/team/t-new');
    });
    const created = calls.find(({ url, init }) => url === `${SERVER}/v1/team` && init?.method === 'POST');
    expect(created?.init?.body).toBe('{"team":{"name":"alpha"}}');
  });
});
