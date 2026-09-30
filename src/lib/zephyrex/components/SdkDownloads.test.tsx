// SPDX-License-Identifier: AGPL-3.0-or-later
import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SDK_LIST_PATH, type Sdk } from '../useSdks';
import { SdkDownloads } from './SdkDownloads';
import { TestWrapper, testConfig } from '@/__tests__/test-wrapper';

const HTTP_OK = 200;
const HTTP_SERVER_ERROR = 500;
const SHA = 'a'.repeat(64);

const python: Sdk = {
  language: 'python',
  extension: 'meta_sdk_py',
  version: '1.0.0a1',
  filename: 'zephyrex-sdk-python.zip',
  size: 1_536_000,
  sha256: SHA,
};

const serve = (status: number, body: { sdks: Sdk[] } | { detail: string }): void => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) =>
      Promise.resolve(
        url.endsWith(SDK_LIST_PATH)
          ? new Response(JSON.stringify(body), { status })
          : new Response('{}', { status: HTTP_OK }),
      ),
    ),
  );
};

const renderDownloads = (): ReturnType<typeof render> =>
  render(
    <TestWrapper>
      <SdkDownloads />
    </TestWrapper>,
  );

describe('SdkDownloads', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists each SDK with its version, size and checksum, and a link that downloads its zip', async () => {
    serve(HTTP_OK, { sdks: [python] });
    const view = renderDownloads();
    const link = await view.findByRole('link', { name: 'Download the Python SDK' });
    expect(link).toHaveAttribute('href', `${testConfig.server.baseUrl}${SDK_LIST_PATH}/python/download`);
    expect(link).toHaveAttribute('download', 'zephyrex-sdk-python.zip');
    const row = view.getByRole('row', { name: /Python/ });
    expect(row).toHaveTextContent('1.0.0a1');
    expect(row).toHaveTextContent('1.5 MB');
    expect(row).toHaveTextContent(SHA);
  });

  it('shows a language it has no name for as the server names it', async () => {
    serve(HTTP_OK, { sdks: [{ ...python, language: 'go', filename: 'zephyrex-sdk-go.zip' }] });
    const view = renderDownloads();
    expect(await view.findByRole('link', { name: 'Download the go SDK' })).toBeInTheDocument();
  });

  it('says so when the server has generated none', async () => {
    serve(HTTP_OK, { sdks: [] });
    const view = renderDownloads();
    expect(await view.findByText('This server has not generated any client SDKs.')).toBeInTheDocument();
  });

  it('says so when the list fails to load', async () => {
    serve(HTTP_SERVER_ERROR, { detail: 'boom' });
    const view = renderDownloads();
    expect(await view.findByText('Failed to load the client SDKs.')).toBeInTheDocument();
  });
});
