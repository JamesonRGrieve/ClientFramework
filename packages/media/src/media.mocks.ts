// SPDX-License-Identifier: AGPL-3.0-or-later
// An in-memory /v1/watch-lists for the package's tests and stories (never compiled into dist): the
// server's rules (the keeper shares a list, everyone on it adds titles and wants them, strangers see
// nothing) and its pick (what everyone wants, else what most want; the first among equals here).
import { http, HttpResponse, type RequestHandler } from 'msw';
import { z } from 'zod';
import type { MediaItem, Title, TonightPick, WatchList } from './mediaModel';

const HTTP_NOT_FOUND = 404;
const HTTP_FORBIDDEN = 403;
const HTTP_CONFLICT = 409;
const HTTP_UNPROCESSABLE = 422;

export const ME = 'u-me';
export const ALEX = 'u-alex';
export const SAM = 'u-sam';

const MATRIX: MediaItem = {
  id: 'tmdb:movie:603',
  title: 'The Matrix',
  kind: 'movie',
  year: 1999,
  overview: 'A hacker learns what the world is.',
  image: null,
};
const GUMP: MediaItem = {
  id: 'tmdb:movie:13',
  title: 'Forrest Gump',
  kind: 'movie',
  year: 1994,
  overview: 'Life is like a box of chocolates.',
  image: null,
};
const FELLOWSHIP: MediaItem = {
  id: 'tmdb:movie:120',
  title: 'The Fellowship of the Ring',
  kind: 'movie',
  year: 2001,
  image: null,
};

const CATALOGUE: MediaItem[] = [MATRIX, GUMP, FELLOWSHIP];

/** What the mock server holds: who is asking, and the lists. */
export interface MediaStore {
  me: string;
  lists: WatchList[];
}

const title = (titleId: string, item: MediaItem, wantedBy: string[], addedBy: string): Title => ({
  ...item,
  title_id: titleId,
  added_by: addedBy,
  watched_on: null,
  wanted_by: wantedBy,
});

/** You keep "Movie night", shared with Alex: The Matrix everyone wants, Forrest Gump only Alex. */
export function mediaFixture(): MediaStore {
  return {
    me: ME,
    lists: [
      {
        id: 'l1',
        name: 'Movie night',
        keeper_id: ME,
        member_ids: [ALEX],
        titles: [title('t1', MATRIX, [ME, ALEX], ME), title('t2', GUMP, [ALEX], ALEX)],
      },
    ],
  };
}

export function emptyMediaStore(): MediaStore {
  return { me: ME, lists: [] };
}

/** The pick the server makes from `list`, its first among equals standing in for the day's. */
export function pickOf(list: WatchList): TonightPick {
  const people = 1 + list.member_ids.length;
  const unwatched = list.titles.filter((entry) => (entry.watched_on ?? null) === null && entry.wanted_by.length > 0);
  if (unwatched.length === 0) {
    return { title: null, everyone: false, wanted_by: 0, of: people };
  }
  const most = Math.max(...unwatched.map((entry) => entry.wanted_by.length));
  const best = unwatched
    .filter((entry) => entry.wanted_by.length === most)
    .sort((a, b) => a.title_id.localeCompare(b.title_id));
  return { title: best[0] ?? null, everyone: most >= people, wanted_by: most, of: people };
}

const refuse = (status: number, detail: string): Response => HttpResponse.json({ detail }, { status });
const LIST_NOT_FOUND = 'Watch-list not found';
const TITLE_NOT_FOUND = 'Title not found';
const KEEPER_ONLY = 'Only the list’s keeper changes who is on it';
/** A route parameter, as msw hands it over. */
type Param = string | readonly string[] | undefined;

