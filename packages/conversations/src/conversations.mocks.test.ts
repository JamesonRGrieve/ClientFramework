// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { fetchFrom } from 'zephyrex/testing/msw';
import { z } from 'zod';
import {
  ADA,
  CHARLES,
  conversationHandlers,
  conversationsFixture,
  DIRECT_ID,
  ELSEWHERE_ID,
  FIXTURE_VERSION,
  ME,
  PLANS_ID,
  rowOf,
  STRANGER_ID,
} from './conversations.mocks';
import { ArtifactSchema } from './artifactsApi';
import { ConversationSchema, MessageSchema, ParticipantSchema } from './conversationsApi';
import { FeedbackSchema } from './feedbackApi';

const BASE = 'http://localhost:1996';
const HTTP_OK = 200;
const HTTP_CREATED = 201;
const HTTP_NO_CONTENT = 204;
const HTTP_BAD_REQUEST = 400;
const HTTP_FORBIDDEN = 403;
const HTTP_NOT_FOUND = 404;
const HTTP_PRECONDITION_FAILED = 412;
const HTTP_PRECONDITION_REQUIRED = 428;
const FIXTURE_ETAG = `"${FIXTURE_VERSION}"`;

const conversationUrl = (id: string): string => `${BASE}/v1/conversation/${id}`;
const seatUrl = (conversationId: string, userId: string): string =>
  `${conversationUrl(conversationId)}/participants/${userId}`;
const messageUrl = (id: string): string => `${BASE}/v1/message/${id}`;
const DIRECT_URL = `${BASE}/v1/conversation/direct`;

const request = (method: string, body?: object, ifMatch?: string): RequestInit => ({
  method,
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  headers: ifMatch === undefined ? {} : { 'If-Match': ifMatch },
});
/** The If-Match naming a fixture row as it was loaded. */
const asLoaded = (row: { created_at?: string | null | undefined }): string => `"${row.created_at ?? ''}"`;

const ConversationsBodySchema = z.object({ conversations: z.array(ConversationSchema) });
const SeatsBodySchema = z.object({ conversation_users: z.array(ParticipantSchema) });
const MessagesBodySchema = z.object({ messages: z.array(MessageSchema) });
const MessageBodySchema = z.object({ message: MessageSchema });
const DirectBodySchema = z.object({ conversation: ConversationSchema, message: MessageSchema.nullable() });
const FeedbacksBodySchema = z.object({ feedbacks: z.array(FeedbackSchema) });
const ArtifactsBodySchema = z.object({ artifacts: z.array(ArtifactSchema) });

