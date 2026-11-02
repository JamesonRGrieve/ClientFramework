// SPDX-License-Identifier: AGPL-3.0-or-later
import { createElement, type ReactElement } from 'react';
import type { ZephyrexClientExtension } from 'zephyrex';
import { calendarExtension as registered } from 'zephyrex/extensions';
import { AvailabilityPage } from './AvailabilityPage';
import { AVAILABILITY_PATH } from './routes';

/** Shared availability as the extension mounts it: an app that knows people mounts its own, passing them. */
export function AvailabilityRoute(): ReactElement {
  return createElement(AvailabilityPage);
}

/** The calendar client extension with its page and menu entry, for an app's `extensions`. */
export const calendarExtension: ZephyrexClientExtension = {
  ...registered,
  pages: [{ path: AVAILABILITY_PATH, component: AvailabilityRoute }],
  navItems: [{ title: 'Shared availability', url: AVAILABILITY_PATH }],
};
