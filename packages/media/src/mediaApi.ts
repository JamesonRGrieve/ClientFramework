// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { useCallback } from 'react';
import useSWR, { type SWRResponse, useSWRConfig } from 'swr';
import { useClient } from 'zephyrex';
import { z } from 'zod';
import {
  type MediaItem,
  MediaItemSchema,
  PickSchema,
  type TonightPick,
  type WatchList,
  WatchListSchema,
} from './mediaModel';

export const WATCH_LISTS_ENDPOINT = '/v1/watch-lists';
const MINE = `${WATCH_LISTS_ENDPOINT}/mine`;
const SEARCH = `${WATCH_LISTS_ENDPOINT}/search`;
const listPath = (listId: string): string => `${WATCH_LISTS_ENDPOINT}/${encodeURIComponent(listId)}`;
const titlePath = (titleId: string): string => `${WATCH_LISTS_ENDPOINT}/titles/${encodeURIComponent(titleId)}`;

/** The lists the signed-in user keeps or is on. */
export function useWatchLists(): SWRResponse<WatchList[], Error> {
  const client = useClient();
  return useSWR<WatchList[], Error>(
    client.url(MINE),
    async () => z.object({ lists: z.array(WatchListSchema) }).parse(await client.get(MINE)).lists,
  );
}

/** Films in the catalogue matching `query`; nothing until there is one. */
export function useMediaSearch(query: string | null): SWRResponse<MediaItem[], Error> {
  const client = useClient();
  const params = query === null || query.trim() === '' ? null : { q: query.trim(), kind: 'movie' };
  return useSWR<MediaItem[], Error>(
    params === null ? null : client.url(SEARCH, params),
    async () => z.object({ results: z.array(MediaItemSchema) }).parse(await client.get(SEARCH, params ?? {})).results,
  );
}

/** Tonight's pick from the list. */
export function usePick(listId: string): SWRResponse<TonightPick, Error> {
  const client = useClient();
  const path = `${listPath(listId)}/pick`;
  return useSWR<TonightPick, Error>(client.url(path), async () => PickSchema.parse(await client.get(path)));
}

export interface WatchListActions {
  /** Starts a list the user keeps; resolves to its id. */
  start: (name: string) => Promise<string>;
  share: (list: WatchList, userId: string) => Promise<void>;
  /** The keeper takes someone off, or a member leaves (their own id). */
  unshare: (list: WatchList, userId: string) => Promise<void>;
  add: (list: WatchList, mediaId: string) => Promise<void>;
  want: (list: WatchList, titleId: string, want: boolean) => Promise<void>;
  watched: (list: WatchList, titleId: string, watched: boolean) => Promise<void>;
  remove: (list: WatchList, titleId: string) => Promise<void>;
}

/** The writes to the user's watch-lists, each refreshing the lists and the list's pick. */
export function useWatchListActions(): WatchListActions {
  const client = useClient();
  const { mutate } = useSWRConfig();
  const refresh = useCallback(
    async (listId: string | null): Promise<void> => {
      await Promise.all([
        mutate(client.url(MINE)),
        ...(listId === null ? [] : [mutate(client.url(`${listPath(listId)}/pick`))]),
      ]);
    },
    [client, mutate],
  );
  const start = useCallback(
    async (name: string): Promise<string> => {
      const made = WatchListSchema.parse(await client.post(WATCH_LISTS_ENDPOINT, { name }));
      await refresh(null);
      return made.id;
    },
    [client, refresh],
  );
  const share = useCallback(
    async (list: WatchList, userId: string): Promise<void> => {
      await client.post(`${listPath(list.id)}/members`, { user_id: userId });
      await refresh(list.id);
    },
    [client, refresh],
  );
  const unshare = useCallback(
    async (list: WatchList, userId: string): Promise<void> => {
      await client.post(`${listPath(list.id)}/members/${encodeURIComponent(userId)}/remove`, {});
      await refresh(list.id);
    },
    [client, refresh],
  );
  const add = useCallback(
    async (list: WatchList, mediaId: string): Promise<void> => {
      await client.post(`${listPath(list.id)}/titles`, { media_id: mediaId });
      await refresh(list.id);
    },
    [client, refresh],
  );
  const want = useCallback(
    async (list: WatchList, titleId: string, wants: boolean): Promise<void> => {
      await client.post(`${titlePath(titleId)}/want`, { want: wants });
      await refresh(list.id);
    },
    [client, refresh],
  );
  const watched = useCallback(
    async (list: WatchList, titleId: string, seen: boolean): Promise<void> => {
      await client.post(`${titlePath(titleId)}/watched`, { watched: seen });
      await refresh(list.id);
    },
    [client, refresh],
  );
  const remove = useCallback(
    async (list: WatchList, titleId: string): Promise<void> => {
      await client.post(`${titlePath(titleId)}/remove`, {});
      await refresh(list.id);
    },
    [client, refresh],
  );
  return { start, share, unshare, add, want, watched, remove };
}
