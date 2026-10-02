// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import { useAuthentication } from '@zephyrex/auth';
import type { ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ZephyrexClientExtension } from '../../types';
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
});
