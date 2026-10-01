// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useParams } from 'next/navigation.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ProviderSettingSpec } from 'zephyrex';
import { TestWrapper, testConfig } from 'zephyrex/testing';
import Providers, { fallbackText, instanceChanges, shownValue } from './providers';

const HTTP_OK = 200;
const instance = {
  id: 'i1',
  name: 'GPT',
  provider_id: 'p1',
  model_name: 'gpt-5',
  enabled: true,
  created_at: '2026-09-01T00:00:00Z',
};

describe('instanceChanges', () => {
  it('sends only what changed', () => {
    expect(instanceChanges(instance, { name: 'GPT', model_name: 'gpt-5.1', api_key: '', enabled: true })).toEqual({
      model_name: 'gpt-5.1',
    });
  });

  it('keeps the stored API key when the field is left blank, and replaces it otherwise', () => {
    expect(instanceChanges(instance, { name: 'GPT', model_name: 'gpt-5', api_key: '  ', enabled: true })).toEqual({});
    expect(instanceChanges(instance, { name: 'GPT', model_name: 'gpt-5', api_key: 'sk-new', enabled: true })).toEqual({
      api_key: 'sk-new',
    });
  });

  it('reports a toggled enabled flag and a trimmed rename', () => {
    expect(instanceChanges(instance, { name: ' GPT-5 ', model_name: 'gpt-5', api_key: '', enabled: false })).toEqual({
      name: 'GPT-5',
      enabled: false,
    });
  });
});

describe('Providers', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.mocked(useParams).mockReturnValue({});
  });

  const routes: Record<string, object> = {
    '/v1/provider/instance': { provider_instances: [instance] },
    '/v1/provider/instance/setting/search': {
      provider_instance_settings: [{ id: 's1', provider_instance_id: 'i1', key: 'temperature', value: '0.2' }],
    },
    '/v1/provider/instance/usage/search': { provider_instance_usages: [{ id: 'u1', key: 'input_tokens', value: 42 }] },
  };

  const renderInstance = (id: string | undefined): ReturnType<typeof render> => {
    vi.mocked(useParams).mockReturnValue(id === undefined ? {} : { id });
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) =>
        Promise.resolve(
          new Response(JSON.stringify(routes[url.replace(testConfig.server.baseUrl, '')] ?? {}), { status: HTTP_OK }),
        ),
      ),
    );
    return render(
      <TestWrapper>
        <Providers />
      </TestWrapper>,
    );
  };

  it('asks for an instance when none is selected', () => {
    expect(renderInstance(undefined).getByText('Choose an instance to manage it.')).toBeInTheDocument();
  });

  it('shows the instance with its settings and usage, never its API key', async () => {
    const view = renderInstance('i1');
    expect(await view.findByRole('heading', { name: 'GPT' })).toBeInTheDocument();
    expect(await view.findByRole('table', { name: 'Instance settings' })).toHaveTextContent('temperature0.2');
    expect(await view.findByRole('table', { name: 'Instance usage' })).toHaveTextContent('input_tokens42');
    expect(view.getByLabelText('New API key (leave blank to keep the current one)')).toHaveValue('');
  });

  it('says so when the instance is not visible', async () => {
    const view = renderInstance('missing');
    expect(await view.findByText('This instance does not exist or is not visible to you.')).toBeInTheDocument();
  });
});

/** amazon_sns as the server declares it. */
const accessKey: ProviderSettingSpec = {
  key: 'api_key',
  description: 'AWS access key id',
  env: null,
  default: null,
  write_only: true,
  field: 'api_key',
};
const secret: ProviderSettingSpec = {
  key: 'aws_secret_key',
  description: 'AWS secret access key',
  env: null,
  default: null,
  write_only: true,
  field: null,
};
const region: ProviderSettingSpec = {
  key: 'aws_region',
  description: null,
  env: 'AWS_REGION',
  default: 'us-east-1',
  write_only: false,
  field: null,
};
const sender: ProviderSettingSpec = {
  key: 'sender_id',
  description: null,
  env: null,
  default: null,
  write_only: false,
  field: null,
};
const SNS = [accessKey, secret, region, sender];

