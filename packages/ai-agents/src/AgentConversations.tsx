// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { type Conversation, useConversations } from '@zephyrex/conversations';
import { Button } from '@jgrieve/forms/components/ui/button';
import { Label } from '@jgrieve/forms/components/ui/label';
import { type ReactElement, type SyntheticEvent, useId, useState } from 'react';
import { ConflictPanel, useClient, writeProblem } from 'zephyrex';
import { type ConversationSeat, seatInConversation, useConversationSeatActions, useConversationSeats } from './agentsApi';

const NONE = '';
const CHANGE_FAILURE = 'The seat could not be changed.';
const LEAVE_FAILURE = 'It could not leave.';

/** A conversation's name as listed: a group chat's name, else that it is a direct one. */
export const conversationName = (conversation: Pick<Conversation, 'name' | 'is_group_chat'> | undefined): string =>
  conversation === undefined
    ? 'A conversation you can no longer see'
    : (conversation.name ?? '') === ''
      ? conversation.is_group_chat
        ? 'Untitled chat'
        : 'Direct conversation'
      : (conversation.name ?? '');

/** One seat: whether the agent takes part and answers every message, each saved guarded by the seat; or leaving. */
function SeatRow({ seat, conversation }: { seat: ConversationSeat; conversation: Conversation | undefined }): ReactElement {
  const ids = { active: useId(), auto: useId() };
  const { update, remove } = useConversationSeatActions(seat.agent_id);
  const [problem, setProblem] = useState<string | null>(null);
  const settle = (writing: Promise<boolean>, fallback: string): void => {
    void writeProblem(writing, fallback).then(setProblem);
  };
  return (
    <li className='grid gap-2 px-4 py-3 text-sm'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <span className='font-medium'>{conversationName(conversation)}</span>
        <Button type='button' size='sm' variant='ghost' onClick={() => settle(remove.save(seat, {}), LEAVE_FAILURE)}>
          Leave
        </Button>
      </div>
      <fieldset className='flex flex-wrap gap-4'>
        <legend className='sr-only'>How it takes part</legend>
        <div className='flex items-center gap-2'>
          <input
            id={ids.active}
            type='checkbox'
            checked={seat.active}
            onChange={() => settle(update.save(seat, { active: !seat.active }), CHANGE_FAILURE)}
          />
          <Label htmlFor={ids.active}>Takes part</Label>
        </div>
        <div className='flex items-center gap-2'>
          <input
            id={ids.auto}
            type='checkbox'
            checked={seat.auto_respond}
            onChange={() => settle(update.save(seat, { auto_respond: !seat.auto_respond }), CHANGE_FAILURE)}
          />
          <Label htmlFor={ids.auto}>Answers every message</Label>
        </div>
      </fieldset>
      {update.conflict !== null && (
        <ConflictPanel
          conflict={update.conflict}
          fields={[
            { key: 'active', label: 'Takes part', format: ({ active }) => (active === true ? 'Yes' : 'No') },
            {
              key: 'auto_respond',
              label: 'Answers every message',
              format: ({ auto_respond: auto }) => (auto === true ? 'Yes' : 'No'),
            },
          ]}
          onResolve={(merged) => settle(update.resolve(merged), CHANGE_FAILURE)}
          onDiscard={update.discard}
        />
      )}
      {remove.conflict !== null && (
        <ConflictPanel
          conflict={remove.conflict}
          fields={[]}
          applyLabel='Leave anyway'
          onResolve={(merged) => settle(remove.resolve(merged), LEAVE_FAILURE)}
          onDiscard={remove.discard}
        />
      )}
      {problem !== null && (
        <p role='alert' className='text-sm text-destructive'>
          {problem}
        </p>
      )}
    </li>
  );
}

/** The conversations the agent takes part in, and seating it in another of the user's. */
export function AgentConversations({ agentId }: { agentId: string }): ReactElement {
  const client = useClient();
  const ids = { conversation: useId(), auto: useId() };
  const { data: seats = [], mutate: refreshSeats } = useConversationSeats(agentId);
  const { data: conversations = [] } = useConversations();
  const [chosen, setChosen] = useState(NONE);
  const [autoRespond, setAutoRespond] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const seated = new Set(seats.map(({ conversation_id: id }) => id));

  const submit = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (chosen === NONE) {
      setProblem('Choose a conversation.');
      return;
    }
    const seating = (async (): Promise<void> => {
      await seatInConversation(client, agentId, chosen, autoRespond);
      await refreshSeats();
      setChosen(NONE);
    })();
    void writeProblem(seating, 'It could not join the conversation.').then(setProblem);
  };

  return (
    <div className='grid gap-3'>
      {seats.length === 0 ? (
        <p className='text-sm text-muted-foreground'>It takes part in no conversations.</p>
      ) : (
        <ul aria-label='Its conversations' className='divide-y rounded-md border'>
          {seats.map((seat) => (
            <SeatRow key={seat.id} seat={seat} conversation={conversations.find(({ id }) => id === seat.conversation_id)} />
          ))}
        </ul>
      )}
      <form aria-label='Seat it in a conversation' className='grid gap-2' noValidate onSubmit={submit}>
        <div className='grid gap-1'>
          <Label htmlFor={ids.conversation}>Join a conversation</Label>
          <select
            id={ids.conversation}
            className='rounded-md border bg-background px-2 py-2 text-sm'
            value={chosen}
            onChange={(event) => {
              setChosen(event.target.value);
              setProblem(null);
            }}
          >
            <option value={NONE}>Choose a conversation…</option>
            {conversations
              .filter(({ id }) => !seated.has(id))
              .map((conversation) => (
                <option key={conversation.id} value={conversation.id}>
                  {conversationName(conversation)}
                </option>
              ))}
          </select>
        </div>
        <div className='flex items-center gap-2'>
          <input
            id={ids.auto}
            type='checkbox'
            checked={autoRespond}
            onChange={(event) => setAutoRespond(event.target.checked)}
          />
          <Label htmlFor={ids.auto}>Answer every message</Label>
        </div>
        <div>
          <Button type='submit'>Join</Button>
        </div>
      </form>
      {problem !== null && (
        <p role='alert' className='text-sm text-destructive'>
          {problem}
        </p>
      )}
    </div>
  );
}
