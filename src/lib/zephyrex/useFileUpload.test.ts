// SPDX-License-Identifier: AGPL-3.0-or-later
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useFileUpload } from './useFileUpload';
import { TestWrapper } from '@/__tests__/test-wrapper';

const HTTP_CREATED = 201;
const HTTP_SERVER_ERROR = 500;

type SentRequest = { method: string; url: string; headers: Record<string, string> };

/** Answers every upload with a fixed status and body, recording what was sent. */
const fakeXhr = (status: number, body: string): SentRequest[] => {
  const sent: SentRequest[] = [];
  class FakeXhr extends EventTarget {
    readonly upload = new EventTarget();
    status = 0;
    statusText = '';
    responseText = '';
    private request: SentRequest = { method: '', url: '', headers: {} };
    open(method: string, url: string): void {
      this.request = { method, url, headers: {} };
    }
    setRequestHeader(header: string, value: string): void {
      this.request.headers[header] = value;
    }
    send(): void {
      sent.push(this.request);
      this.status = status;
      this.responseText = body;
      this.dispatchEvent(new Event('load'));
    }
  }
  vi.stubGlobal('XMLHttpRequest', FakeXhr);
  return sent;
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
    const sent = fakeXhr(HTTP_CREATED, JSON.stringify({ url: '/f/1', filename: 'hello.txt', size: 5, id: 'f1' }));
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
    expect(result.current.error).toBeNull();
  });

  it('reports a failed upload', async () => {
    fakeXhr(HTTP_SERVER_ERROR, 'boom');
    const { result } = renderHook(() => useFileUpload(), { wrapper: TestWrapper });
    await act(async () => {
      expect(await result.current.upload(file)).toBeNull();
    });
    expect(result.current.error?.message).toMatch(/^Upload failed: 500/);
    expect(result.current.uploading).toBe(false);
  });

  it('refuses an answer that is not an upload result', async () => {
    fakeXhr(HTTP_CREATED, JSON.stringify({ ok: true }));
    const { result } = renderHook(() => useFileUpload(), { wrapper: TestWrapper });
    await act(async () => {
      expect(await result.current.upload(file)).toBeNull();
    });
    expect(result.current.error?.message).toMatch(/not an upload result/);
  });
});
