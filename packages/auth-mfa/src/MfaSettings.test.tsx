// SPDX-License-Identifier: AGPL-3.0-or-later
import { render, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, type Mock, vi } from 'vitest';
import { TestWrapper, testConfig } from 'zephyrex/testing';
import { MfaSettings } from './MfaSettings';

const SERVER = testConfig.server.baseUrl;
const RECOVERY_CODE = 'AAAAA-11111';
const RECOVERY_CODES = [RECOVERY_CODE, 'BBBBB-22222'];
const CODE_FIELD = 'Code from the app';
const CODES_LIST = 'Recovery codes';
const HTTP_OK = 200;
const HTTP_NO_CONTENT = 204;

type Method = { id: string; method_type: string; is_enabled: boolean; is_primary: boolean; verification: boolean };

/** A tiny in-memory stand-in for the server's MFA routes, recording each write. */
const fakeServer = (initial: Method[]): { fetchMock: Mock; writes: string[] } => {
  let methods = [...initial];
  const writes: string[] = [];
  const json = (body: object): Response => new Response(JSON.stringify(body), { status: HTTP_OK });
  const fetchMock = vi.fn(async (url: string, init: RequestInit) => {
    const [path = ''] = url.replace(`${SERVER}/v1/user/mfa`, '').split('?');
    const method = init.method ?? 'GET';
    if (method !== 'GET') {
      writes.push(`${method} ${path} ${typeof init.body === 'string' ? init.body : ''}`);
    }
    if (method === 'GET' && path === '') {
      return Promise.resolve(json({ multifactor_methods: methods, pagination: { has_more: false } }));
    }
    if (method === 'POST' && path === '') {
      const created = { id: 'm-new', method_type: 'totp', is_enabled: true, is_primary: false, verification: false };
      methods = [...methods, created];
      return Promise.resolve(json({ multifactor_method: created }));
    }
    if (path.endsWith('/totp/provisioning')) {
      return Promise.resolve(json({ provisioning_uri: 'otpauth://totp/App:ada?secret=KEY123', secret: 'KEY123' }));
    }
    if (path.endsWith('/verify')) {
      const ok = init.body === '{"code":"123456"}';
      if (ok) {
        methods = methods.map((m) => ({ ...m, verification: true }));
      }
      return Promise.resolve(json({ verified: ok }));
    }
    if (path.endsWith('/recovery/generate')) {
      return Promise.resolve(json(RECOVERY_CODES));
    }
    if (path.endsWith('/disable')) {
      methods = methods.map((m) => ({ ...m, is_enabled: false }));
      return Promise.resolve(json({ disabled: true }));
    }
    if (path.endsWith('/delete')) {
      methods = [];
      return Promise.resolve(new Response(null, { status: HTTP_NO_CONTENT }));
    }
    return Promise.resolve(json({}));
  });
  vi.stubGlobal('fetch', fetchMock);
  return { fetchMock, writes };
};

const renderSettings = (): ReturnType<typeof render> => render(<MfaSettings />, { wrapper: TestWrapper });

const enrolled: Method = { id: 'm1', method_type: 'totp', is_enabled: true, is_primary: true, verification: true };

describe('MfaSettings', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sets up an authenticator app: QR and key, then a code, then one-time recovery codes', async () => {
    const { writes } = fakeServer([]);
    const user = userEvent.setup();
    const view = renderSettings();

    await user.click(await view.findByRole('button', { name: 'Set up an authenticator app' }));
    expect(await view.findByTitle('Authenticator app QR code')).toBeInTheDocument();
    expect(view.getByText('KEY123')).toBeInTheDocument();

    await user.type(view.getByLabelText(CODE_FIELD), '000000');
    await user.click(view.getByRole('button', { name: 'Turn on' }));
    expect(await view.findByRole('alert')).toHaveTextContent('That code didn’t match');

    await user.clear(view.getByLabelText(CODE_FIELD));
    await user.type(view.getByLabelText(CODE_FIELD), '123456');
    await user.click(view.getByRole('button', { name: 'Turn on' }));
    const codes = await view.findByRole('list', { name: CODES_LIST });
    expect(
      within(codes)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(RECOVERY_CODES);

    await user.click(view.getByRole('button', { name: 'I’ve saved them' }));
    expect(view.queryByRole('list', { name: CODES_LIST })).not.toBeInTheDocument();
    expect(writes).toEqual([
      'POST  {"multifactor_method":{"method_type":"totp"}}',
      'POST /m-new/verify {"code":"000000"}',
      'POST /m-new/verify {"code":"123456"}',
      'POST /m-new/recovery/generate {"count":10}',
    ]);
  });

  it('asks for a current code before turning an enrolled method off', async () => {
    const { writes } = fakeServer([enrolled]);
    const user = userEvent.setup();
    const view = renderSettings();

    const methods = await view.findByRole('list', { name: 'Sign-in methods' });
    expect(methods).toHaveTextContent('Authenticator app');
    expect(methods).toHaveTextContent('On');
    await user.click(within(methods).getByRole('button', { name: 'Turn off' }));
    const form = view.getByRole('form', { name: 'Turn off' });
    await user.type(within(form).getByLabelText('Authenticator or recovery code'), RECOVERY_CODE);
    await user.click(within(form).getByRole('button', { name: 'Turn off' }));

    expect(await within(methods).findByText('Off')).toBeInTheDocument();
    expect(writes).toEqual([`POST /m1/disable {"code":"${RECOVERY_CODE}"}`]);
  });

  it('removes an unfinished setup without a code', async () => {
    const { writes } = fakeServer([{ ...enrolled, verification: false, is_primary: false }]);
    const user = userEvent.setup();
    const view = renderSettings();

    const methods = await view.findByRole('list', { name: 'Sign-in methods' });
    expect(methods).toHaveTextContent('Setup not finished');
    await user.click(within(methods).getByRole('button', { name: 'Remove' }));
    expect(await view.findByRole('button', { name: 'Set up an authenticator app' })).toBeInTheDocument();
    expect(writes).toEqual(['POST /m1/delete {}']);
  });

  it('shows new recovery codes once on request', async () => {
    fakeServer([enrolled]);
    const user = userEvent.setup();
    const view = renderSettings();
    await user.click(await view.findByRole('button', { name: 'New recovery codes' }));
    expect(await view.findByRole('list', { name: CODES_LIST })).toHaveTextContent(RECOVERY_CODE);
  });
});
