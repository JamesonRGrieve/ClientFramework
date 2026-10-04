// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from 'zephyrex';
import { healthExtension as registered } from 'zephyrex/extensions';
import { HealthPage } from './HealthPage';
import { RecordsPage } from './RecordsPage';
import { HEALTH_PATH } from './routes';

/** The health client extension with its pages and menu entry, for an app's `extensions`: the user's health log. */
export const healthExtension: ZephyrexClientExtension = {
  ...registered,
  pages: [
    { path: HEALTH_PATH, component: HealthPage },
    { path: `${HEALTH_PATH}/:kind`, component: RecordsPage },
  ],
  navItems: [{ title: 'Health', url: HEALTH_PATH }],
};
