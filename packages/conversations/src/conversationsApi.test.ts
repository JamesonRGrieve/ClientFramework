// SPDX-License-Identifier: AGPL-3.0-or-later
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ZephyrexClient } from 'zephyrex';
import { TestWrapper, testConfig, withSession } from 'zephyrex/testing';
import { fetchFrom } from 'zephyrex/testing/msw';
import { ADA, CHARLES, conversationHandlers, conversationsFixture, FIXTURE_VERSION, ME, rowOf } from './conversations.mocks';
import {
  addParticipant,
  createGroupChat,
  openDirectMessage,
  sendMessage,
  useConversation,
  useConversationActions,
  useConversations,
  useMessageActions,
  useMessages,
  useParticipantActions,
  useParticipants,
} from './conversationsApi';

const client = new ZephyrexClient({ baseUrl: testConfig.server.baseUrl });

describe('the conversations API', () => {
  let signOut: () => void = () => undefined;
  let store = conversationsFixture();
  let calls: { url: string; init: RequestInit | undefined }[] = [];

  beforeEach(() => {
    signOut = withSession();
    store = conversationsFixture();
    calls = [];
    const answer = fetchFrom(conversationHandlers(store));
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: URL | string, init?: RequestInit) => {
        calls.push({ url: String(input), init });
        return answer(input, init);
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    signOut();
  });

  const writes = (): (string | null | undefined)[][] =>
    calls
      .filter(({ init }) => (init?.method ?? 'GET') !== 'GET')
      .map(({ url, init }) => [
        init?.method,
        url.replace(testConfig.server.baseUrl, ''),
        typeof init?.body === 'string' ? init.body : undefined,
        new Headers(init?.headers).get('If-Match'),
      ]);

  it('reads the conversations most recently changed first, and one conversation or null', async () => {
    const all = renderHook(() => useConversations(), { wrapper: TestWrapper }).result;
    await waitFor(() => {
      expect(all.current.data?.map(({ id }) => id)).toEqual(['dm-charles', 'plans']);
    });
    const plans = renderHook(() => useConversation('plans'), { wrapper: TestWrapper }).result;
    await waitFor(() => {
      expect(plans.current.data?.name).toBe('Engine plans');
    });
    const elsewhere = renderHook(() => useConversation('elsewhere'), { wrapper: TestWrapper }).result;
    await waitFor(() => {
      expect(elsewhere.current.data).toBeNull();
    });
  });

  it('reads who is in a conversation, or in all of them, with their users', async () => {
    const plans = renderHook(() => useParticipants('plans'), { wrapper: TestWrapper }).result;
    await waitFor(() => {
      expect(plans.current.data?.map(({ user }) => user?.id ?? null)).toEqual([ME.id, ADA.id, null]);
    });
    const all = renderHook(() => useParticipants(), { wrapper: TestWrapper }).result;
    await waitFor(() => {
      expect(all.current.data).toHaveLength(5);
    });
    expect(calls.map(({ url }) => new URL(url).searchParams.get('include'))).toContain('user');
  });

  it('reads a conversation’s messages oldest first, with their authors', async () => {
    const { result } = renderHook(() => useMessages('plans'), { wrapper: TestWrapper });
    await waitFor(() => {
      expect(result.current.data?.map(({ id }) => id)).toEqual(['m1', 'm2', 'm3', 'm4']);
    });
    expect(result.current.data?.[0]?.user).toEqual(ADA);
  });

  it('starts group chats, opens direct ones, posts messages and seats people in the server’s shapes', async () => {
    const chat = await createGroupChat(client, { name: 'Lab', description: null });
    await expect(openDirectMessage(client, ADA.id, 'Hi Ada')).resolves.toMatchObject({ is_group_chat: false });
    await sendMessage(client, chat.id, 'First', null);
    await sendMessage(client, 'plans', 'Agreed', 'm1');
    await addParticipant(client, chat.id, CHARLES.id);
    expect(writes()).toEqual([
      ['POST', '/v1/conversation', '{"conversation":{"name":"Lab","description":null,"is_group_chat":true}}', null],
      ['POST', '/v1/conversation/direct', '{"other_user_id":"u-ada","initial_message":"Hi Ada"}', null],
      ['POST', '/v1/message', `{"message":{"conversation_id":"${chat.id}","content":"First"}}`, null],
      ['POST', '/v1/message', '{"message":{"conversation_id":"plans","content":"Agreed","parent_id":"m1"}}', null],
      ['POST', `/v1/conversation/${chat.id}/participants`, '{"user_id":"u-charles"}', null],
    ]);
  });

  it('guards each change by the row as loaded: a seat’s removal by the seat, not the conversation', async () => {
    const plans = rowOf(store.conversations, 'plans');
    const mine = rowOf(store.messages, 'm2');
    const adaSeat = rowOf(store.participants, `plans:${ADA.id}`);
    const conversation = renderHook(() => useConversationActions('plans'), { wrapper: TestWrapper }).result;
    const messages = renderHook(() => useMessageActions('plans'), { wrapper: TestWrapper }).result;
    const seats = renderHook(() => useParticipantActions('plans'), { wrapper: TestWrapper }).result;
    await expect(conversation.current.update.save(plans, { name: 'Engine' })).resolves.toBe(true);
    await expect(messages.current.update.save(mine, { content: 'Then we run it!' })).resolves.toBe(true);
    await expect(seats.current.remove.save(adaSeat, {})).resolves.toBe(true);
    await expect(messages.current.remove.save(rowOf(store.messages, 'm3'), {})).resolves.toBe(true);
    expect(writes()).toEqual([
      ['PUT', '/v1/conversation/plans', '{"conversation":{"name":"Engine"}}', `"${plans.created_at ?? ''}"`],
      ['PUT', '/v1/message/m2', '{"message":{"content":"Then we run it!"}}', `"${mine.created_at ?? ''}"`],
      ['DELETE', `/v1/conversation/plans/participants/${ADA.id}`, undefined, `"${FIXTURE_VERSION}"`],
      ['DELETE', '/v1/message/m3', undefined, `"${rowOf(conversationsFixture().messages, 'm3').created_at ?? ''}"`],
    ]);
  });

  it('keeps a stale change as a conflict beside the row as it is now', async () => {
    const plans = rowOf(store.conversations, 'plans');
    store.conversations = store.conversations.map((row) =>
      row.id === 'plans' ? { ...row, name: 'Renamed first', updated_at: '2026-10-02T08:00:00.000001' } : row,
    );
    const { result } = renderHook(() => useConversationActions('plans'), { wrapper: TestWrapper });
    await expect(result.current.update.save(plans, { name: 'Engine' })).resolves.toBe(false);
    await waitFor(() => {
      expect(result.current.update.conflict?.theirs?.name).toBe('Renamed first');
    });
  });
});
