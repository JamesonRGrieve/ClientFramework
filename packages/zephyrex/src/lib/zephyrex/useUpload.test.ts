// SPDX-License-Identifier: AGPL-3.0-or-later
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { type UploadRequest, useUpload } from './useUpload';
import { fakeXhr } from '@/testing/fakeXhr';
import { nth } from '@/testing/nth';
import { TestWrapper } from '@/testing/TestWrapper';

const HTTP_CREATED = 201;

/** A file going up as its own bytes, named in the query, as the attachments extension takes it. */
const RAW: UploadRequest<{ id: string }> = {
  path: (file) => `/v1/asset/upload?name=${encodeURIComponent(file.name)}`,
  body: (file) => file,
  headers: (file) => ({ 'Content-Type': file.type }),
  answer: z.object({ id: z.string() }),
};

const picture = new File(['12345678'], 'map of terra.png', { type: 'image/png' });

describe('useUpload', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    document.cookie = 'zx_csrf=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  });

  it('sends the file as the request says, with the CSRF token, and reports full progress', async () => {
    document.cookie = 'zx_csrf=token-2; path=/';
    const fake = fakeXhr(HTTP_CREATED, JSON.stringify({ id: 'a1' }));
    vi.stubGlobal('XMLHttpRequest', fake.Xhr);
    const { result } = renderHook(() => useUpload(RAW), { wrapper: TestWrapper });
    let answered: { id: string } | null = null;
    await act(async () => {
      answered = await result.current.upload(picture);
    });
    expect(answered).toEqual({ id: 'a1' });
    const sent = nth(fake.sent, 0);
    expect(sent.url).toMatch(/\/v1\/asset\/upload\?name=map%20of%20terra\.png$/);
    expect(sent.headers).toEqual({ 'Content-Type': 'image/png', 'X-CSRF-Token': 'token-2' });
    expect(sent.body).toBe(picture);
    expect(result.current.progress).toEqual({ loaded: 8, total: 8, percent: 100 });
    expect(result.current.uploading).toBe(false);
  });

  it('refuses an answer the request does not describe', async () => {
    vi.stubGlobal('XMLHttpRequest', fakeXhr(HTTP_CREATED, JSON.stringify({ url: '/f/1' })).Xhr);
    const { result } = renderHook(() => useUpload(RAW), { wrapper: TestWrapper });
    await act(async () => {
      expect(await result.current.upload(picture)).toBeNull();
    });
    expect(result.current.error?.message).toMatch(/not an upload result/);
  });
});