describe('the mock conversations server', () => {
  it('shows the user only the conversations they are in, with their seats’ and messages’ users as the user may see them', async () => {
    const serve = fetchFrom(conversationHandlers());
    const listed = ConversationsBodySchema.parse(await (await serve(`${BASE}/v1/conversation`)).json());
    expect(listed.conversations.map(({ id }) => id)).toEqual([PLANS_ID, DIRECT_ID]);
    expect((await serve(conversationUrl(ELSEWHERE_ID))).status).toBe(HTTP_NOT_FOUND);
    const seats = SeatsBodySchema.parse(
      await (await serve(`${BASE}/v1/conversation/user?conversation_id=${PLANS_ID}&include=user`)).json(),
    );
    expect(seats.conversation_users.map(({ user_id: id, user }) => [id, user])).toEqual([
      [ME.id, ME],
      [ADA.id, ADA],
      [STRANGER_ID, null],
    ]);
    const messages = MessagesBodySchema.parse(await (await serve(`${BASE}/v1/message?conversation_id=${DIRECT_ID}`)).json());
    expect(messages.messages).toMatchObject([{ content: 'Lunch?', user: CHARLES }]);
  });

  it('holds a change to its version: 428 without one, 412 for an older one', async () => {
    const store = conversationsFixture();
    const serve = fetchFrom(conversationHandlers(store));
    const loaded = asLoaded(rowOf(store.conversations, PLANS_ID));
    const rename = { conversation: { name: 'Engine' } };
    expect((await serve(conversationUrl(PLANS_ID), request('PUT', rename))).status).toBe(HTTP_PRECONDITION_REQUIRED);
    expect((await serve(conversationUrl(PLANS_ID), request('PUT', rename, loaded))).status).toBe(HTTP_OK);
    expect((await serve(conversationUrl(PLANS_ID), request('PUT', rename, loaded))).status).toBe(HTTP_PRECONDITION_FAILED);
    expect(rowOf(store.conversations, PLANS_ID).name).toBe('Engine');
  });

  it('lets only the author edit a message, and the author or the owner delete one', async () => {
    const store = conversationsFixture();
    const serve = fetchFrom(conversationHandlers(store));
    const loaded = (id: string): string => asLoaded(rowOf(store.messages, id));
    const edit = { message: { content: 'Edited' } };
    expect((await serve(messageUrl('m1'), request('PUT', edit, loaded('m1')))).status).toBe(HTTP_FORBIDDEN);
    const mine = MessageBodySchema.parse(await (await serve(messageUrl('m2'), request('PUT', edit, loaded('m2')))).json());
    expect(mine.message.content).toBe('Edited');
    expect(mine.message.edited_at).not.toBeNull();
    expect((await serve(messageUrl('m1'), request('DELETE', undefined, loaded('m1')))).status).toBe(HTTP_NO_CONTENT);
    expect((await serve(messageUrl('m5'), request('DELETE', undefined, loaded('m5')))).status).toBe(HTTP_FORBIDDEN);
  });

  it('posts a message as the user, and a group chat they own', async () => {
    const store = conversationsFixture();
    const serve = fetchFrom(conversationHandlers(store));
    const post = (conversationId: string): RequestInit =>
      request('POST', { message: { conversation_id: conversationId, content: 'Hi' } });
    expect((await serve(`${BASE}/v1/message`, post(PLANS_ID))).status).toBe(HTTP_CREATED);
    expect(store.messages.at(-1)).toMatchObject({ conversation_id: PLANS_ID, content: 'Hi', user_id: ME.id });
    expect((await serve(`${BASE}/v1/message`, post(ELSEWHERE_ID))).status).toBe(HTTP_NOT_FOUND);
    await serve(`${BASE}/v1/conversation`, request('POST', { conversation: { name: 'New', is_group_chat: true } }));
    const created = store.conversations.at(-1);
    expect(created).toMatchObject({ name: 'New', is_group_chat: true, user_id: ME.id });
    expect(store.participants.at(-1)).toMatchObject({ conversation_id: created?.id, user_id: ME.id });
  });

  it('opens a direct conversation once per pair, only with someone the user can see', async () => {
    const store = conversationsFixture();
    const serve = fetchFrom(conversationHandlers(store));
    const open = async (body: object): Promise<Response> => serve(DIRECT_URL, request('POST', body));
    const toCharles = DirectBodySchema.parse(await (await open({ other_user_id: CHARLES.id })).json());
    expect([toCharles.conversation.id, toCharles.message]).toEqual([DIRECT_ID, null]);
    const toAda = DirectBodySchema.parse(await (await open({ other_user_id: ADA.id, initial_message: 'Hello' })).json());
    expect(toAda.message?.content).toBe('Hello');
    expect(
      store.participants.filter(({ conversation_id: id }) => id === toAda.conversation.id).map(({ user_id: id }) => id),
    ).toEqual([ME.id, ADA.id]);
    expect((await open({ other_user_id: STRANGER_ID })).status).toBe(HTTP_NOT_FOUND);
    expect((await open({ other_user_id: ME.id })).status).toBe(HTTP_BAD_REQUEST);
  });

  it('seats only people the user can see, and holds a removal to the seat’s version', async () => {
    const store = conversationsFixture();
    const serve = fetchFrom(conversationHandlers(store));
    const add = async (userId: string): Promise<Response> =>
      serve(`${conversationUrl(PLANS_ID)}/participants`, request('POST', { user_id: userId }));
    expect((await add(CHARLES.id)).status).toBe(HTTP_OK);
    expect((await add('u-nobody')).status).toBe(HTTP_NOT_FOUND);
    expect((await serve(seatUrl(PLANS_ID, ADA.id), request('DELETE'))).status).toBe(HTTP_PRECONDITION_REQUIRED);
    expect((await serve(seatUrl(PLANS_ID, ADA.id), request('DELETE', undefined, FIXTURE_ETAG))).status).toBe(HTTP_OK);
    expect(store.participants.some(({ conversation_id: id, user_id: who }) => id === PLANS_ID && who === ADA.id)).toBe(
      false,
    );
    expect((await serve(seatUrl(PLANS_ID, ME.id), request('DELETE', undefined, FIXTURE_ETAG))).status).toBe(
      HTTP_BAD_REQUEST,
    );
    expect((await serve(seatUrl(DIRECT_ID, CHARLES.id), request('DELETE', undefined, FIXTURE_ETAG))).status).toBe(
      HTTP_FORBIDDEN,
    );
  });

  it('keeps feedback its author’s, held to its version, and shows only the files of the user’s conversations', async () => {
    const store = conversationsFixture();
    const serve = fetchFrom(conversationHandlers(store));
    const mine = FeedbacksBodySchema.parse(await (await serve(`${BASE}/v1/feedback?user_id=${ME.id}`)).json());
    expect(mine.feedbacks.map(({ id }) => id)).toEqual(['f1']);
    const rate = { feedback: { positive: false } };
    expect((await serve(`${BASE}/v1/feedback/f1`, request('PUT', rate))).status).toBe(HTTP_PRECONDITION_REQUIRED);
    expect((await serve(`${BASE}/v1/feedback/f1`, request('PUT', rate, FIXTURE_ETAG))).status).toBe(HTTP_OK);
    expect(
      (await serve(`${BASE}/v1/feedback`, request('POST', { feedback: { message_id: 'gone', positive: true } }))).status,
    ).toBe(HTTP_NOT_FOUND);
    store.participants = store.participants.filter(({ conversation_id: id }) => id !== DIRECT_ID);
    const files = ArtifactsBodySchema.parse(await (await serve(`${BASE}/v1/artifact`)).json());
    expect(files.artifacts.map(({ id }) => id)).toEqual(['a1', 'a2']);
  });

  it('lets only the owner delete a conversation', async () => {
    const store = conversationsFixture();
    const serve = fetchFrom(conversationHandlers(store));
    const remove = async (id: string): Promise<number> =>
      (await serve(conversationUrl(id), request('DELETE', undefined, asLoaded(rowOf(store.conversations, id))))).status;
    expect(await remove(DIRECT_ID)).toBe(HTTP_FORBIDDEN);
    expect(await remove(PLANS_ID)).toBe(HTTP_NO_CONTENT);
    expect(store.messages.some(({ conversation_id: id }) => id === PLANS_ID)).toBe(false);
  });
});
