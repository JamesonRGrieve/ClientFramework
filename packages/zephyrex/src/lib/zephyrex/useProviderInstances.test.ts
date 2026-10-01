// SPDX-License-Identifier: AGPL-3.0-or-later
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, type Mock, vi } from 'vitest';
import {
  useProviderExtensionLinks,
  useProviderInstanceActions,
  useProviderInstanceDetail,
  useProviderInstances,
} from './useProviderInstances';
import { TestWrapper, testConfig } from '@/testing/TestWrapper';

const BASE = testConfig.server.baseUrl;
const HTTP_OK = 200;
const HTTP_NO_CONTENT = 204;
const SETTINGS = '/v1/provider/instance/setting';

const instance = { id: 'i1', name: 'GPT', provider_id: 'p1', created_at: '2026-09-01T00:00:00Z' };

type Handler = (path: string, init: RequestInit) => object | null;

const serve = (handler: Handler): Mock<(url: string, init: RequestInit) => Promise<Response>> => {
  const fetchMock = vi.fn(async (url: string, init: RequestInit) => {
    const body = handler(url.replace(BASE, ''), init);
    return Promise.resolve(
      body === null
        ? new Response(null, { status: HTTP_NO_CONTENT })
        : new Response(JSON.stringify(body), { status: HTTP_OK }),
    );
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

describe('provider instance hooks', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('read the provider↔extension links and the instances from their envelopes', async () => {
    serve((path) =>
      path === '/v1/provider/extension'
        ? { provider_extensions: [{ provider_id: 'p1', extension_id: 'x1' }] }
        : { provider_instances: [instance] },
    );
    const { result } = renderHook(() => ({ links: useProviderExtensionLinks(), instances: useProviderInstances() }), {
      wrapper: TestWrapper,
    });
    await waitFor(() => {
      expect(result.current.links.data).toEqual([{ provider_id: 'p1', extension_id: 'x1' }]);
      expect(result.current.instances.data).toEqual([instance]);
    });
  });

  it('find an instance’s settings and usage through the search routes', async () => {
    const fetchMock = serve((path) =>
      path.startsWith(SETTINGS)
        ? { provider_instance_settings: [{ id: 's1', provider_instance_id: 'i1', key: 'temperature', value: '0.2' }] }
        : { provider_instance_usages: [{ id: 'u1', key: 'input_tokens', value: 42 }] },
    );
    const { result } = renderHook(() => useProviderInstanceDetail('i1'), { wrapper: TestWrapper });
    await waitFor(() => {
      expect(result.current.settings.data?.map((setting) => setting.key)).toEqual(['temperature']);
      expect(result.current.usage.data?.map((record) => record.value)).toEqual([42]);
    });
    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE}${SETTINGS}/search`,
      expect.objectContaining({
        method: 'POST',
        body: '{"provider_instance_setting":{"provider_instance_id":{"eq":"i1"}}}',
      }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE}/v1/provider/instance/usage/search`,
      expect.objectContaining({ method: 'POST', body: '{"provider_instance_usage":{"provider_instance_id":{"eq":"i1"}}}' }),
    );
  });

  it('look nothing up without an instance', () => {
    const fetchMock = serve(() => ({}));
    renderHook(() => useProviderInstanceDetail(null), { wrapper: TestWrapper });
    expect(fetchMock).not.toHaveBeenCalledWith(expect.stringContaining('/search'), expect.anything());
  });

  it('create, update, delete and set values with the wrapped bodies the server expects', async () => {
    const fetchMock = serve((path, init) => {
      if (init.method === 'DELETE') {
        return null;
      }
      if (path === SETTINGS) {
        return {
          provider_instance_setting: {
            id: 's2',
            provider_instance_id: 'i1',
            key: 'aws_secret_key',
            value: null,
            write_only: true,
          },
        };
      }
      if (path.startsWith(`${SETTINGS}/`)) {
        return { provider_instance_setting: {} };
      }
      return init.method === 'GET' ? { provider_instances: [instance] } : { provider_instance: instance };
    });
    const { result } = renderHook(() => useProviderInstanceActions(), { wrapper: TestWrapper });

    await act(async () => {
      await result.current.create({ name: 'GPT', provider_id: 'p1', api_key: 'sk-1' });
      await result.current.update('i1', { name: 'GPT-5' });
      await result.current.remove('i1');
      await result.current.updateSetting({ id: 's1', provider_instance_id: 'i1', key: 'temperature' }, '0.5');
      // A secret comes back without its value: only that it is set.
      await expect(result.current.createSetting('i1', 'aws_secret_key', 'shh')).resolves.toMatchObject({
        id: 's2',
        value: null,
        write_only: true,
      });
      await result.current.removeSetting({ id: 's2', provider_instance_id: 'i1', key: 'aws_secret_key' });
    });

    const calls = fetchMock.mock.calls
      .filter(([, init]) => init.method !== 'GET')
      .map(([url, init]) => [init.method, url.replace(BASE, ''), init.body]);
    expect(calls).toEqual([
      ['POST', '/v1/provider/instance', '{"provider_instance":{"name":"GPT","provider_id":"p1","api_key":"sk-1"}}'],
      ['PUT', '/v1/provider/instance/i1', '{"provider_instance":{"name":"GPT-5"}}'],
      ['DELETE', '/v1/provider/instance/i1', undefined],
      ['PUT', `${SETTINGS}/s1`, '{"provider_instance_setting":{"value":"0.5"}}'],
      ['POST', SETTINGS, '{"provider_instance_setting":{"provider_instance_id":"i1","key":"aws_secret_key","value":"shh"}}'],
      ['DELETE', `${SETTINGS}/s2`, undefined],
    ]);
  });
});
