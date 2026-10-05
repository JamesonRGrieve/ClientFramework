// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { Button } from '@jgrieve/forms/components/ui/button';
import { Label } from '@jgrieve/forms/components/ui/label';
import { type ReactElement, type SyntheticEvent, useId, useState } from 'react';
import { type ConflictField, ConflictPanel, useClient, useDraft, useEditBase, writeProblem } from 'zephyrex';
import { Textarea } from 'zephyrex/ui/textarea';
import { type Message, sendMessage, useMessageActions, useMessages } from './conversationsApi';
import { authorOf, shownTime } from './display';
import { MessageFeedback } from './MessageFeedback';
import { Problem } from './Problem';
import { VoiceRecorder } from './VoiceRecorder';

const EDIT_FAILURE = 'The message could not be saved.';
const REMOVE_FAILURE = 'The message could not be deleted.';
const COMPOSE_ROWS = 3;
/** How much of a message a reply quotes. */
const QUOTE_LENGTH = 80;

const CONFLICT_FIELDS: readonly ConflictField<Message>[] = [{ key: 'content', label: 'Message' }];

const contentOf = ({ content }: Message): string => content;

/** The start of a message, as a reply quotes it. */
export const quoted = (content: string): string =>
  content.length > QUOTE_LENGTH ? `${content.slice(0, QUOTE_LENGTH).trimEnd()}…` : content;

/** Change the text of one of the user's messages, saved over the message as it was opened. */
function MessageEditor({ message, onClose }: { message: Message; onClose: () => void }): ReactElement {
  const id = useId();
  const { update } = useMessageActions(message.conversation_id);
  const { base, rebaseOnSave } = useEditBase(message);
  const [content, setContent] = useDraft(base, contentOf);
  const [problem, setProblem] = useState<string | null>(null);

  const settle = async (saving: Promise<boolean>): Promise<void> => {
    try {
      if (await rebaseOnSave(saving)) {
        onClose();
      }
    } catch (error) {
      setProblem(error instanceof Error ? error.message : EDIT_FAILURE);
    }
  };

  const submit = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (content.trim() === '') {
      setProblem('A message needs some text; delete it instead.');
      return;
    }
    if (content === base.content) {
      onClose();
      return;
    }
    void settle(update.save(base, { content }));
  };

  // The conflict panel sits beside the form, not in it: its choices are not the form's fields.
  return (
    <div className='grid gap-2'>
      <form className='grid gap-2' onSubmit={submit}>
        <Label htmlFor={id} className='sr-only'>
          Edit message
        </Label>
        <Textarea
          id={id}
          rows={COMPOSE_ROWS}
          value={content}
          onChange={(event) => {
            setContent(event.target.value);
            setProblem(null);
          }}
        />
        <div className='flex gap-2'>
          <Button type='submit' size='sm'>
            Save
          </Button>
          <Button type='button' size='sm' variant='ghost' onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
      {update.conflict !== null && (
        <ConflictPanel
          conflict={update.conflict}
          fields={CONFLICT_FIELDS}
          onResolve={(merged) => {
            void settle(update.resolve(merged));
          }}
          onDiscard={update.discard}
        />
      )}
      <Problem text={problem} />
    </div>
  );
}

/** One message: who wrote it and when, what it replies to, and what the user may do with it. */
function MessageItem({
  message,
  parent,
  viewerId,
  ownerView,
  onReply,
}: {
  message: Message;
  parent: Message | undefined;
  viewerId: string | undefined;
  ownerView: boolean;
  onReply: (message: Message) => void;
}): ReactElement {
  const { remove } = useMessageActions(message.conversation_id);
  const [editing, setEditing] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const fromAgent = message.user_id === null || message.user_id === undefined;
  const mine = !fromAgent && message.user_id === viewerId;

  const settleRemove = async (removing: Promise<boolean>): Promise<void> => {
    try {
      await removing;
    } catch (error) {
      setProblem(error instanceof Error ? error.message : REMOVE_FAILURE);
    }
  };

  return (
    <li className='grid gap-1 px-4 py-3 text-sm'>
      <div className='flex flex-wrap items-baseline gap-2'>
        <span className='font-medium'>{authorOf(message)}</span>
        <span className='text-xs text-muted-foreground'>
          {shownTime(message.created_at)}
          {(message.edited_at ?? '') !== '' && ' · edited'}
        </span>
      </div>
      {message.parent_id !== null && message.parent_id !== undefined && (
        <p className='border-l-2 pl-2 text-xs text-muted-foreground'>
          {parent === undefined
            ? 'Replying to a message that is gone'
            : `Replying to ${authorOf(parent)}: ${quoted(parent.content)}`}
        </p>
      )}
      {editing ? (
        <MessageEditor message={message} onClose={() => setEditing(false)} />
      ) : (
        <p className='whitespace-pre-wrap break-words'>{message.content}</p>
      )}
      {!editing && (
        <div className='flex gap-1'>
          <Button type='button' size='sm' variant='ghost' onClick={() => onReply(message)}>
            Reply
          </Button>
          {mine && (
            <Button type='button' size='sm' variant='ghost' onClick={() => setEditing(true)}>
              Edit
            </Button>
          )}
          {(mine || ownerView) && (
            <Button
              type='button'
              size='sm'
              variant='ghost'
              onClick={() => {
                setProblem(null);
                void settleRemove(remove.save(message, {}));
              }}
            >
              Delete
            </Button>
          )}
        </div>
      )}
      {!editing && fromAgent && <MessageFeedback messageId={message.id} />}
      {remove.conflict !== null && (
        <ConflictPanel
          conflict={remove.conflict}
          fields={[]}
          applyLabel='Delete anyway'
          onResolve={(merged) => {
            void settleRemove(remove.resolve(merged));
          }}
          onDiscard={remove.discard}
        />
      )}
      <Problem text={problem} />
    </li>
  );
}

