// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { rowOf } from 'zephyrex/testing/msw';
import { ADA, CHARLES, conversationsFixture, ME } from './conversations.mocks';
import { AGENT, authorOf, conversationTitle, seatName, UNSEEN } from './display';

describe('display', () => {
  it('names a message’s author, the agent for one with none, and someone unseen otherwise', () => {
    expect(authorOf({ user_id: ADA.id, user: ADA })).toBe('Ada Lovelace');
    expect(authorOf({ user_id: null, user: null })).toBe(AGENT);
    expect(authorOf({ user_id: 'u-stranger', user: null })).toBe(UNSEEN);
    expect(authorOf({ user_id: 'u-blank', user: { id: 'u-blank' } })).toBe(UNSEEN);
  });

  it('names who sits in a seat', () => {
    expect(seatName({ user: CHARLES })).toBe('Babbage');
    expect(seatName({ user: null })).toBe(UNSEEN);
  });

  it('titles a direct conversation by the others in it, and a group chat by its name', () => {
    const { conversations, participants } = conversationsFixture();
    const seats = participants.map((seat) => ({
      ...seat,
      user: [ME, ADA, CHARLES].find(({ id }) => id === seat.user_id) ?? null,
    }));
    const direct = rowOf(conversations, 'dm-charles');
    expect(
      conversationTitle(
        direct,
        seats.filter(({ conversation_id: id }) => id === direct.id),
        ME.id,
      ),
    ).toBe('Babbage');
    expect(conversationTitle(direct, [], ME.id)).toBe('Direct Message');
    expect(conversationTitle(rowOf(conversations, 'plans'), seats, ME.id)).toBe('Engine plans');
    expect(conversationTitle({ name: null, is_group_chat: true }, [], ME.id)).toBe('Untitled chat');
  });
});
