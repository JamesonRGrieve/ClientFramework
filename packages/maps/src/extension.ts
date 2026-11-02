// SPDX-License-Identifier: AGPL-3.0-or-later
import { createElement, type ReactElement } from 'react';
import type { ZephyrexClientExtension } from 'zephyrex';
import { mapsExtension as registered } from 'zephyrex/extensions';
import { MeetInTheMiddle } from './MeetInTheMiddle';
import { MEET_PATH } from './routes';

/** Meeting in the middle as the extension mounts it, from typed places: an app that knows places mounts its own, passing them. */
export function MeetRoute(): ReactElement {
  return createElement(MeetInTheMiddle);
}

/** The maps client extension with its page and menu entry, for an app's `extensions`: meeting in the middle. */
export const mapsExtension: ZephyrexClientExtension = {
  ...registered,
  pages: [{ path: MEET_PATH, component: MeetRoute }],
  navItems: [{ title: 'Meet in the middle', url: MEET_PATH }],
};
