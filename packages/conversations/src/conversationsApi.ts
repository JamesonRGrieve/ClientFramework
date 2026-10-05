// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { useCallback } from 'react';
import useSWR, { type SWRResponse } from 'swr';
import { ApiError, type GuardedSave, serverInstant, useClient, useGuardedSave, type ZephyrexClient } from 'zephyrex';
import { PersonSchema } from 'zephyrex/pages/team';
import { z } from 'zod';

export const CONVERSATION_ENDPOINT = '/v1/conversation';
export const PARTICIPANT_ENDPOINT = '/v1/conversation/user';
export const MESSAGE_ENDPOINT = '/v1/message';
export const DIRECT_ENDPOINT = `${CONVERSATION_ENDPOINT}/direct`;

const HTTP_NOT_FOUND = 404;
/** How often an open conversation asks for new messages (the server pushes none). */
const MESSAGE_REFRESH_MS = 5000;
/** Who wrote a message, or is seated in a conversation: the user, as the requester may see them. */
const WITH_USER = { include: 'user' };

const optionalText = z.string().nullable().optional();
/** The user behind a row, when the requester may see them; null when they may not. */
const includedUser = PersonSchema.nullable().optional();

export const ConversationSchema = z.object({
  id: z.string(),
  name: optionalText,
  description: optionalText,
  is_group_chat: z.boolean(),
  /** The owner: the only one who deletes it or removes others. */
  user_id: optionalText,
  team_id: optionalText,
  // The row's version, sent back verbatim as If-Match on every change.
  created_at: optionalText,
  updated_at: optionalText,
});
export type Conversation = z.infer<typeof ConversationSchema>;

/** A seat in a conversation (a conversation_user row). Removing someone is guarded by this row's version. */
export const ParticipantSchema = z.object({
  id: z.string(),
  conversation_id: z.string(),
  user_id: z.string(),
  user: includedUser,
  created_at: optionalText,
  updated_at: optionalText,
});
export type Participant = z.infer<typeof ParticipantSchema>;

export const MessageSchema = z.object({
  id: z.string(),
  conversation_id: z.string(),
  /** The message this replies to. */
  parent_id: optionalText,
  content: z.string(),
  /** The author; none for an agent's message. */
  user_id: optionalText,
  user: includedUser,
  /** Set by the server when the author edits the text. */
  edited_at: optionalText,
  created_at: optionalText,
  updated_at: optionalText,
});
export type Message = z.infer<typeof MessageSchema>;

const ConversationEnvelopeSchema = z.object({ conversation: ConversationSchema });
const MessageEnvelopeSchema = z.object({ message: MessageSchema });

const segment = encodeURIComponent;
const conversationPath = (id: string): string => `${CONVERSATION_ENDPOINT}/${segment(id)}`;
const participantsPath = (conversationId: string): string => `${conversationPath(conversationId)}/participants`;
const messagePath = (id: string): string => `${MESSAGE_ENDPOINT}/${segment(id)}`;

/** Where a row with no timestamp sorts: before every other. */
const NO_TIME = '1970-01-01T00:00:00';
const millis = (at: string | null | undefined): number => serverInstant(at ?? NO_TIME).getTime();

/** A row's last change (its creation if never changed). */
const changedAt = ({ updated_at: updated, created_at: created }: Pick<Conversation, 'created_at' | 'updated_at'>): number =>
  millis(updated ?? created);

const sentAt = ({ created_at: created }: Pick<Message, 'created_at'>): number => millis(created);

/** Every conversation the user is in, the most recently changed first. */
export function useConversations(): SWRResponse<Conversation[], Error> {
  const client = useClient();
  return useSWR<Conversation[], Error>(client.url(CONVERSATION_ENDPOINT), async () =>
    (await client.list(CONVERSATION_ENDPOINT, 'conversations', ConversationSchema)).sort(
      (a, b) => changedAt(b) - changedAt(a),
    ),
  );
}

/** One conversation, or `null` when it doesn't exist or the user isn't in it (the server answers 404 for both). */
export function useConversation(id: string): SWRResponse<Conversation | null, Error> {
  const client = useClient();
  return useSWR<Conversation | null, Error>(client.url(conversationPath(id)), async () => {
    try {
      return ConversationEnvelopeSchema.parse(await client.get(conversationPath(id))).conversation;
    } catch (error) {
      if (error instanceof ApiError && error.status === HTTP_NOT_FOUND) {
        return null;
      }
      throw error;
    }
  });
}

/**
 * Who is in a conversation (or, with no id, in every conversation the user is in), each with their
 * user as the viewer may see them.
 */
export function useParticipants(conversationId?: string): SWRResponse<Participant[], Error> {
  const client = useClient();
  const params = conversationId === undefined ? WITH_USER : { conversation_id: conversationId, ...WITH_USER };
  return useSWR<Participant[], Error>(client.url(PARTICIPANT_ENDPOINT, params), async () =>
    client.list(PARTICIPANT_ENDPOINT, 'conversation_users', ParticipantSchema, params),
  );
}

