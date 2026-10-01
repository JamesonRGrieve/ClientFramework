// SPDX-License-Identifier: AGPL-3.0-or-later
import { render, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Manage } from './Manage';
import { withSession } from '@/testing/session';
import { TestWrapper, testConfig, wrapperWith } from '@/testing/TestWrapper';

const HTTP_OK = 200;
const HTTP_UNAUTHORIZED = 401;
const PROFILE = { id: 'u1', email: 'ada@example.com', first_name: 'Ada', last_name: 'Lovelace', timezone: 'Europe/London' };

const serve = (routes: Record<string, { status?: number; body: object }>): ReturnType<typeof vi.fn> => {
  const byPath = new Map(Object.entries(routes));
  const fetchMock = vi.fn(async (url: string) => {
    const [path = ''] = url.replace(testConfig.server.baseUrl, '').split('?');
    const route = byPath.get(path);
    return Promise.resolve(new Response(JSON.stringify(route?.body ?? {}), { status: route?.status ?? HTTP_OK }));
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

const ACCOUNT = {
  '/v1/user': { body: { user: PROFILE } },
  '/v1/team': { body: { teams: [{ id: 't1', name: 'Analytical Engines', description: null }] } },
  '/v1/user/password-policy': { body: { min_length: 8, max_bytes: 72, require_letter: true, require_digit: true } },
};

describe('Manage', () => {
  let signOut: () => void;

  beforeEach(() => {
    signOut = withSession();
  });

  afterEach(() => {
    signOut();
    vi.unstubAllGlobals();
  });

  it("shows the user's profile, password, extension sections and teams", async () => {
    serve(ACCOUNT);
    const view = render(
      <TestWrapper>
        <Manage heading='Account Management' sections={<p>Two-factor authentication</p>} />
      </TestWrapper>,
    );
    expect(view.getByRole('heading', { name: 'Account Management' })).toBeInTheDocument();
    expect(view.getByRole('button', { name: `Go to ${testConfig.app.name}` })).toBeInTheDocument();
    const teams = await view.findByRole('list', { name: 'Your teams' });
    expect(within(teams).getByRole('link', { name: 'Analytical Engines' })).toHaveAttribute('href', '/team/t1');
    expect(view.getByRole('form', { name: 'Change password' })).toBeInTheDocument();
    expect(view.getByText('Two-factor authentication')).toBeInTheDocument();
  });

  it('leaves out the password section when the app signs in without passwords', async () => {
    const fetchMock = serve(ACCOUNT);
    const Wrapper = wrapperWith({ auth: { authModes: { basic: false, magical: true } } });
    const view = render(
      <Wrapper>
        <Manage />
      </Wrapper>,
    );
    expect(await view.findByRole('list', { name: 'Your teams' })).toBeInTheDocument();
    expect(view.queryByRole('form', { name: 'Change password' })).toBeNull();
    expect(fetchMock.mock.calls.map(([url]) => String(url))).not.toContainEqual(expect.stringContaining('password-policy'));
  });

  it('says why the account could not be loaded', async () => {
    serve({ ...ACCOUNT, '/v1/user': { status: HTTP_UNAUTHORIZED, body: { detail: 'Session has been revoked' } } });
    const view = render(
      <TestWrapper>
        <Manage />
      </TestWrapper>,
    );
    expect(await view.findByRole('alert')).toHaveTextContent('Your account could not be loaded: Session has been revoked');
  });
});
