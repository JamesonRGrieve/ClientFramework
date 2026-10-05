// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import Link from 'next/link.js';
import type { ReactElement } from 'react';
import { useUser } from 'zephyrex';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'zephyrex/ui/card';
import { ConversationDetails } from './ConversationDetails';
import { useConversation, useParticipants } from './conversationsApi';
import { conversationTitle } from './display';
import { Messages } from './Messages';
import { Participants } from './Participants';
import { Problem } from './Problem';
import { CONVERSATIONS_PATH } from './routes';

/** One conversation: its messages, who is in it, and (for a group chat) its details. */
export function ConversationPage({ params }: { params: Record<string, string> }): ReactElement {
  const conversationId = params['conversationId'] ?? '';
  const { data: conversation, error, isLoading } = useConversation(conversationId);
  const { data: seats = [] } = useParticipants(conversationId);
  const { data: user } = useUser();

  if (error !== undefined) {
    return (
      <div className='p-4'>
        <Problem text={`The conversation could not be loaded: ${error.message}`} />
      </div>
    );
  }
  if (conversation === undefined || conversation === null) {
    return (
      <p className='p-4 text-sm text-muted-foreground'>
        {isLoading ? 'Loading…' : 'This conversation does not exist or you are not in it.'}{' '}
        <Link href={CONVERSATIONS_PATH} className='underline'>
          Back to your conversations
        </Link>
      </p>
    );
  }

  const viewerOwns = user !== undefined && user.id === conversation.user_id;
  return (
    <main className='mx-auto flex w-full max-w-4xl flex-col gap-6 p-4 md:p-10'>
      <div className='grid gap-1'>
        <Link href={CONVERSATIONS_PATH} className='text-sm text-muted-foreground underline'>
          Conversations
        </Link>
        <h1 className='text-3xl font-semibold'>{conversationTitle(conversation, seats, user?.id)}</h1>
        {(conversation.description ?? '') !== '' && <p className='text-muted-foreground'>{conversation.description}</p>}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Messages</CardTitle>
        </CardHeader>
        <CardContent>
          <Messages conversationId={conversation.id} viewerId={user?.id} ownerView={viewerOwns} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>People</CardTitle>
          <CardDescription>
            {conversation.is_group_chat ? 'Who is in this group chat.' : 'The two of you in this direct conversation.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Participants key={conversation.id} conversation={conversation} viewerId={user?.id} />
        </CardContent>
      </Card>
      {(conversation.is_group_chat || viewerOwns) && (
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent>
            <ConversationDetails key={conversation.id} conversation={conversation} viewerOwns={viewerOwns} />
          </CardContent>
        </Card>
      )}
    </main>
  );
}
