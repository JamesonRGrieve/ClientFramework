// SPDX-License-Identifier: AGPL-3.0-or-later
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, type Mock, vi } from 'vitest';
import { ZephyrexClient } from 'zephyrex';
import { TestWrapper, testConfig } from 'zephyrex/testing';
import { mfaApi, useMfaMethods } from './mfaApi';

const SERVER = testConfig.server.baseUrl;
const HTTP_OK = 200;
const HTTP_NO_CONTENT = 204;

const client = new ZephyrexClient({ baseUrl: SERVER });
const method = { id: 'm1', method_type: 'totp', is_enabled: true, is_primary: false, verification: false };

type FetchMock = Mock<(url: string, init: RequestInit) => Promise<Response>>;

const answer = (body: object | null): FetchMock => {
  const fetchMock: FetchMock = vi.fn(async () =>
    Promise.resolve(
      body === null
        ? new Response(null, { status: HTTP_NO_CONTENT })
        : new Response(JSON.stringify(body), { status: HTTP_OK }),
    ),
  );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

const sent = (fetchMock: FetchMock): [string, string | undefined, unknown] => {
  const [url, init] = fetchMock.mock.calls[0] ?? ['', {}];
  return [url, init.method, init.body];
};

describe('mfaApi', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists methods from the multifactor_methods pages', async () => {
    const fetchMock = answer({ multifactor_methods: [method], pagination: { has_more: false } });
    await expect(mfaApi.list(client)).resolves.toEqual([method]);
    expect(sent(fetchMock)[0]).toBe(`${SERVER}/v1/user/mfa?offset=0&limit=100`);
  });

  it('creates a TOTP method wrapped as multifactor_method', async () => {
    const fetchMock = answer({ multifactor_method: method });
    await expect(mfaApi.createTotp(client)).resolves.toEqual(method);
    expect(sent(fetchMock)).toEqual([`${SERVER}/v1/user/mfa`, 'POST', '{"multifactor_method":{"method_type":"totp"}}']);
  });

  it('reads the provisioning URI and key for an unverified method', async () => {
    const fetchMock = answer({ provisioning_uri: 'otpauth://totp/App:a?secret=ABC', secret: 'ABC' });
    await expect(mfaApi.provisioning(client, 'm1')).resolves.toEqual({
      provisioning_uri: 'otpauth://totp/App:a?secret=ABC',
      secret: 'ABC',
    });
    expect(sent(fetchMock)).toEqual([`${SERVER}/v1/user/mfa/m1/totp/provisioning`, 'GET', undefined]);
  });

  it('verifies a code and reports whether it matched', async () => {
    const fetchMock = answer({ verified: false });
    await expect(mfaApi.verify(client, 'm1', '123456')).resolves.toBe(false);
    expect(sent(fetchMock)).toEqual([`${SERVER}/v1/user/mfa/m1/verify`, 'POST', '{"code":"123456"}']);
  });

  it('returns freshly generated recovery codes', async () => {
    const fetchMock = answer(['AAAAA-BBBBB', 'CCCCC-DDDDD']);
    await expect(mfaApi.generateRecoveryCodes(client, 'm1', 2)).resolves.toEqual(['AAAAA-BBBBB', 'CCCCC-DDDDD']);
    expect(sent(fetchMock)).toEqual([`${SERVER}/v1/user/mfa/m1/recovery/generate`, 'POST', '{"count":2}']);
  });

  it('turns off or removes a method, with the code when one is given', async () => {
    const disable = answer({ disabled: true });
    await mfaApi.disable(client, 'm1', '654321');
    expect(sent(disable)).toEqual([`${SERVER}/v1/user/mfa/m1/disable`, 'POST', '{"code":"654321"}']);
    const remove = answer(null);
    await mfaApi.remove(client, 'm1');
    expect(sent(remove)).toEqual([`${SERVER}/v1/user/mfa/m1/delete`, 'POST', '{}']);
  });
});

describe('useMfaMethods', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reads the signed-in user's methods", async () => {
    answer({ multifactor_methods: [method], pagination: { has_more: false } });
    const { result } = renderHook(() => useMfaMethods().data, { wrapper: TestWrapper });
    await waitFor(() => {
      expect(result.current).toEqual([method]);
    });
  });
});
