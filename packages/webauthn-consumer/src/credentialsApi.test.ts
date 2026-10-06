// SPDX-License-Identifier: AGPL-3.0-or-later
import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ZephyrexClient } from 'zephyrex';
import { loaded, TestWrapper, testConfig } from 'zephyrex/testing';
import { type Call, rowOf, writesOf } from 'zephyrex/testing/msw';
import { CLONED_ID, CREATION_OPTIONS, credentialsFixture, KEY_ID, LAPTOP_ID } from './credentials.mocks';
import { registerPasskey, useCredentialActions, useCredentials } from './credentialsApi';
import { fakeAuthenticator, recordCalls } from './testing.mocks';

const client = new ZephyrexClient({ baseUrl: testConfig.server.baseUrl });

describe('the passkeys API', () => {
  let store = credentialsFixture();
  let calls: Call[] = [];
  let restore = (): void => undefined;

  beforeEach(() => {
    store = credentialsFixture();
    calls = recordCalls(store);
  });

  afterEach(() => {
    restore();
    vi.unstubAllGlobals();
  });

  it('reads the user’s credentials newest first', async () => {
    expect((await loaded(() => useCredentials())).map(({ id }) => id)).toEqual([KEY_ID, LAPTOP_ID, CLONED_ID]);
  });

  it('registers a passkey through the browser, naming where it should live', async () => {
    const authenticator = fakeAuthenticator();
    restore = authenticator.restore;
    await expect(registerPasskey(client, 'platform', 'Phone')).resolves.toMatchObject({ device_name: 'Phone' });
    await registerPasskey(client, null, null);
    expect(authenticator.create).toHaveBeenCalledWith({ publicKey: CREATION_OPTIONS });
    expect(writesOf(calls)).toEqual([
      ['POST', '/v1/webauthn/register/options', '{"authenticator_attachment":"platform"}', null],
      [
        'POST',
        '/v1/webauthn/register/verify',
        '{"ceremony_id":"ceremony-1","credential":{"id":"bmV3","rawId":"bmV3","type":"public-key"},"device_name":"Phone"}',
        null,
      ],
      ['POST', '/v1/webauthn/register/options', '{}', null],
      [
        'POST',
        '/v1/webauthn/register/verify',
        '{"ceremony_id":"ceremony-1","credential":{"id":"bmV3","rawId":"bmV3","type":"public-key"},"device_name":null}',
        null,
      ],
    ]);
  });

  it('renames and removes a credential, each guarded by it as loaded', async () => {
    const { result } = renderHook(() => useCredentialActions(), { wrapper: TestWrapper });
    await expect(
      result.current.rename.save(rowOf(store.credentials, LAPTOP_ID), { device_name: 'Work laptop' }),
    ).resolves.toBe(true);
    await expect(result.current.remove.save(rowOf(store.credentials, CLONED_ID), {})).resolves.toBe(true);
    expect(writesOf(calls)).toEqual([
      [
        'PUT',
        `/v1/webauthn/credential/${LAPTOP_ID}`,
        '{"web_authn_credential":{"device_name":"Work laptop"}}',
        '"2026-09-01T09:00:00"',
      ],
      ['DELETE', `/v1/webauthn/credential/${CLONED_ID}`, undefined, '"2026-08-01T09:00:00"'],
    ]);
    expect(rowOf(store.credentials, LAPTOP_ID).device_name).toBe('Work laptop');
    expect(store.credentials.map(({ id }) => id)).not.toContain(CLONED_ID);
  });
});
