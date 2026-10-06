// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { Button } from '@jgrieve/forms/components/ui/button';
import { type ReactElement, useState } from 'react';
import { type ActivityNode, type Turn, useActivityTree, useTurns } from './triggersApi';
import { activityState, turnSummary } from './turnDisplay';

/** How many of the newest turns are listed. */
const SHOWN_TURNS = 20;

/** One activity and, nested under it, what it did along the way. */
function ActivityItem({ node }: { node: ActivityNode }): ReactElement {
  return (
    <li className='grid gap-1'>
      <span>
        <span className='font-medium'>{node.activity.title}</span>{' '}
        <span className='text-xs text-muted-foreground'>· {activityState(node.activity)}</span>
      </span>
      {node.activity.body !== '' && <p className='whitespace-pre-wrap text-xs'>{node.activity.body}</p>}
      {node.children.length > 0 && (
        <ul className='grid gap-1 border-l pl-3'>
          {node.children.map((child) => (
            <ActivityItem key={child.activity.id} node={child} />
          ))}
        </ul>
      )}
    </li>
  );
}

/** What the agent did during a turn, as a tree. */
function ActivityTree({ turnId }: { turnId: string }): ReactElement {
  const { data: nodes = [], error, isLoading } = useActivityTree(turnId);
  if (error !== undefined) {
    return (
      <p role='alert' className='text-sm text-destructive'>
        What it did could not be loaded: {error.message}
      </p>
    );
  }
  if (nodes.length === 0) {
    return <p className='text-xs text-muted-foreground'>{isLoading ? 'Loading…' : 'It did nothing it recorded.'}</p>;
  }
  return (
    <ul aria-label='What it did' className='grid gap-2 text-sm'>
      {nodes.map((node) => (
        <ActivityItem key={node.activity.id} node={node} />
      ))}
    </ul>
  );
}

/** One turn: how it ended, what it was asked, and what it did when opened. */
function TurnItem({ turn }: { turn: Turn }): ReactElement {
  const [open, setOpen] = useState(false);
  return (
    <li className='grid gap-1 px-4 py-3 text-sm'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <span className={turn.status === 'failed' ? 'text-destructive' : ''}>{turnSummary(turn)}</span>
        <Button type='button' size='sm' variant='ghost' aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? 'Hide' : 'What it did'}
        </Button>
      </div>
      {(turn.payload ?? '') !== '' && <p className='whitespace-pre-wrap text-muted-foreground'>{turn.payload}</p>}
      {open && <ActivityTree turnId={turn.id} />}
    </li>
  );
}

/** The agent's most recent turns, newest first, each opening onto what it did. */
export function Turns({ agentId }: { agentId: string }): ReactElement {
  const { data: turns = [], error, isLoading } = useTurns(agentId);
  return (
    <div className='grid gap-3'>
      {error !== undefined && (
        <p role='alert' className='text-sm text-destructive'>
          The turns could not be loaded: {error.message}
        </p>
      )}
      {error === undefined && turns.length === 0 && (
        <p className='text-sm text-muted-foreground'>{isLoading ? 'Loading…' : 'It has not taken a turn yet.'}</p>
      )}
      {turns.length > 0 && (
        <ul aria-label='Turns' className='divide-y rounded-md border'>
          {turns.slice(0, SHOWN_TURNS).map((turn) => (
            <TurnItem key={turn.id} turn={turn} />
          ))}
        </ul>
      )}
    </div>
  );
}
