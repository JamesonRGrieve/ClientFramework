// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import { useParams } from 'next/navigation.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TestWrapper, testConfig } from 'zephyrex/testing';
import Providers, { instanceChanges } from './providers';

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
