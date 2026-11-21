// SPDX-License-Identifier: AGPL-3.0-or-later
import { act, renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fakeXhr, TestWrapper, withSession } from 'zephyrex/testing';
import { fetchFrom } from 'zephyrex/testing/msw';
import { attachmentHandlers, emptyAttachmentStore, FAR_MOON, storeAsset, storeAttachment, TERRA } from './attachments.mocks';
import { useAttachmentActions, useAttachments } from './attachmentsApi';
import { PRIMARY_IMAGE } from './attachmentsModel';

const HTTP_CREATED = 201;

const wrapper = ({ children }: { children: ReactNode }): ReactNode => createElement(TestWrapper, null, children);

const picture = (name: string): File => new File(['png!'], name, { type: 'image/png' });

describe('a record’s attachments', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uploads a picture, attaches it as the record’s picture and replaces it', async () => {
    const store = emptyAttachmentStore();
    withSession();
    vi.stubGlobal('fetch', vi.fn(fetchFrom(attachmentHandlers(store))));
    const view = renderHook(
      () => ({
        pictures: useAttachments(TERRA, PRIMARY_IMAGE).data,
        all: useAttachments(TERRA).data,
        actions: useAttachmentActions(TERRA),
      }),
      { wrapper },
    );
    await waitFor(() => {
      expect(view.result.current.pictures).toEqual([]);
    });
    const first = storeAsset(store, 'terra.png', 'image/png', 4);
    const upload = fakeXhr(HTTP_CREATED, JSON.stringify({ asset: first }));
    vi.stubGlobal('XMLHttpRequest', upload.Xhr);
    await act(async () => {
      await view.result.current.actions.attachFile(picture('terra.png'), PRIMARY_IMAGE);
    });
    expect(upload.sent[0]?.url).toMatch(/\/v1\/asset\/upload\?name=terra\.png$/);
    expect(upload.sent[0]?.headers['Content-Type']).toBe('image/png');
    await waitFor(() => {
      expect(view.result.current.pictures?.map((one) => one.asset_id)).toEqual([first.id]);
    });
    const second = storeAsset(store, 'terra at night.png', 'image/png', 4);
    vi.stubGlobal('XMLHttpRequest', fakeXhr(HTTP_CREATED, JSON.stringify({ asset: second })).Xhr);
    await act(async () => {
      await view.result.current.actions.replaceFile(
        picture('terra at night.png'),
        PRIMARY_IMAGE,
        view.result.current.pictures ?? [],
      );
    });
    await waitFor(() => {
      expect(view.result.current.pictures?.map((one) => one.asset_id)).toEqual([second.id]);
    });
    expect(view.result.current.all?.map((one) => one.asset_id)).toEqual([second.id]);
  });

  it('removes an attachment and answers null for a failed upload', async () => {
    const store = emptyAttachmentStore();
    const kept = storeAttachment(store, storeAsset(store, 'brief.pdf', 'application/pdf', 9), TERRA, 'document');
    withSession();
    vi.stubGlobal('fetch', vi.fn(fetchFrom(attachmentHandlers(store))));
    vi.stubGlobal('XMLHttpRequest', fakeXhr(500, 'boom').Xhr);
    const view = renderHook(() => ({ all: useAttachments(TERRA).data, actions: useAttachmentActions(TERRA) }), { wrapper });
    await waitFor(() => {
      expect(view.result.current.all?.map((one) => one.id)).toEqual([kept.id]);
    });
    await act(async () => {
      expect(await view.result.current.actions.attachFile(picture('x.png'), 'gallery')).toBeNull();
    });
    expect(view.result.current.actions.upload.error?.message).toMatch(/^Upload failed: 500/);
    await act(async () => {
      await view.result.current.actions.remove(kept);
    });
    await waitFor(() => {
      expect(view.result.current.all).toEqual([]);
    });
  });

  it('reads nothing until there is a record, and fails for one the user may not view', async () => {
    const store = emptyAttachmentStore();
    store.viewable.delete(`${FAR_MOON.type}:${FAR_MOON.id}`);
    withSession();
    const fetching = vi.fn(fetchFrom(attachmentHandlers(store)));
    vi.stubGlobal('fetch', fetching);
    const none = renderHook(() => useAttachments(null).data, { wrapper });
    expect(none.result.current).toBeUndefined();
    const hidden = renderHook(() => ({ error: useAttachments(FAR_MOON).error }), { wrapper });
    await waitFor(() => {
      expect(hidden.result.current.error).toBeInstanceOf(Error);
    });
  });
});
