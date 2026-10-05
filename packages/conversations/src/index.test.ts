// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import * as published from './index';

describe('@zephyrex/conversations', () => {
  it('publishes the pages, the reads and writes behind them, and the extension that mounts them', () => {
    expect(Object.keys(published).sort()).toEqual(
      [
        'CONVERSATIONS_PATH',
        'CONVERSATION_ENDPOINT',
        'ConversationPage',
        'ConversationSchema',
        'ConversationsPage',
        'MESSAGE_ENDPOINT',
        'MessageSchema',
        'PARTICIPANT_ENDPOINT',
        'ParticipantSchema',
        'addParticipant',
        'conversationPagePath',
        'conversationsExtension',
        'createGroupChat',
        'openDirectMessage',
        'sendMessage',
        'useConversation',
        'useConversationActions',
        'useConversations',
        'useMessageActions',
        'useMessages',
        'useParticipantActions',
        'useParticipants',
      ].sort(),
    );
  });
});
