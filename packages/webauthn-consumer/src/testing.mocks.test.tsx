// SPDX-License-Identifier: AGPL-3.0-or-later
import { afterEach, describe, expect, it, vi } from 'vitest';
import { credentialsFixture } from './credentials.mocks';
import { useCredentials } from './credentialsApi';
import { fakeAuthenticator, recordCalls, renderPasskeys } from './testing.mocks';

const BASE = 'http://localhost:1996';

function CredentialCount(): string {
  return `${String(useCredentials().data?.length ?? 0)} passkeys`;
}

describe('the test helpers', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('render under the Zephyrex test app, answering the credential routes from the store given', async () => {
    expect(await renderPasskeys(<CredentialCount />).findByText('3 passkeys')).toBeInTheDocument();
  });

  it('record each call answered from the store', async () => {
    const calls = recordCalls(credentialsFixture());
    await fetch(`${BASE}/v1/webauthn/credential`);
    expect(calls.map(({ url }) => url)).toEqual([`${BASE}/v1/webauthn/credential`]);
  });

  it('give jsdom an authenticator that answers or refuses, and take it away again', async () => {
    const answering = fakeAuthenticator();
    await expect(navigator.credentials.create()).resolves.toHaveProperty('toJSON');
    answering.restore();
    expect('credentials' in navigator).toBe(false);
    const refusing = fakeAuthenticator(new DOMException('', 'NotAllowedError'));
    await expect(navigator.credentials.create()).rejects.toThrow();
    refusing.restore();
  });
});
