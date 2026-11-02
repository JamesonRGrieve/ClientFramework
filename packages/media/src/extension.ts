// SPDX-License-Identifier: AGPL-3.0-or-later
import { createElement, type ReactElement } from 'react';
import type { ZephyrexClientExtension } from 'zephyrex';
import { mediaExtension as registered } from 'zephyrex/extensions';
import { WATCH_LIST_PATH } from './routes';
import { WatchListPage } from './WatchListPage';

/** The watch-list as the extension mounts it: an app that knows people mounts its own, passing them. */
export function WatchListRoute(): ReactElement {
  return createElement(WatchListPage);
}

/** The media client extension with its page and menu entry, for an app's `extensions`: the watch-list. */
export const mediaExtension: ZephyrexClientExtension = {
  ...registered,
  pages: [{ path: WATCH_LIST_PATH, component: WatchListRoute }],
  navItems: [{ title: 'Watch-list', url: WATCH_LIST_PATH }],
};
