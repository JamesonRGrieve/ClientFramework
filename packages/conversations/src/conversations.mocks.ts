// SPDX-License-Identifier: AGPL-3.0-or-later
// An in-memory conversations server for the package's tests and stories (never compiled into dist):
// the server's routes and access rules (the owner deletes and removes; a participant posts, edits
// their own and leaves), each change held to the row's version, and the user's teammates.
import { http, HttpResponse, type RequestHandler } from 'msw';
import type { Person } from 'zephyrex/pages/team';
import { refuseStale, versionStamp } from 'zephyrex/testing/msw';
import { z } from 'zod';
import {
  type Conversation,
  CONVERSATION_ENDPOINT,
  ConversationSchema,
  DIRECT_ENDPOINT,
  type Message,
  MESSAGE_ENDPOINT,
  MessageSchema,
  type Participant,
  PARTICIPANT_ENDPOINT,
} from './conversationsApi';

const HTTP_CREATED = 201;
const HTTP_NO_CONTENT = 204;
const HTTP_BAD_REQUEST = 400;
const HTTP_FORBIDDEN = 403;
const HTTP_NOT_FOUND = 404;

/** When the fixture's rows were recorded: their version until a test or story changes one. */
export const FIXTURE_VERSION = '2026-10-01T09:00:00.000001';

/** The signed-in user. */
export const ME: Person = { id: 'u-me', email: 'me@example.com', display_name: 'Grace', first_name: null, last_name: null };
/** Teammates of the user: people they can see, message and add. */
export const ADA: Person = {
  id: 'u-ada',
  email: 'ada@example.com',
  display_name: null,
  first_name: 'Ada',
  last_name: 'Lovelace',
};
export const CHARLES: Person = {
  id: 'u-charles',
  email: 'charles@example.com',
  display_name: 'Babbage',
  first_name: null,
  last_name: null,
};
/** Someone in a conversation the user is in, but in no team of theirs: the server won't show who they are. */
export const STRANGER_ID = 'u-stranger';

const TEAM_ID = 'team-1';

/** The fixture's conversations. */
export const PLANS_ID = 'plans';
export const DIRECT_ID = 'dm-charles';
export const ELSEWHERE_ID = 'elsewhere';

/** `rows`, each created a minute after the one before it: the order they were made in. */
const inOrder = <T extends { created_at?: string | null | undefined }>(rows: readonly T[]): T[] =>
  rows.map((row, index) => ({ ...row, created_at: `2026-10-01T09:${String(index + 1).padStart(2, '0')}:00.000001` }));

const conversation = (id: string, name: string, owner: string, groupChat: boolean): Conversation => ({
  id,
  name,
  description: null,
  is_group_chat: groupChat,
  user_id: owner,
  team_id: null,
  created_at: FIXTURE_VERSION,
  updated_at: null,
});

const seat = (conversationId: string, userId: string): Participant => ({
  id: `${conversationId}:${userId}`,
  conversation_id: conversationId,
  user_id: userId,
  created_at: FIXTURE_VERSION,
  updated_at: null,
});

const message = (id: string, conversationId: string, userId: string | null, content: string): Message => ({
  id,
  conversation_id: conversationId,
  parent_id: null,
  content,
  user_id: userId,
  edited_at: null,
  created_at: FIXTURE_VERSION,
  updated_at: null,
});

/**
 * The user's group chat with Ada and someone they can't see (with a reply and an agent's message),
 * a direct conversation Charles opened with them, and a chat of Charles's they aren't in.
 */