export function mediaHandlers(store: MediaStore = mediaFixture()): RequestHandler[] {
  let made = 0;
  const on = (list: WatchList): boolean => list.keeper_id === store.me || list.member_ids.includes(store.me);
  const visible = (listId: Param): WatchList | undefined => store.lists.find((list) => list.id === listId && on(list));
  const titleOf = (titleId: Param): { list: WatchList; entry: Title } | undefined => {
    for (const list of store.lists.filter(on)) {
      const entry = list.titles.find((candidate) => candidate.title_id === titleId);
      if (entry !== undefined) {
        return { list, entry };
      }
    }
    return undefined;
  };
  return [
    http.get('*/v1/user', () => HttpResponse.json({ user: { id: store.me, email: 'me@example.com' } })),
    http.get('*/v1/watch-lists/mine', () => HttpResponse.json({ lists: store.lists.filter(on) })),
    http.get('*/v1/watch-lists/search', ({ request }) => {
      const query = (new URL(request.url).searchParams.get('q') ?? '').toLowerCase();
      return HttpResponse.json({ results: CATALOGUE.filter((item) => item.title.toLowerCase().includes(query)) });
    }),
    http.get('*/v1/watch-lists/:listId/pick', ({ params: { listId } }) => {
      const list = visible(listId);
      return list === undefined ? refuse(HTTP_NOT_FOUND, LIST_NOT_FOUND) : HttpResponse.json(pickOf(list));
    }),
    http.post('*/v1/watch-lists', async ({ request }) => {
      const { name } = z.object({ name: z.string() }).parse(await request.json());
      const list: WatchList = { id: `list-${String(++made)}`, name, keeper_id: store.me, member_ids: [], titles: [] };
      store.lists.push(list);
      return HttpResponse.json(list);
    }),
    http.post('*/v1/watch-lists/:listId/members', async ({ params: { listId }, request }) => {
      const list = visible(listId);
      if (list === undefined) {
        return refuse(HTTP_NOT_FOUND, LIST_NOT_FOUND);
      }
      if (list.keeper_id !== store.me) {
        return refuse(HTTP_FORBIDDEN, KEEPER_ONLY);
      }
      const { user_id: userId } = z.object({ user_id: z.string() }).parse(await request.json());
      list.member_ids.push(userId);
      return HttpResponse.json(list);
    }),
    http.post('*/v1/watch-lists/:listId/members/:userId/remove', ({ params: { listId, userId } }) => {
      const list = visible(listId);
      if (list === undefined) {
        return refuse(HTTP_NOT_FOUND, LIST_NOT_FOUND);
      }
      if (store.me !== list.keeper_id && store.me !== userId) {
        return refuse(HTTP_FORBIDDEN, KEEPER_ONLY);
      }
      list.member_ids = list.member_ids.filter((member) => member !== userId);
      return HttpResponse.json(list);
    }),
    http.post('*/v1/watch-lists/:listId/titles', async ({ params: { listId }, request }) => {
      const list = visible(listId);
      if (list === undefined) {
        return refuse(HTTP_NOT_FOUND, LIST_NOT_FOUND);
      }
      const { media_id: mediaId } = z.object({ media_id: z.string() }).parse(await request.json());
      if (list.titles.some((onList) => onList.id === mediaId)) {
        return refuse(HTTP_CONFLICT, 'That title is already on the list');
      }
      const item = CATALOGUE.find((candidate) => candidate.id === mediaId);
      if (item === undefined) {
        return refuse(HTTP_UNPROCESSABLE, 'Not in the catalogue');
      }
      const entry = title(`title-${String(++made)}`, item, [store.me], store.me);
      list.titles.push(entry);
      return HttpResponse.json(entry);
    }),
    http.post('*/v1/watch-lists/titles/:titleId/want', async ({ params: { titleId }, request }) => {
      const found = titleOf(titleId);
      if (found === undefined) {
        return refuse(HTTP_NOT_FOUND, TITLE_NOT_FOUND);
      }
      const { want } = z.object({ want: z.boolean() }).parse(await request.json());
      const others = found.entry.wanted_by.filter((user) => user !== store.me);
      found.entry.wanted_by = want ? [...others, store.me] : others;
      return HttpResponse.json(found.entry);
    }),
    http.post('*/v1/watch-lists/titles/:titleId/watched', async ({ params: { titleId }, request }) => {
      const found = titleOf(titleId);
      if (found === undefined) {
        return refuse(HTTP_NOT_FOUND, TITLE_NOT_FOUND);
      }
      const { watched } = z.object({ watched: z.boolean() }).parse(await request.json());
      found.entry.watched_on = watched ? '2026-11-02' : null;
      return HttpResponse.json(found.entry);
    }),
    http.post('*/v1/watch-lists/titles/:titleId/remove', ({ params: { titleId } }) => {
      const found = titleOf(titleId);
      if (found === undefined) {
        return refuse(HTTP_NOT_FOUND, TITLE_NOT_FOUND);
      }
      if (store.me !== found.list.keeper_id && store.me !== found.entry.added_by) {
        return refuse(HTTP_FORBIDDEN, 'The keeper, or whoever added it, takes a title off');
      }
      found.list.titles = found.list.titles.filter((kept) => kept.title_id !== titleId);
      return HttpResponse.json(found.list);
    }),
  ];
}
