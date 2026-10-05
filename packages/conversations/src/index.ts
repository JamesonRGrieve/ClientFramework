// SPDX-License-Identifier: AGPL-3.0-or-later
// The client half of the server's conversations extension (zephyrex[conversations]): direct messages
// and group chats between users, their threaded messages and who is in them. Every change to a
// conversation, a message or a seat is held to the version the user saw.
export { conversationsExtension } from './extension';
export { ConversationPage } from './ConversationPage';
export { ConversationsPage } from './ConversationsPage';
export { CONVERSATIONS_PATH, conversationPagePath } from './routes';
export {
  addParticipant,
  CONVERSATION_ENDPOINT,
  ConversationSchema,
  createGroupChat,
  MESSAGE_ENDPOINT,
  MessageSchema,
  openDirectMessage,
  PARTICIPANT_ENDPOINT,
  ParticipantSchema,
  sendMessage,
  useConversation,
  useConversationActions,
  useConversations,
  useMessageActions,
  useMessages,
  useParticipantActions,
  useParticipants,
} from './conversationsApi';
export type { Conversation, ConversationActions, Message, MessageActions, Participant } from './conversationsApi';
