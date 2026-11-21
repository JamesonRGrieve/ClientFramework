// SPDX-License-Identifier: AGPL-3.0-or-later
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useFileUpload } from './useFileUpload';
import { fakeXhr, type SentRequest } from '@/testing/fakeXhr';
import { TestWrapper } from '@/testing/TestWrapper';

const HTTP_CREATED = 201;
const HTTP_SERVER_ERROR = 500;

/** Puts a fake XMLHttpRequest in place that answers every upload with `status` and `body`. */
const answering = (status: number, body: string): SentRequest[] => {
  const fake = fakeXhr(status, body);
  vi.stubGlobal('XMLHttpRequest', fake.Xhr);
  return fake.sent;
};

const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });

describe('useFileUpload', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    document.cookie = 'zx_csrf=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  });

  it('starts in idle state', () => {
    const { result } = renderHook(() => useFileUpload(), { wrapper: TestWrapper });
    expect(result.current.uploading).toBe(false);
    expect(result.current.progress).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('posts the file with the CSRF token and returns what the server stored', async () => {
    document.cookie = 'zx_csrf=token-1; path=/';
    const sent = answering(HTTP_CREATED, JSON.stringify({ url: '/f/1', filename: 'hello.txt', size: 5, id: 'f1' }));
    const { result } = renderHook(() => useFileUpload('/v1/avatar'), { wrapper: TestWrapper });
    let stored: Awaited<ReturnType<typeof result.current.upload>> = null;
    await act(async () => {
      stored = await result.current.upload(file);
    });
    expect(stored).toEqual({ url: '/f/1', filename: 'hello.txt', size: 5, id: 'f1' });
    expect(sent).toHaveLength(1);
    expect(sent[0]?.method).toBe('POST');
    expect(sent[0]?.url).toMatch(/\/v1\/avatar$/);
    expect(sent[0]?.headers['X-CSRF-Token']).toBe('token-1');
    const body = sent[0]?.body;
    expect(body instanceof FormData ? body.get('file') : null).toBeInstanceOf(File);
    expect(result.current.error).toBeNull();
  });

  it('reports a failed upload', async () => {
    answering(HTTP_SERVER_ERROR, 'boom');
    const { result } = renderHook(() => useFileUpload(), { wrapper: TestWrapper });
    await act(async () => {
      expect(await result.current.upload(file)).toBeNull();
    });
    expect(result.current.error?.message).toMatch(/^Upload failed: 500/);
    expect(result.current.uploading).toBe(false);
  });

  it('refuses an answer that is not an upload result', async () => {
    answering(HTTP_CREATED, JSON.stringify({ ok: true }));
    const { result } = renderHook(() => useFileUpload(), { wrapper: TestWrapper });
    await act(async () => {
      expect(await result.current.upload(file)).toBeNull();
    });
    expect(result.current.error?.message).toMatch(/not an upload result/);
  });
});
