// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import { useAuthentication } from '@zephyrex/auth';
import type { ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ZephyrexClientExtension } from '../../types';
import { UserPage } from './UserPage';
import { UserPages } from './UserPages';
import { TestWrapper } from '@/testing/TestWrapper';

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
    expect(await closedView.findByText('Enter your email to sign in.')).toBeInTheDocument();
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
    expect(await view.findByText('Enter your email to sign in.')).toBeInTheDocument();
  });
});