/** A conversation's messages, oldest first, with their authors; asked again every few seconds. */
export function useMessages(conversationId: string): SWRResponse<Message[], Error> {
  const client = useClient();
  const params = { conversation_id: conversationId, ...WITH_USER };
  return useSWR<Message[], Error>(
    client.url(MESSAGE_ENDPOINT, params),
    async () =>
      (await client.list(MESSAGE_ENDPOINT, 'messages', MessageSchema, params)).sort((a, b) => sentAt(a) - sentAt(b)),
    { refreshInterval: MESSAGE_REFRESH_MS },
  );
}

/** Starts a group chat owned by the user; resolves to what the server stored. */
export async function createGroupChat(
  client: ZephyrexClient,
  chat: { name: string; description: string | null },
): Promise<Conversation> {
  return ConversationEnvelopeSchema.parse(
    await client.post(CONVERSATION_ENDPOINT, { conversation: { ...chat, is_group_chat: true } }),
  ).conversation;
}

/**
 * The direct conversation between the user and `otherUserId` (made if there is none), with
 * `firstMessage` posted into it when given. The other user must be one the user can see.
 */
export async function openDirectMessage(
  client: ZephyrexClient,
  otherUserId: string,
  firstMessage: string | null,
): Promise<Conversation> {
  return ConversationEnvelopeSchema.parse(
    await client.post(DIRECT_ENDPOINT, { other_user_id: otherUserId, initial_message: firstMessage }),
  ).conversation;
}

/** Posts a message as the user, replying to `parentId` when given; resolves to what the server stored. */
export async function sendMessage(
  client: ZephyrexClient,
  conversationId: string,
  content: string,
  parentId: string | null,
): Promise<Message> {
  return MessageEnvelopeSchema.parse(
    await client.post(MESSAGE_ENDPOINT, {
      message: { conversation_id: conversationId, content, ...(parentId === null ? {} : { parent_id: parentId }) },
    }),
  ).message;
}

/** Seats `userId` in a conversation (a no-op when they already are); they must be a user the requester can see. */
export async function addParticipant(client: ZephyrexClient, conversationId: string, userId: string): Promise<void> {
  await client.post(participantsPath(conversationId), { user_id: userId });
}

export interface ConversationActions {
  /** `update.save(conversation, changes)`: rename or redescribe it, guarded by it as loaded. */
  update: GuardedSave<Conversation>;
  /** `remove.save(conversation, {})`: delete it (its owner only), guarded by it as loaded. */
  remove: GuardedSave<Conversation>;
}

/** The writes to a conversation, each refreshing the conversations (and the conversation) shown. */
export function useConversationActions(id: string): ConversationActions {
  const client = useClient();
  const { mutate: refreshConversations } = useConversations();
  const { mutate: refreshConversation } = useConversation(id);
  const update = useCallback(
    async (seen: Conversation, changes: Partial<Conversation>): Promise<void> => {
      await client.put(conversationPath(seen.id), { conversation: changes }, seen);
      await Promise.all([refreshConversations(), refreshConversation()]);
    },
    [client, refreshConversations, refreshConversation],
  );
  const remove = useCallback(
    async (seen: Conversation): Promise<void> => {
      await client.delete(conversationPath(seen.id), seen);
      await refreshConversations();
    },
    [client, refreshConversations],
  );
  return { update: useGuardedSave(update, ConversationSchema), remove: useGuardedSave(remove, ConversationSchema) };
}

export interface MessageActions {
  /** `update.save(message, { content })`: edit your own message, guarded by it as loaded. */
  update: GuardedSave<Message>;
  /** `remove.save(message, {})`: delete your own message, or any as the owner, guarded by it as loaded. */
  remove: GuardedSave<Message>;
}

/** The writes to a conversation's messages, each refreshing them. */
export function useMessageActions(conversationId: string): MessageActions {
  const client = useClient();
  const { mutate: refreshMessages } = useMessages(conversationId);
  const update = useCallback(
    async (seen: Message, changes: Partial<Message>): Promise<void> => {
      await client.put(messagePath(seen.id), { message: { content: changes.content } }, seen);
      await refreshMessages();
    },
    [client, refreshMessages],
  );
  const remove = useCallback(
    async (seen: Message): Promise<void> => {
      await client.delete(messagePath(seen.id), seen);
      await refreshMessages();
    },
    [client, refreshMessages],
  );
  return { update: useGuardedSave(update, MessageSchema), remove: useGuardedSave(remove, MessageSchema) };
}

/**
 * Removing someone from a conversation, or leaving it from your own seat: `remove.save(seat, {})`.
 * The route names the conversation and the user, and is held to the seat's version.
 */
export function useParticipantActions(conversationId: string): { remove: GuardedSave<Participant> } {
  const client = useClient();
  const { mutate: refreshParticipants } = useParticipants(conversationId);
  const { mutate: refreshConversations } = useConversations();
  const remove = useCallback(
    async (seen: Participant): Promise<void> => {
      await client.delete(`${participantsPath(seen.conversation_id)}/${segment(seen.user_id)}`, seen);
      await Promise.all([refreshParticipants(), refreshConversations()]);
    },
    [client, refreshParticipants, refreshConversations],
  );
  return { remove: useGuardedSave(remove, ParticipantSchema) };
}
