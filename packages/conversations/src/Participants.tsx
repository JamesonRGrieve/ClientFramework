// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { Button } from '@jgrieve/forms/components/ui/button';
import { useRouter } from 'next/navigation.js';
import { type ReactElement, type SyntheticEvent, useState } from 'react';
import { ConflictPanel, useClient, writeProblem } from 'zephyrex';
import { useTeammates } from 'zephyrex/pages/team';
import {
  addParticipant,
  type Conversation,
  type Participant,
  useParticipantActions,
  useParticipants,
} from './conversationsApi';
import { seatName } from './display';
import { PersonPicker } from './PersonPicker';
import { Problem } from './Problem';
import { CONVERSATIONS_PATH } from './routes';

const REMOVE_FAILURE = 'They could not be removed.';

/** Add a teammate to a group chat. */
function AddParticipantForm({
  conversationId,
  seated,
}: {
  conversationId: string;
  seated: ReadonlySet<string>;
}): ReactElement {
  const client = useClient();
  const { data: teammates = [] } = useTeammates();
  const { mutate: refreshParticipants } = useParticipants(conversationId);
  const [who, setWho] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const addable = teammates.filter(({ id }) => !seated.has(id));

  const submit = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (who === null) {
      setProblem('Choose who to add.');
      return;
    }
    const adding = (async (): Promise<void> => {
      await addParticipant(client, conversationId, who);
      await refreshParticipants();
      setWho(null);
    })();
    void writeProblem(adding, 'They could not be added.').then(setProblem);
  };

  return (
    <form aria-label='Add someone to the chat' className='flex flex-wrap items-end gap-2' onSubmit={submit}>
      <PersonPicker
        label='Add someone'
        people={addable}
        value={who}
        onChange={(userId) => {
          setWho(userId);
          setProblem(null);
        }}
      />
      <Button type='submit'>Add</Button>
      <div className='w-full'>
        <Problem text={problem} />
      </div>
    </form>
  );
}

/**
 * Who is in a conversation, its owner marked. The owner removes others; anyone else may leave,
 * which takes them back to their conversations. A group chat takes more of the viewer's teammates.
 */
export function Participants({
  conversation,
  viewerId,
}: {
  conversation: Conversation;
  viewerId: string | undefined;
}): ReactElement {
  const router = useRouter();
  const { data: seats = [], error, isLoading } = useParticipants(conversation.id);
  const { remove } = useParticipantActions(conversation.id);
  const [problem, setProblem] = useState<string | null>(null);
  // Whether the removal awaiting a resolved conflict is the viewer leaving.
  const [leaving, setLeaving] = useState(false);
  const owner = conversation.user_id;
  const viewerOwns = viewerId !== undefined && viewerId === owner;

  /** Once a removal lands: leaving (your own seat) ends on your conversations. */
  const settleRemove = async (removing: Promise<boolean>, isLeaving: boolean): Promise<void> => {
    try {
      if ((await removing) && isLeaving) {
        router.push(CONVERSATIONS_PATH);
      }
    } catch (failure) {
      setProblem(failure instanceof Error ? failure.message : REMOVE_FAILURE);
    }
  };
  const removeSeat = (seat: Participant): void => {
    const isLeaving = seat.user_id === viewerId;
    setProblem(null);
    setLeaving(isLeaving);
    void settleRemove(remove.save(seat, {}), isLeaving);
  };

  return (
    <div className='grid gap-4'>
      {error !== undefined && <Problem text={`Who is here could not be loaded: ${error.message}`} />}
      {error === undefined && seats.length === 0 && isLoading && <p className='text-sm text-muted-foreground'>Loading…</p>}
      {seats.length > 0 && (
        <ul aria-label='Participants' className='divide-y rounded-md border'>
          {seats.map((seat) => {
            const own = seat.user_id === viewerId;
            const isOwner = seat.user_id === owner;
            return (
              <li key={seat.id} className='flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm'>
                <span>
                  {seatName(seat)}
                  {own && <span className='text-muted-foreground'> (you)</span>}
                  {isOwner && <span className='text-muted-foreground'> · owner</span>}
                </span>
                {!isOwner && (viewerOwns || own) && (
                  <Button type='button' size='sm' variant='outline' onClick={() => removeSeat(seat)}>
                    {own ? 'Leave' : 'Remove'}
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {remove.conflict !== null && (
        <ConflictPanel
          conflict={remove.conflict}
          fields={[]}
          applyLabel='Remove anyway'
          onResolve={(merged) => {
            void settleRemove(remove.resolve(merged), leaving);
          }}
          onDiscard={remove.discard}
        />
      )}
      <Problem text={problem} />
      {conversation.is_group_chat && (
        <AddParticipantForm conversationId={conversation.id} seated={new Set(seats.map(({ user_id: id }) => id))} />
      )}
    </div>
  );
}
