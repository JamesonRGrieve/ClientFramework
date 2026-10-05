// SPDX-License-Identifier: AGPL-3.0-or-later
// How conversations name the people in them: by the user the server shows, an agent when a message
// has no author, and someone unnamed when the server won't show the viewer who they are.
import { serverInstant } from 'zephyrex';
import { type Person, personName } from 'zephyrex/pages/team';
import type { Conversation, Message, Participant } from './conversationsApi';

/** A person the server won't show the viewer (they share no team). */
export const UNSEEN = 'Someone outside your teams';
export const AGENT = 'Agent';
const UNTITLED = 'Untitled chat';

const nameOf = (user: Person | null | undefined): string => {
  const name = user === null || user === undefined ? '' : personName(user);
  return name === '' ? UNSEEN : name;
};

/** Who wrote a message: its author, or the agent for a message with none. */
export const authorOf = (message: Pick<Message, 'user_id' | 'user'>): string =>
  message.user_id === null || message.user_id === undefined ? AGENT : nameOf(message.user);

/** Who sits in a seat. */
export const seatName = (seat: Pick<Participant, 'user'>): string => nameOf(seat.user);

/** A conversation's title: a group chat's name, or for a direct conversation the others in it. */
export function conversationTitle(
  conversation: Pick<Conversation, 'name' | 'is_group_chat'>,
  seats: readonly Participant[],
  viewerId: string | undefined,
): string {
  const others = seats.filter(({ user_id: id }) => id !== viewerId).map(seatName);
  if (!conversation.is_group_chat && others.length > 0) {
    return others.join(', ');
  }
  return (conversation.name ?? '') === '' ? UNTITLED : (conversation.name ?? UNTITLED);
}

/** A server timestamp in the user's own time; empty when there is none. */
export const shownTime = (value: string | null | undefined): string =>
  value === null || value === undefined || value === '' ? '' : serverInstant(value).toLocaleString();
