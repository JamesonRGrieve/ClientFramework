// SPDX-License-Identifier: AGPL-3.0-or-later
import { act, renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TestWrapper, withSession } from 'zephyrex/testing';
import { fetchFrom } from 'zephyrex/testing/msw';
import { emptyMediaStore, mediaHandlers } from './media.mocks';
import { useWatchListActions, useWatchLists } from './mediaApi';
import { present } from './testing.mocks';

const wrapper = ({ children }: { children: ReactNode }): ReactNode => createElement(TestWrapper, null, children);

describe('the watch-list reads and writes', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('starts a list, adds a title and refreshes the lists after each', async () => {
    const store = emptyMediaStore();
    withSession();
    vi.stubGlobal('fetch', vi.fn(fetchFrom(mediaHandlers(store))));
    const view = renderHook(() => ({ lists: useWatchLists().data, actions: useWatchListActions() }), { wrapper });
    await waitFor(() => {
      expect(view.result.current.lists).toEqual([]);
    });
    await act(async () => {
      await view.result.current.actions.start('Films');
    });
    await waitFor(() => {
      expect(view.result.current.lists?.map((started) => started.name)).toEqual(['Films']);
    });
    const list = present(view.result.current.lists?.[0], 'the list started');
    await act(async () => {
      await view.result.current.actions.add(list, 'tmdb:movie:603');
    });
    await waitFor(() => {
      expect(view.result.current.lists?.[0]?.titles.map((entry) => entry.title)).toEqual(['The Matrix']);
    });
  });
});