/** Write a message, or a reply to `replyTo`. */
function Compose({
  conversationId,
  replyTo,
  onSent,
  onCancelReply,
}: {
  conversationId: string;
  replyTo: Message | null;
  onSent: () => void;
  onCancelReply: () => void;
}): ReactElement {
  const client = useClient();
  const id = useId();
  const { mutate: refreshMessages } = useMessages(conversationId);
  const [text, setText] = useState('');
  const [pending, setPending] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const submit = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (text.trim() === '') {
      return;
    }
    setPending(true);
    const sending = (async (): Promise<void> => {
      await sendMessage(client, conversationId, text.trim(), replyTo?.id ?? null);
      await refreshMessages();
      setText('');
      onSent();
    })();
    void (async (): Promise<void> => {
      setProblem(await writeProblem(sending, 'The message could not be sent.'));
      setPending(false);
    })();
  };

  return (
    <form aria-label='Write a message' className='grid gap-2' onSubmit={submit}>
      {replyTo !== null && (
        <p className='flex items-center gap-2 text-xs text-muted-foreground'>
          Replying to {authorOf(replyTo)}: {quoted(replyTo.content)}
          <Button type='button' size='sm' variant='ghost' onClick={onCancelReply}>
            Cancel reply
          </Button>
        </p>
      )}
      <Label htmlFor={id}>{replyTo === null ? 'Message' : 'Reply'}</Label>
      <Textarea
        id={id}
        rows={COMPOSE_ROWS}
        value={text}
        onChange={(event) => {
          setText(event.target.value);
          setProblem(null);
        }}
      />
      <div className='flex flex-wrap items-start gap-2'>
        <Button type='submit' disabled={pending || text.trim() === ''}>
          Send
        </Button>
        <VoiceRecorder
          conversationId={conversationId}
          parentId={replyTo?.id ?? null}
          onSent={async () => {
            await refreshMessages();
            onSent();
          }}
        />
      </div>
      <Problem text={problem} />
    </form>
  );
}

/**
 * A conversation's messages, oldest first, and a form to write one. The viewer edits their own
 * messages and deletes them; the conversation's owner (`ownerView`) deletes anyone's.
 */
export function Messages({
  conversationId,
  viewerId,
  ownerView,
}: {
  conversationId: string;
  viewerId: string | undefined;
  ownerView: boolean;
}): ReactElement {
  const { data: messages = [], error, isLoading } = useMessages(conversationId);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const byId = new Map(messages.map((message) => [message.id, message]));

  return (
    <div className='grid gap-4'>
      {error !== undefined && <Problem text={`The messages could not be loaded: ${error.message}`} />}
      {error === undefined && messages.length === 0 && (
        <p className='text-sm text-muted-foreground'>{isLoading ? 'Loading…' : 'No messages yet.'}</p>
      )}
      {messages.length > 0 && (
        <ol aria-label='Messages' className='divide-y rounded-md border'>
          {messages.map((message) => (
            <MessageItem
              key={message.id}
              message={message}
              parent={
                message.parent_id === null || message.parent_id === undefined ? undefined : byId.get(message.parent_id)
              }
              viewerId={viewerId}
              ownerView={ownerView}
              onReply={setReplyTo}
            />
          ))}
        </ol>
      )}
      <Compose
        conversationId={conversationId}
        replyTo={replyTo}
        onSent={() => setReplyTo(null)}
        onCancelReply={() => setReplyTo(null)}
      />
    </div>
  );
}