describe('fallbackText and shownValue', () => {
  it('spells out where an unset value comes from', () => {
    expect(fallbackText(region)).toBe('Not set: falls back to $AWS_REGION, then default us-east-1');
    expect(fallbackText(sender)).toBe('Not set');
    expect(fallbackText(null)).toBe('No longer read by this provider');
  });

  it('shows a secret only as set, and a plain value as it is', () => {
    const stored = { id: 's', provider_instance_id: 'i1', key: 'k', value: null, write_only: true };
    expect(shownValue({ key: 'aws_secret_key', spec: secret, setting: stored, writeOnly: true })).toBe('Set');
    expect(shownValue({ key: 'sender_id', spec: sender, setting: { ...stored, value: 'ZX' }, writeOnly: false })).toBe('ZX');
    expect(shownValue({ key: 'sender_id', spec: sender, setting: null, writeOnly: false })).toBe('Not set');
  });
});

describe('Providers with a settings catalogue', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.mocked(useParams).mockReturnValue({});
  });

  const settingsFor = (rows: object[]): object => ({ provider_instance_settings: rows });

  const renderSns = (): { view: ReturnType<typeof render>; writes: [string, string][] } => {
    const writes: [string, string][] = [];
    let stored: object[] = [{ id: 's1', provider_instance_id: 'i1', key: 'aws_secret_key', value: null, write_only: true }];
    vi.mocked(useParams).mockReturnValue({ id: 'i1' });
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        const path = url.replace(testConfig.server.baseUrl, '');
        if (path === '/v1/provider/instance/setting' && init?.method === 'POST') {
          writes.push([path, typeof init.body === 'string' ? init.body : '']);
          const created = { id: 's2', provider_instance_id: 'i1', key: 'sender_id', value: 'ZX', write_only: false };
          stored = [...stored, created];
          return Promise.resolve(new Response(JSON.stringify({ provider_instance_setting: created }), { status: HTTP_OK }));
        }
        const body: Record<string, object> = {
          '/v1/provider/instance': { provider_instances: [instance] },
          '/v1/provider/p1/settings': { provider_id: 'p1', provider: 'amazon_sns', settings: SNS },
          '/v1/provider/instance/setting/search': settingsFor(stored),
        };
        return Promise.resolve(new Response(JSON.stringify(body[path] ?? {}), { status: HTTP_OK }));
      }),
    );
    const view = render(
      <TestWrapper>
        <Providers />
      </TestWrapper>,
    );
    return { view, writes };
  };

  it("lists the provider's settings, a secret only as set, and names its API key", async () => {
    const { view } = renderSns();
    const table = await view.findByRole('table', { name: 'Instance settings' });
    await vi.waitFor(() => {
      expect(table).toHaveTextContent('aws_secret_keyAWS secret access keySet');
    });
    expect(table).toHaveTextContent('aws_regionNot set: falls back to $AWS_REGION, then default us-east-1');
    expect(table).not.toHaveTextContent('api_key');
    expect(view.getByLabelText('New AWS access key id (leave blank to keep the current one)')).toHaveValue('');
  });

  it('sets a value the instance has none for', async () => {
    const { view, writes } = renderSns();
    const user = userEvent.setup();
    await user.click(await view.findByRole('button', { name: 'Set sender_id' }));
    await user.type(view.getByLabelText('sender_id'), 'ZX');
    await user.click(view.getByRole('button', { name: 'Save sender_id' }));
    await vi.waitFor(() => {
      expect(writes).toEqual([
        [
          '/v1/provider/instance/setting',
          '{"provider_instance_setting":{"provider_instance_id":"i1","key":"sender_id","value":"ZX"}}',
        ],
      ]);
    });
  });

  it('starts a secret blank, as a password, when replacing it', async () => {
    const { view } = renderSns();
    const user = userEvent.setup();
    await user.click(await view.findByRole('button', { name: 'Replace aws_secret_key' }));
    expect(view.getByLabelText('aws_secret_key')).toHaveAttribute('type', 'password');
    expect(view.getByLabelText('aws_secret_key')).toHaveValue('');
  });
});
