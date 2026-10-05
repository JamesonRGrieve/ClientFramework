// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { conversationsExtension as registered } from 'zephyrex/extensions';
import { ConversationPage } from './ConversationPage';
import { ConversationsPage } from './ConversationsPage';
import { conversationsExtension } from './extension';

describe('conversationsExtension', () => {
  it('is the registered conversations extension, with its pages and a menu entry', () => {
    expect(conversationsExtension).toMatchObject({ name: 'conversations', serverExtension: 'conversations' });
    expect(conversationsExtension.displayName).toBe(registered.displayName);
    expect(conversationsExtension.pages).toEqual([
      { path: '/conversations', component: ConversationsPage },
      { path: '/conversations/:conversationId', component: ConversationPage },
    ]);
    expect(conversationsExtension.navItems).toEqual([{ title: 'Conversations', url: '/conversations' }]);
  });
});