export function conversationsFixture(): { conversations: Conversation[]; participants: Participant[]; messages: Message[] } {
  return {
    conversations: inOrder([
      conversation(PLANS_ID, 'Engine plans', ME.id, true),
      conversation(DIRECT_ID, 'Direct Message', CHARLES.id, false),
      conversation(ELSEWHERE_ID, 'Not ours', CHARLES.id, true),
    ]),
    participants: [
      seat(PLANS_ID, ME.id),
      seat(PLANS_ID, ADA.id),
      seat(PLANS_ID, STRANGER_ID),
      seat(DIRECT_ID, CHARLES.id),
      seat(DIRECT_ID, ME.id),
      seat(ELSEWHERE_ID, CHARLES.id),
    ],
    messages: inOrder([
      message('m1', PLANS_ID, ADA.id, 'The cards are punched.'),
      { ...message('m2', PLANS_ID, ME.id, 'Then we run it.'), parent_id: 'm1' },
      message('m3', PLANS_ID, null, 'Summary: the engine runs tomorrow.'),
      message('m4', PLANS_ID, STRANGER_ID, 'Count me in.'),
      message('m5', DIRECT_ID, CHARLES.id, 'Lunch?'),
    ]),
  };
}

export type ConversationStore = ReturnType<typeof conversationsFixture>;

/** The row `id` of `rows`; a test or story naming one that isn't there is a mistake in it. */
export function rowOf<T extends { id: string }>(rows: readonly T[], id: string): T {
  const found = rows.find((row) => row.id === id);
  if (found === undefined) {
    throw new Error(`No row ${id} in the fixture`);
  }
  return found;
}

/** The user `userId`, when the signed-in user can see them (they share a team); a stranger is null. */
const visible = (userId: string): Person | null => [ME, ADA, CHARLES].find(({ id }) => id === userId) ?? null;

const ConversationBodySchema = z.object({ conversation: ConversationSchema.omit({ id: true }).partial() });
const MessageBodySchema = z.object({ message: MessageSchema.omit({ id: true }).partial() });
const ParticipantBodySchema = z.object({ user_id: z.string() });
const DirectBodySchema = z.object({ other_user_id: z.string(), initial_message: z.string().nullable().optional() });

/** The fields a partial body actually sets, without the ones it leaves undefined. */
const defined = (fields: object): Record<string, unknown> =>
  Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined));

const refuse = (status: number, detail: string): Response => HttpResponse.json({ detail }, { status });
const notFound = (): Response => refuse(HTTP_NOT_FOUND, 'Not found');

/**
 * The conversation routes over `store`, as the signed-in user sees them, each change held to the
 * row's version as the server does; with the user, their team and its members.
 */
