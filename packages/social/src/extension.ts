// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from 'zephyrex';
import { socialExtension as registered } from 'zephyrex/extensions';
import { PublicationPage } from './PublicationPage';
import { PublicationsPage } from './PublicationsPage';
import { SOCIAL_PATH } from './routes';

/**
 * The social client extension with its pages and menu entry, for an app's `extensions`: the posts
 * the server published to the user's social accounts. The accounts themselves are provider
 * instances, set up on the provider pages.
 */
export const socialExtension: ZephyrexClientExtension = {
  ...registered,
  pages: [
    { path: SOCIAL_PATH, component: PublicationsPage },
    { path: `${SOCIAL_PATH}/:publicationId`, component: PublicationPage },
  ],
  navItems: [{ title: 'Social Posts', url: SOCIAL_PATH }],
};
