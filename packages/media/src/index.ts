// SPDX-License-Identifier: AGPL-3.0-or-later
// The client half of the server's media extension (zephyrex[media]): shared watch-lists from the
// film catalogue, and tonight's pick.
export { mediaExtension } from './extension';
export { useMediaSearch, usePick, useWatchListActions, useWatchLists, WATCH_LISTS_ENDPOINT } from './mediaApi';
export type { WatchListActions } from './mediaApi';
export { everyoneOn, MediaItemSchema, PickSchema, titleLabel, TitleSchema, WatchListSchema } from './mediaModel';
export type { MediaItem, MediaPerson, Title, TonightPick, WatchList } from './mediaModel';
export { WATCH_LIST_PATH } from './routes';
export { WatchListPage } from './WatchListPage';
export type { WatchListPageProps } from './WatchListPage';
