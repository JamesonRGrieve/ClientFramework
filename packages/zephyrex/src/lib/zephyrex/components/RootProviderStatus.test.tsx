// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ROOT_PROVIDER_STATUS_PATH,
  type RootProviderStatusOptions,
  type RootProviderStatusResponse,
} from '../useRootProviderStatus';
import { RootProviderStatus } from './RootProviderStatus';
import { TestWrapper } from '@/testing/TestWrapper';

const HTTP_OK = 200;
const HTTP_FORBIDDEN = 403;
const SECRET_VAULT = 'secret_vault';

type FetchUrl = (url: string) => Promise<Response>;

const serve = (
  status: number,
  body: RootProviderStatusResponse | { detail: string },
): ReturnType<typeof vi.fn<FetchUrl>> => {
  const fetchMock = vi.fn<FetchUrl>(async (url) =>
    Promise.resolve(
      url.includes(ROOT_PROVIDER_STATUS_PATH)
        ? new Response(JSON.stringify(body), { status })
        : new Response('{}', { status: HTTP_OK }),
    ),
  );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

const renderStatus = (options: RootProviderStatusOptions = {}): ReturnType<typeof render> =>
  render(
    <TestWrapper>
      <RootProviderStatus {...options} />
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
      health: null,
    },
    {
      provider: 'smtp',
      extension: 'email',
      configured: false,
      settings: [{ key: 'SMTP_HOST', secret: false, set: false, value: null }],
      health: null,
    },
  ],
};

const vaultStatus: RootProviderStatusResponse = {
  providers: [
    {
      provider: 'openbao',
      extension: SECRET_VAULT,
      configured: true,
      settings: [
        { key: 'OPENBAO_ADDR', secret: false, set: true, value: 'https://vault.example.com' },
        { key: 'OPENBAO_TOKEN', secret: true, set: true, value: null },
      ],
      health: { status: 'degraded', detail: 'sealed standby' },
    },
    {
      provider: 'env',
      extension: SECRET_VAULT,
      configured: true,
      settings: [],
      health: { status: 'ok', detail: '' },
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
    expect(view.queryByText('Healthy')).not.toBeInTheDocument();
  });

  it('asks for one extension’s providers with their health, and shows each check', async () => {
    const fetchMock = serve(HTTP_OK, vaultStatus);
    const view = renderStatus({ extension: SECRET_VAULT, health: true });
    expect(await view.findByText('Degraded')).toBeInTheDocument();
    expect(view.getByText('sealed standby')).toBeInTheDocument();
    expect(view.getByText('Healthy')).toBeInTheDocument();
    expect(fetchMock.mock.calls.map(([url]) => url)).toContainEqual(
      expect.stringContaining(`${ROOT_PROVIDER_STATUS_PATH}?extension=${SECRET_VAULT}&health=true`),
    );
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

  it('names the extension when it has no providers loaded', async () => {
    serve(HTTP_OK, { providers: [] });
    const view = renderStatus({ extension: SECRET_VAULT });
    expect(await view.findByText(`No providers are loaded for the ${SECRET_VAULT} extension.`)).toBeInTheDocument();
  });
});
