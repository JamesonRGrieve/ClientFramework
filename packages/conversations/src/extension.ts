// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ZephyrexClientExtension } from 'zephyrex';
import { conversationsExtension as registered } from 'zephyrex/extensions';
import { ConversationPage } from './ConversationPage';
import { ConversationsPage } from './ConversationsPage';
import { CONVERSATIONS_PATH } from './routes';

/** The conversations client extension with its pages and menu entry, for an app's `extensions`. */
export const conversationsExtension: ZephyrexClientExtension = {
  ...registered,
  pages: [
    { path: CONVERSATIONS_PATH, component: ConversationsPage },
    { path: `${CONVERSATIONS_PATH}/:conversationId`, component: ConversationPage },
  ],
  navItems: [{ title: 'Conversations', url: CONVERSATIONS_PATH }],
};
