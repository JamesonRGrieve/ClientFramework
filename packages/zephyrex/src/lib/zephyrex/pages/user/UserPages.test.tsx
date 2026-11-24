// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import { useAuthentication } from '@zephyrex/auth';
import type { ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ZephyrexClientExtension } from '../../types';
import { UserPage } from './UserPage';
import { UserPages } from './UserPages';
import { TestWrapper } from '@/testing/TestWrapper';

const WAITLIST_LINK = /Join the waitlist/;
const SIGN_IN_ONLY = 'Enter your email to sign in.';

/** An extension's auth page, showing what of the auth configuration it was handed. */
function PairingPage(): ReactElement {
  const { authPath, signInAlternatives } = useAuthentication();
  return <p>{`Pairing under ${authPath}, linked as ${signInAlternatives.map(({ label }) => label).join(', ')}`}</p>;
}

const PAIRING: ZephyrexClientExtension = {
  name: 'auth_device_pairing',
  serverExtension: 'auth_device_pairing',
  authPages: [{ path: '/pair', component: PairingPage }],
  signInAlternatives: [{ label: 'Sign in with another device', path: '/pair' }],
};

describe('UserPages', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('mounts a registered extension’s auth page inside the auth router, without asking the server', async () => {
    const fetchMock = vi.fn(async () => Promise.resolve(new Response('{}')));
    vi.stubGlobal('fetch', fetchMock);
    const view = render(
      <TestWrapper config={{ extensions: [PAIRING] }}>
        <UserPages slug={['pair']} sections={null} />
      </TestWrapper>,
    );
    expect(await view.findByText('Pairing under /user, linked as Sign in with another device')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalledWith(expect.stringContaining('/v1/extension'), expect.anything());
  });

  it('offers sign-in only on the welcome page while sign-up is closed, and sign-up beside it otherwise', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.resolve(new Response('{}'))),
    );
    const closedView = render(
      <TestWrapper>
        <UserPages slug={[]} sections={null} signupOpen={false} />
      </TestWrapper>,
    );
    expect(await closedView.findByText(SIGN_IN_ONLY)).toBeInTheDocument();
    closedView.unmount();
    const openView = render(
      <TestWrapper>
        <UserPages slug={[]} sections={null} />
      </TestWrapper>,
    );
    expect(await openView.findByText('Enter your email to sign in or create an account.')).toBeInTheDocument();
  });
});

describe('UserPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('reads REGISTRATION_MODE on the server, as the middleware does', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.resolve(new Response('{}'))),
    );
    vi.stubEnv('REGISTRATION_MODE', 'closed');
    const view = render(<TestWrapper>{await UserPage({ params: Promise.resolve({}) })}</TestWrapper>);
    expect(await view.findByText(SIGN_IN_ONLY)).toBeInTheDocument();
    expect(view.queryByRole('link', { name: WAITLIST_LINK })).toBeNull();
  });

  it('links the welcome page to the app’s waitlist page while sign-up is closed', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.resolve(new Response('{}'))),
    );
    vi.stubEnv('REGISTRATION_MODE', 'closed');
    vi.stubEnv('SIGNUP_DISABLED_PATH', '/waitlist');
    const view = render(<TestWrapper>{await UserPage({ params: Promise.resolve({}) })}</TestWrapper>);
    expect(await view.findByRole('link', { name: WAITLIST_LINK })).toHaveAttribute('href', '/waitlist');
  });

  it('leaves an address on another site to the middleware, with no link', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.resolve(new Response('{}'))),
    );
    vi.stubEnv('REGISTRATION_MODE', 'closed');
    vi.stubEnv('SIGNUP_DISABLED_PATH', 'https://example.org/join');
    const view = render(<TestWrapper>{await UserPage({ params: Promise.resolve({}) })}</TestWrapper>);
    await view.findByText(SIGN_IN_ONLY);
    expect(view.queryByRole('link', { name: WAITLIST_LINK })).toBeNull();
  });
});
