// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import { useParams } from 'next/navigation.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProviderSidebar } from './providerSideBar';
import { TestWrapper, testConfig } from '@/__tests__/test-wrapper';

const HTTP_OK = 200;

const routes: Record<string, object> = {
  '/v1/extension': {
    extensions: [
      { id: 'x-ai', name: 'ai_agents' },
      { id: 'x-unused', name: 'unused' },
    ],
  },
  '/v1/provider': {
    providers: [
      { id: 'p-openai', name: 'openai', friendly_name: 'OpenAI' },
      { id: 'p-smtp', name: 'smtp' },
    ],
  },
  '/v1/provider/extension': { provider_extensions: [{ provider_id: 'p-openai', extension_id: 'x-ai' }] },
  '/v1/provider/instance': {
    provider_instances: [{ id: 'i-gpt', name: 'Main GPT', provider_id: 'p-openai', created_at: '2026-09-01T00:00:00Z' }],
  },
  '/v1/user': { user: { id: 'u1', email: 'me@example.com' } },
};

const renderSidebar = (instanceId?: string): ReturnType<typeof render> => {
  vi.mocked(useParams).mockReturnValue(instanceId === undefined ? {} : { id: instanceId });
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
      <ProviderSidebar />
    </TestWrapper>,
  );
};

describe('ProviderSidebar', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.mocked(useParams).mockReturnValue({});
  });

  it('offers extension, provider and instance pickers, each labelled', () => {
    const view = renderSidebar();
    expect(view.getByLabelText('Extension')).toHaveTextContent('All extensions');
    expect(view.getByLabelText('Provider')).toHaveTextContent('All providers');
    expect(view.getByLabelText('Instance')).toBeInTheDocument();
  });

  it('needs a provider before an instance can be created, and an instance before rename or delete', () => {
    const view = renderSidebar();
    expect(view.getByRole('button', { name: 'New instance' })).toBeDisabled();
    expect(view.getByRole('button', { name: 'Rename' })).toBeDisabled();
    expect(view.getByRole('button', { name: 'Delete' })).toBeDisabled();
  });

  it('scopes to the open instance’s provider and enables its actions', async () => {
    const view = renderSidebar('i-gpt');
    expect(await view.findByText('Main GPT')).toBeInTheDocument();
    expect(view.getByLabelText('Provider')).toHaveTextContent('OpenAI');
    expect(view.getByRole('button', { name: 'New instance' })).toBeEnabled();
    expect(view.getByRole('button', { name: 'Rename' })).toBeEnabled();
    expect(view.getByRole('button', { name: 'Delete' })).toBeEnabled();
  });
});
