// SPDX-License-Identifier: AGPL-3.0-or-later
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SDK_LIST_PATH, sdkDownloadPath, useSdks } from './useSdks';
import { TestWrapper } from '@/testing/TestWrapper';

const HTTP_OK = 200;

const sdk = {
  language: 'rust',
  extension: 'meta_sdk_rs',
  version: '0.0.0',
  filename: 'zephyrex-sdk-rust.zip',
  size: 2048,
  sha256: '0123456789abcdef'.repeat(4),
};

const serving = (body: object): void => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) =>
      Promise.resolve(new Response(JSON.stringify(url.endsWith(SDK_LIST_PATH) ? body : {}), { status: HTTP_OK })),
    ),
  );
};

describe('useSdks', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reads the generated SDKs', async () => {
    serving({ sdks: [sdk] });
    const { result } = renderHook(() => useSdks(), { wrapper: TestWrapper });
    await waitFor(() => {
      expect(result.current.data).toEqual([sdk]);
    });
  });

  it('rejects a checksum that is not a SHA-256 hex digest', async () => {
    serving({ sdks: [{ ...sdk, sha256: 'not-a-digest' }] });
    const { result } = renderHook(() => useSdks(), { wrapper: TestWrapper });
    await waitFor(() => {
      expect(result.current.error).toBeDefined();
    });
  });

  it('downloads each SDK from its language’s path', () => {
    expect(sdkDownloadPath('typescript')).toBe(`${SDK_LIST_PATH}/typescript/download`);
    expect(sdkDownloadPath('a/b')).toBe(`${SDK_LIST_PATH}/a%2Fb/download`);
  });
});
