// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { Button } from '@jgrieve/forms/components/ui/button';
import Link from 'next/link.js';
import { type ReactElement, type ReactNode, useId, useMemo, useState } from 'react';
import { ApiError, useClient, useUser } from 'zephyrex';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'zephyrex/ui/card';
import { FRIENDSHIP, genealogyApi, type LinkedNetwork, PARTNERSHIP, useLinkedNetwork } from './genealogyApi';
import { type LegendEntry, TIE_LEGEND } from './legend';
import { NetworkGraph } from './NetworkGraph';
import { personPath } from './routes';
import { fromLinkedNetwork } from './socialLayout';

const SOMEONE = 'Someone';
const DEFAULT_KINDS: readonly string[] = [PARTNERSHIP];

type LinkedNode = LinkedNetwork['nodes'][number];

/** The merged network's people by group, each group's nearest first; the centre is in none. */
export function byGroup(linked: LinkedNetwork): LinkedNode[][] {
  const groups = new Map<number, LinkedNode[]>();
  for (const node of linked.nodes) {
    if (node.group !== null) {
      groups.set(node.group, [...(groups.get(node.group) ?? []), node]);
    }
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, members]) => [...members].sort((a, b) => a.distance - b.distance));
}

function Member({ node }: { node: LinkedNode }): ReactElement {
  const name = node.name ?? SOMEONE;
  return node.person_id === null ? (
    <span className='block rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground'>{name}</span>
  ) : (
    <Link href={personPath(node.person_id)} className='block rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted'>
      {name}
    </Link>
  );
}

const NOT_FOUND = 404;

/** The user's own name for their record of themselves: their full name, else their email. */
const ownName = (user: {
  email: string;
  first_name?: string | null | undefined;
  last_name?: string | null | undefined;
}): string =>
  [user.first_name, user.last_name].filter((part) => part !== null && part !== undefined && part.trim() !== '').join(' ') ||
  user.email;

/**
 * Asked when the user has no record of themselves yet, the network's centre: one press adds it,
 * linked to their account, and the network loads around it.
 */
function StartWithYou({ onStarted }: { onStarted: () => Promise<unknown> }): ReactElement {
  const client = useClient();
  const { data: user } = useUser();
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const start = async (): Promise<void> => {
    if (user === undefined) {
      return;
    }
    setBusy(true);
    setProblem(null);
    try {
      await genealogyApi.createPerson(client, { name: ownName(user), linked_user_id: user.id });
      await onStarted();
    } catch (error) {
      setProblem(error instanceof Error ? error.message : 'You could not be added.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className='grid justify-items-start gap-2'>
      <p className='text-sm text-muted-foreground'>
        Start your map with yourself, then add the people you are connected to, whether they are on here or not.
      </p>
      <Button
        disabled={user === undefined || busy}
        onClick={() => {
          void start();
        }}
      >
        Add myself
      </Button>
      {problem !== null && (
        <p role='alert' className='text-sm text-destructive'>
          {problem}
        </p>
      )}
    </div>
  );
}

/**
 * The signed-in user at the centre of their network merged across linked trees, each group (a
 * polycule, in a polycule app) branching off in its own direction, with the same people listed by
 * group. Strangers show as they chose: by name, or as "Someone".
 */
export function LinkedNetworkMap({
  title = 'Network',
  description = 'You, and everyone your linked trees reach.',
  groupLabel = (index: number): string => `Group ${String(index + 1)}`,
  legend = TIE_LEGEND,
  kinds = DEFAULT_KINDS,
}: {
  /** The card's heading; null for none, when the page already has one. */
  title?: ReactNode;
  description?: ReactNode;
  /**
   * What to call each group, from its place and its names, nearest first (the first is the person
   * the group branches off through), e.g. "With Jordan Blake".
   */
  groupLabel?: (index: number, names: readonly string[]) => string;
  legend?: readonly LegendEntry[];
  /** The kinds of tie walked (friendships are added when asked); partnerships when omitted. */
  kinds?: readonly string[];
}): ReactElement {
  const ids = { friends: useId(), ended: useId() };
  const [throughFriends, setThroughFriends] = useState(false);
  const [includeEnded, setIncludeEnded] = useState(false);
  const linked = useLinkedNetwork({
    kinds: throughFriends ? [...kinds, FRIENDSHIP] : kinds,
    includeEnded,
  });
  const graph = useMemo(() => (linked.data === undefined ? undefined : fromLinkedNetwork(linked.data)), [linked.data]);
  const groups = linked.data === undefined ? [] : byGroup(linked.data);

  return (
    <Card>
      {title !== null && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      )}
      <CardContent className={title === null ? 'grid gap-4 pt-6' : 'grid gap-4'}>
        {/* The filters, once there is a map to filter (and while one is on, even if it empties it). */}
        {linked.data !== undefined && (groups.length > 0 || throughFriends || includeEnded) && (
          <div className='flex flex-wrap gap-4 text-sm'>
            <label htmlFor={ids.friends} className='flex items-center gap-1'>
              <input
                id={ids.friends}
                type='checkbox'
                checked={throughFriends}
                onChange={(event) => setThroughFriends(event.target.checked)}
              />
              Through friendships too
            </label>
            <label htmlFor={ids.ended} className='flex items-center gap-1'>
              <input
                id={ids.ended}
                type='checkbox'
                checked={includeEnded}
                onChange={(event) => setIncludeEnded(event.target.checked)}
              />
              Include ended relationships
            </label>
          </div>
        )}
        {linked.error instanceof ApiError && linked.error.status === NOT_FOUND && (
          <StartWithYou onStarted={async () => linked.mutate()} />
        )}
        {linked.error !== undefined && !(linked.error instanceof ApiError && linked.error.status === NOT_FOUND) && (
          <p role='alert' className='text-sm text-destructive'>
            The network could not be loaded: {linked.error.message}
          </p>
        )}
        {linked.error === undefined && groups.length === 0 && (
          <p className='text-sm text-muted-foreground'>
            {linked.isLoading ? 'Loading…' : 'Nobody is connected to you yet.'}
          </p>
        )}
        {graph !== undefined && groups.length > 0 && <NetworkGraph graph={graph} legend={legend} />}
        {groups.map((members, index) => {
          const label = groupLabel(
            index,
            members.map((node) => node.name ?? SOMEONE),
          );
          return (
            <section key={members[0]?.key ?? index} aria-label={label} className='grid gap-2'>
              <h3 className='text-sm font-medium'>{label}</h3>
              <ul className='flex flex-wrap gap-2'>
                {members.map((node) => (
                  <li key={node.key}>
                    <Member node={node} />
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </CardContent>
    </Card>
  );
}
