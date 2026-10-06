// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { fetchFrom, rowOf } from 'zephyrex/testing/msw';
import { CREATION_OPTIONS, credentialHandlers, credentialsFixture } from './credentials.mocks';

const BASE = 'http://localhost:1996';
const post = (body: object): RequestInit => ({ method: 'POST', body: JSON.stringify(body) });

describe('the mock passkeys server', () => {
  it('opens a registration with creation options, and stores what the browser returned under its name', async () => {
    const store = credentialsFixture();
    const serve = fetchFrom(credentialHandlers(store));
    await expect((await serve(`${BASE}/v1/webauthn/register/options`, post({}))).json()).resolves.toMatchObject({
      ceremony_id: 'ceremony-1',
      public_key: CREATION_OPTIONS,
    });
    const verified = await serve(
      `${BASE}/v1/webauthn/register/verify`,
      post({ ceremony_id: 'ceremony-1', credential: { id: 'bmV3' }, device_name: 'Phone' }),
    );
    await expect(verified.json()).resolves.toMatchObject({ credential: { id: 'cred-new-1', device_name: 'Phone' } });
    expect(rowOf(store.credentials, 'cred-new-1')).toMatchObject({ is_enabled: true, is_discoverable: true });
  });
});
