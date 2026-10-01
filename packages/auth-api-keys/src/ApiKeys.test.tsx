// SPDX-License-Identifier: AGPL-3.0-or-later
import { render, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestWrapper, testConfig } from 'zephyrex/testing';
import { API_KEYS_ENDPOINT, type ApiKey, ApiKeys, expiryFromDate } from './ApiKeys';

const ENDPOINT = `${testConfig.server.baseUrl}${API_KEYS_ENDPOINT}`;
const HTTP_OK = 200;
const HTTP_NO_CONTENT = 204;
const HTTP_UNPROCESSABLE = 422;

const json = (body: object, status = HTTP_OK): Response => new Response(JSON.stringify(body), { status });

const renderKeys = (): ReturnType<typeof render> =>
  render(
    <TestWrapper>
      <ApiKeys />
    </TestWrapper>,
  );

describe('expiryFromDate', () => {
  it('is the end of the chosen day, or none', () => {
    expect(expiryFromDate('')).toBeUndefined();
    expect(new Date(expiryFromDate('2026-12-31') ?? '').getDate()).toBe(31);
  });
});

describe('ApiKeys', () => {
  let keys: ApiKey[];
  let calls: { url: string; init: RequestInit | undefined }[];

  beforeEach(() => {
    keys = [
      { id: 'k1', name: 'CI', created_at: '2026-09-01T00:00:00Z', last_used_at: null, expires_at: null },
      { id: 'k2', name: 'Old', created_at: '2026-08-01T00:00:00Z', is_revoked: true },
    ];
    calls = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        calls.push({ url, init });
        if (url === `${ENDPOINT}/issue`) {
          keys = [...keys, { id: 'k3', name: 'Deploy', created_at: '2026-09-30T00:00:00Z' }];
          return Promise.resolve(json({ id: 'k3', name: 'Deploy', key: 'zx_raw_key_3' }));
        }
        if (url === `${ENDPOINT}/rotate`) {
          return Promise.resolve(json({ id: 'k1', name: 'CI', key: 'zx_raw_key_1b' }));
        }
        if (init?.method === 'DELETE') {
          keys = keys.filter((key) => !url.endsWith(`/${key.id}`));
          return Promise.resolve(new Response(null, { status: HTTP_NO_CONTENT }));
        }
        if (url.startsWith(`${ENDPOINT}?`)) {
          return Promise.resolve(json({ api_keys: keys, pagination: { has_more: false } }));
        }
        // The rest of the app shell's requests.
        return Promise.resolve(json({}));
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists the keys that still work', async () => {
    const view = renderKeys();
    const list = await view.findByRole('list', { name: 'API keys' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(1);
    expect(within(list).getByText('CI')).toBeInTheDocument();
  });

  it('issues a key and shows it once', async () => {
    const user = userEvent.setup();
    const view = renderKeys();
    await user.type(await view.findByLabelText('Key name'), 'Deploy');
    await user.click(view.getByRole('button', { name: 'Issue key' }));
    expect(await view.findByText('zx_raw_key_3')).toBeInTheDocument();
    expect(calls.find(({ url }) => url === `${ENDPOINT}/issue`)?.init?.body).toBe('{"name":"Deploy"}');
    await user.click(view.getByRole('button', { name: 'Done' }));
    expect(view.queryByText('zx_raw_key_3')).toBeNull();
    expect(await view.findByText('Deploy')).toBeInTheDocument();
  });

  it('copies a newly issued key', async () => {
    const user = userEvent.setup();
    // After setup, which installs a clipboard of its own.
    const writeText = vi.fn(async () => Promise.resolve());
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    const view = renderKeys();
    await user.type(await view.findByLabelText('Key name'), 'Deploy');
    await user.click(view.getByRole('button', { name: 'Issue key' }));
    await user.click(await view.findByRole('button', { name: 'Copy key' }));
    expect(writeText).toHaveBeenCalledWith('zx_raw_key_3');
  });

  it('asks for a name before issuing', async () => {
    const user = userEvent.setup();
    const view = renderKeys();
    await user.click(await view.findByRole('button', { name: 'Issue key' }));
    expect(await view.findByRole('alert')).toHaveTextContent('Name the key');
    expect(calls.some(({ url }) => url.endsWith('/issue'))).toBe(false);
  });

  it('rotates a key, showing its replacement once', async () => {
    const user = userEvent.setup();
    const view = renderKeys();
    await user.click(await view.findByRole('button', { name: 'Rotate CI' }));
    expect(await view.findByText('zx_raw_key_1b')).toBeInTheDocument();
    expect(calls.find(({ url }) => url === `${ENDPOINT}/rotate`)?.init?.body).toBe('{"key_id":"k1"}');
  });

  it("shows the server's reason when it refuses a key", async () => {
    vi.mocked(fetch).mockImplementation(async (url) =>
      Promise.resolve(
        url === `${ENDPOINT}/issue`
          ? json({ detail: 'API key limit reached' }, HTTP_UNPROCESSABLE)
          : json({ api_keys: [], pagination: { has_more: false } }),
      ),
    );
    const user = userEvent.setup();
    const view = renderKeys();
    await user.type(await view.findByLabelText('Key name'), 'Deploy');
    await user.click(view.getByRole('button', { name: 'Issue key' }));
    expect(await view.findByRole('alert')).toHaveTextContent('API key limit reached');
  });

  it('revokes a key', async () => {
    const user = userEvent.setup();
    const view = renderKeys();
    await user.click(await view.findByRole('button', { name: 'Revoke CI' }));
    expect(await view.findByText('You have no API keys.')).toBeInTheDocument();
  });
});