export function conversationHandlers(store: ConversationStore = conversationsFixture()): RequestHandler[] {
  let created = 0;
  const nextId = (prefix: string): string => `${prefix}-${String(++created)}`;
  const seated = (conversationId: string, userId: string = ME.id): boolean =>
    store.participants.some((row) => row.conversation_id === conversationId && row.user_id === userId);
  const mine = (id: string | readonly string[] | undefined): Conversation | undefined =>
    store.conversations.find((row) => row.id === id && seated(row.id));
  const withUser = <T extends { user_id?: string | null | undefined }>(row: T): T & { user: Person | null } => ({
    ...row,
    user: row.user_id === null || row.user_id === undefined ? null : visible(row.user_id),
  });
  const seatIn = (conversationId: string, userId: string): Participant => {
    const existing = store.participants.find((row) => row.conversation_id === conversationId && row.user_id === userId);
    if (existing !== undefined) {
      return existing;
    }
    const added = { ...seat(conversationId, userId), created_at: versionStamp() };
    store.participants.push(added);
    return added;
  };
  const post = (conversationId: string, content: string, parentId: string | null): Message => {
    const row = {
      ...message(nextId('message'), conversationId, ME.id, content),
      parent_id: parentId,
      created_at: versionStamp(),
    };
    store.messages.push(row);
    return row;
  };

  return [
    http.get('*/v1/user', () => HttpResponse.json({ user: { ...ME, email: ME.email ?? '' } })),
    http.get('*/v1/team', () => HttpResponse.json({ teams: [{ id: TEAM_ID, name: 'Engine team' }] })),
    http.get(`*/v1/team/${TEAM_ID}/user`, () =>
      HttpResponse.json({
        user_teams: [ME, ADA, CHARLES].map((person) => ({
          id: `${TEAM_ID}:${person.id}`,
          user_id: person.id,
          team_id: TEAM_ID,
          role_id: 'r-user',
          user: person,
          role: { id: 'r-user', name: 'user' },
        })),
      }),
    ),

    http.get(`*${PARTICIPANT_ENDPOINT}`, ({ request }) => {
      const conversationId = new URL(request.url).searchParams.get('conversation_id');
      return HttpResponse.json({
        conversation_users: store.participants
          .filter(
            (row) => seated(row.conversation_id) && (conversationId === null || row.conversation_id === conversationId),
          )
          .map(withUser),
      });
    }),
    http.post(`*${DIRECT_ENDPOINT}`, async ({ request }) => {
      const { other_user_id: other, initial_message: first } = DirectBodySchema.parse(await request.json());
      if (other === ME.id) {
        return refuse(HTTP_BAD_REQUEST, 'A direct message needs another user');
      }
      if (visible(other) === null) {
        return refuse(HTTP_NOT_FOUND, 'User not found');
      }
      let found = store.conversations.find(
        (row) =>
          !row.is_group_chat &&
          new Set(
            store.participants.filter((seatRow) => seatRow.conversation_id === row.id).map(({ user_id: id }) => id),
          ).symmetricDifference(new Set([ME.id, other])).size === 0,
      );
      if (found === undefined) {
        found = { ...conversation(nextId('conversation'), 'Direct Message', ME.id, false), created_at: versionStamp() };
        store.conversations.push(found);
        seatIn(found.id, ME.id);
        seatIn(found.id, other);
      }
      const posted = first === null || first === undefined || first === '' ? null : post(found.id, first, null);
      return HttpResponse.json({ conversation: found, message: posted });
    }),
    http.get(`*${CONVERSATION_ENDPOINT}`, () =>
      HttpResponse.json({ conversations: store.conversations.filter((row) => seated(row.id)) }),
    ),
    http.get(`*${CONVERSATION_ENDPOINT}/:id`, ({ params: { id } }) => {
      const found = mine(id);
      return found === undefined ? notFound() : HttpResponse.json({ conversation: found });
    }),
    http.post(`*${CONVERSATION_ENDPOINT}`, async ({ request }) => {
      const { conversation: fields } = ConversationBodySchema.parse(await request.json());
      const row = ConversationSchema.parse({
        ...conversation(nextId('conversation'), '', ME.id, false),
        ...defined(fields),
        user_id: ME.id,
        created_at: versionStamp(),
      });
      store.conversations.push(row);
      seatIn(row.id, ME.id);
      return HttpResponse.json({ conversation: row }, { status: HTTP_CREATED });
    }),
    http.put(`*${CONVERSATION_ENDPOINT}/:id`, async ({ params: { id }, request }) => {
      const current = mine(id);
      if (current === undefined) {
        return notFound();
      }
      const refused = refuseStale(request, current);
      if (refused !== null) {
        return refused;
      }
      const { conversation: fields } = ConversationBodySchema.parse(await request.json());
      const updated = ConversationSchema.parse({ ...current, ...defined(fields), updated_at: versionStamp() });
      store.conversations = store.conversations.map((row) => (row.id === current.id ? updated : row));
      return HttpResponse.json({ conversation: updated });
    }),
    http.delete(`*${CONVERSATION_ENDPOINT}/:id`, ({ params: { id }, request }) => {
      const current = mine(id);
      if (current === undefined) {
        return notFound();
      }
      const refused = refuseStale(request, current);
      if (refused !== null) {
        return refused;
      }
      if (current.user_id !== ME.id) {
        return refuse(HTTP_FORBIDDEN, 'Only the owner deletes a conversation');
      }
      store.conversations = store.conversations.filter((row) => row.id !== current.id);
      store.participants = store.participants.filter((row) => row.conversation_id !== current.id);
      store.messages = store.messages.filter((row) => row.conversation_id !== current.id);
      return new HttpResponse(null, { status: HTTP_NO_CONTENT });
    }),
    http.post(`*${CONVERSATION_ENDPOINT}/:id/participants`, async ({ params: { id }, request }) => {
      const current = mine(id);
      const { user_id: userId } = ParticipantBodySchema.parse(await request.json());
      if (current === undefined || visible(userId) === null) {
        return notFound();
      }
      return HttpResponse.json(seatIn(current.id, userId));
    }),
    http.delete(`*${CONVERSATION_ENDPOINT}/:id/participants/:userId`, ({ params: { id, userId }, request }) => {
      const current = mine(id);
      const membership = store.participants.find((row) => row.conversation_id === id && row.user_id === userId);
      if (current === undefined || membership === undefined) {
        return notFound();
      }
      const refused = refuseStale(request, membership);
      if (refused !== null) {
        return refused;
      }
      if (current.user_id !== ME.id && userId !== ME.id) {
        return refuse(HTTP_FORBIDDEN, 'Only the owner removes others from a conversation');
      }
      if (userId === current.user_id) {
        return refuse(HTTP_BAD_REQUEST, 'The owner cannot leave their conversation');
      }
      store.participants = store.participants.filter((row) => row !== membership);
      return HttpResponse.json({ conversation_id: id, user_id: userId });
    }),

    http.get(`*${MESSAGE_ENDPOINT}`, ({ request }) => {
      const conversationId = new URL(request.url).searchParams.get('conversation_id');
      return HttpResponse.json({
        messages: store.messages
          .filter(
            (row) => seated(row.conversation_id) && (conversationId === null || row.conversation_id === conversationId),
          )
          .map(withUser),
      });
    }),
    http.post(`*${MESSAGE_ENDPOINT}`, async ({ request }) => {
      const { message: fields } = MessageBodySchema.parse(await request.json());
      if (mine(fields.conversation_id) === undefined) {
        return notFound();
      }
      const row = post(fields.conversation_id ?? '', fields.content ?? '', fields.parent_id ?? null);
      return HttpResponse.json({ message: row }, { status: HTTP_CREATED });
    }),
    http.put(`*${MESSAGE_ENDPOINT}/:id`, async ({ params: { id }, request }) => {
      const current = store.messages.find((row) => row.id === id && seated(row.conversation_id));
      if (current === undefined) {
        return notFound();
      }
      const refused = refuseStale(request, current);
      if (refused !== null) {
        return refused;
      }
      if (current.user_id !== ME.id) {
        return refuse(HTTP_FORBIDDEN, 'Only the author edits a message');
      }
      const { message: fields } = MessageBodySchema.parse(await request.json());
      const stamp = versionStamp();
      const updated = { ...current, content: fields.content ?? current.content, edited_at: stamp, updated_at: stamp };
      store.messages = store.messages.map((row) => (row.id === current.id ? updated : row));
      return HttpResponse.json({ message: updated });
    }),
    http.delete(`*${MESSAGE_ENDPOINT}/:id`, ({ params: { id }, request }) => {
      const current = store.messages.find((row) => row.id === id && seated(row.conversation_id));
      if (current === undefined) {
        return notFound();
      }
      const refused = refuseStale(request, current);
      if (refused !== null) {
        return refused;
      }
      if (current.user_id !== ME.id && mine(current.conversation_id)?.user_id !== ME.id) {
        return refuse(HTTP_FORBIDDEN, "Only the author or the conversation's owner deletes a message");
      }
      store.messages = store.messages.filter((row) => row.id !== current.id);
      return new HttpResponse(null, { status: HTTP_NO_CONTENT });
    }),
  ];
}
