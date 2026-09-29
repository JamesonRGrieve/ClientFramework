// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ROOT_PROVIDER_STATUS_PATH, type RootProviderStatusResponse } from '../useRootProviderStatus';
import { RootProviderStatus } from './RootProviderStatus';
import { TestWrapper } from '@/__tests__/test-wrapper';

const HTTP_OK = 200;
const HTTP_FORBIDDEN = 403;

const serve = (status: number, body: RootProviderStatusResponse | { detail: string }): void => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) =>
      Promise.resolve(
        url.endsWith(ROOT_PROVIDER_STATUS_PATH)
          ? new Response(JSON.stringify(body), { status })
          : new Response('{}', { status: HTTP_OK }),
      ),
    ),
  );
};

const renderStatus = (): ReturnType<typeof render> =>
  render(
    <TestWrapper>
      <RootProviderStatus />
    </TestWrapper>,
  );

const status: RootProviderStatusResponse = {
  providers: [
    {
      provider: 'openai',
      extension: 'ai_agents',
      configured: true,
      settings: [
        { key: 'OPENAI_API_KEY', secret: true, set: true, value: null },
        { key: 'OPENAI_BASE_URL', secret: false, set: true, value: 'https://api.openai.com' },
      ],
    },
    {
      provider: 'smtp',
      extension: 'email',
      configured: false,
      settings: [{ key: 'SMTP_HOST', secret: false, set: false, value: null }],
    },
  ],
};

describe('RootProviderStatus', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows each provider’s configuration, never a secret’s value', async () => {
    serve(HTTP_OK, status);
    const view = renderStatus();
    const openai = await view.findByRole('table', { name: 'openai settings' });
    expect([...openai.querySelectorAll('tbody tr')].map((row) => row.textContent)).toEqual([
      'OPENAI_API_KEYSet (secret)',
      'OPENAI_BASE_URLhttps://api.openai.com',
    ]);
    expect(view.getByText('Configured')).toBeInTheDocument();
    expect(view.getByText('Not configured')).toBeInTheDocument();
    expect(view.getByRole('table', { name: 'smtp settings' })).toHaveTextContent('SMTP_HOSTNot set');
  });

  it('explains that the view is root only when the server refuses', async () => {
    serve(HTTP_FORBIDDEN, { detail: 'Root only' });
    const view = renderStatus();
    expect(await view.findByText('Only the root user can view provider environment configuration.')).toBeInTheDocument();
  });

  it('says so when no providers are loaded', async () => {
    serve(HTTP_OK, { providers: [] });
    const view = renderStatus();
    expect(await view.findByText('No providers are loaded.')).toBeInTheDocument();
  });
});
