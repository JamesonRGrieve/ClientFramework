// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { Button } from '@jgrieve/forms/components/ui/button';
import { Input } from '@jgrieve/forms/components/ui/input';
import { Label } from '@jgrieve/forms/components/ui/label';
import Link from 'next/link.js';
import { useRouter } from 'next/navigation.js';
import { type ReactElement, type SyntheticEvent, useId, useState } from 'react';
import { shownTime, useClient, useUser, writeProblem } from 'zephyrex';
import { useTeammates } from 'zephyrex/pages/team';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'zephyrex/ui/card';
import { createGroupChat, openDirectMessage, useConversations, useParticipants } from './conversationsApi';
import { conversationTitle } from './display';
import { PersonPicker } from './PersonPicker';
import { Problem } from './Problem';
import { conversationPagePath } from './routes';

/** Start a group chat owned by the user, then on to it to add people and talk. */
function NewGroupChatForm(): ReactElement {
  const client = useClient();
  const router = useRouter();
  const { mutate: refreshConversations } = useConversations();
  const ids = { name: useId(), description: useId() };
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [pending, setPending] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const submit = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (name.trim() === '') {
      setProblem('Give the chat a name.');
      return;
    }
    setPending(true);
    const creating = (async (): Promise<void> => {
      const chat = await createGroupChat(client, {
        name: name.trim(),
        description: description.trim() === '' ? null : description.trim(),
      });
      await refreshConversations();
      router.push(conversationPagePath(chat.id));
    })();
    void (async (): Promise<void> => {
      setProblem(await writeProblem(creating, 'The chat could not be started.'));
      setPending(false);
    })();
  };

  return (
    <form aria-label='New group chat' className='grid gap-3 sm:grid-cols-[1fr_2fr_auto] sm:items-end' onSubmit={submit}>
      <div className='grid gap-1'>
        <Label htmlFor={ids.name}>Group chat name</Label>
        <Input id={ids.name} value={name} required onChange={(event) => setName(event.target.value)} />
      </div>
      <div className='grid gap-1'>
        <Label htmlFor={ids.description}>Description (optional)</Label>
        <Input id={ids.description} value={description} onChange={(event) => setDescription(event.target.value)} />
      </div>
      <Button type='submit' disabled={pending}>
        Start a group chat
      </Button>
      <div className='sm:col-span-3'>
        <Problem text={problem} />
      </div>
    </form>
  );
}

/** Message one of the user's teammates: their direct conversation, opened (or found) with a first message. */
function DirectMessageForm(): ReactElement {
  const client = useClient();
  const router = useRouter();
  const { mutate: refreshConversations } = useConversations();
  const { data: teammates = [] } = useTeammates();
  const messageId = useId();
  const [to, setTo] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [pending, setPending] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const submit = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (to === null) {
      setProblem('Choose who to message.');
      return;
    }
    setPending(true);
    const opening = (async (): Promise<void> => {
      const direct = await openDirectMessage(client, to, text.trim() === '' ? null : text.trim());
      await refreshConversations();
      router.push(conversationPagePath(direct.id));
    })();
    void (async (): Promise<void> => {
      setProblem(await writeProblem(opening, 'The conversation could not be opened.'));
      setPending(false);
    })();
  };

  return (
    <form aria-label='Message someone' className='grid gap-3 sm:grid-cols-[1fr_2fr_auto] sm:items-end' onSubmit={submit}>
      <PersonPicker label='Message' people={teammates} value={to} onChange={setTo} />
      <div className='grid gap-1'>
        <Label htmlFor={messageId}>First message (optional)</Label>
        <Input id={messageId} value={text} onChange={(event) => setText(event.target.value)} />
      </div>
      <Button type='submit' disabled={pending}>
        Open conversation
      </Button>
      <div className='sm:col-span-3'>
        <Problem text={problem} />
      </div>
    </form>
  );
}

/** The user's conversations, the most recent first, each opening its page; and ways to start one. */
export function ConversationsPage(): ReactElement {
  const { data: conversations = [], error, isLoading } = useConversations();
  const { data: seats = [] } = useParticipants();
  const { data: user } = useUser();

  return (
    <main className='mx-auto flex w-full max-w-4xl flex-col gap-6 p-4 md:p-10'>
      <Card>
        <CardHeader>
          <CardTitle>Conversations</CardTitle>
          <CardDescription>Your direct messages and group chats.</CardDescription>
        </CardHeader>
        <CardContent className='grid gap-6'>
          <DirectMessageForm />
          <NewGroupChatForm />
          {error !== undefined && <Problem text={`The conversations could not be loaded: ${error.message}`} />}
          {error === undefined && conversations.length === 0 && (
            <p className='text-sm text-muted-foreground'>{isLoading ? 'Loading…' : 'You have no conversations yet.'}</p>
          )}
          {conversations.length > 0 && (
            <ul aria-label='Conversations' className='divide-y rounded-md border'>
              {conversations.map((conversation) => (
                <li key={conversation.id} className='flex flex-wrap items-baseline justify-between gap-2 px-4 py-3 text-sm'>
                  <span>
                    <Link href={conversationPagePath(conversation.id)} className='font-medium hover:underline'>
                      {conversationTitle(
                        conversation,
                        seats.filter(({ conversation_id: id }) => id === conversation.id),
                        user?.id,
                      )}
                    </Link>
                    <span className='text-muted-foreground'>
                      {conversation.is_group_chat ? ' · group chat' : ' · direct message'}
                    </span>
                  </span>
                  <span className='text-muted-foreground'>
                    {shownTime(conversation.updated_at ?? conversation.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
