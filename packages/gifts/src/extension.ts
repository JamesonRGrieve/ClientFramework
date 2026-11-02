// SPDX-License-Identifier: AGPL-3.0-or-later
import { createElement, type ReactElement } from 'react';
import type { ZephyrexClientExtension } from 'zephyrex';
import { giftsExtension as registered } from 'zephyrex/extensions';
import { GiftsPage } from './GiftsPage';
import { GIFTS_PATH } from './routes';

/** The gift list as the extension mounts it: an app that knows people mounts its own, passing them and ideas. */
export function GiftsRoute(): ReactElement {
  return createElement(GiftsPage);
}

/** The gifts client extension with its page and menu entry, for an app's `extensions`. */
export const giftsExtension: ZephyrexClientExtension = {
  ...registered,
  pages: [{ path: GIFTS_PATH, component: GiftsRoute }],
  navItems: [{ title: 'Gifts', url: GIFTS_PATH }],
};
