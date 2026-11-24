// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { LoadProblem } from 'zephyrex/ui/load-problem';
import { SkeletonRows } from 'zephyrex/ui/skeleton';
import { Button } from '@jgrieve/forms/components/ui/button';
import Link from 'next/link.js';
import { type ReactElement, type ReactNode, useMemo, useState } from 'react';
import { useSWRConfig } from 'swr';
import { ApiError } from 'zephyrex';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'zephyrex/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from 'zephyrex/ui/dialog';
import { FRIENDSHIP, type LinkedNetwork, PARTNERSHIP, PERSON_ENDPOINT, useLinkedNetwork, usePersons } from './genealogyApi';
import { type LegendEntry, TIE_LEGEND } from './legend';
import { NetworkGraph } from './NetworkGraph';
import { AddRelative } from './Relatives';
import { personHue, personInitials } from './people';
import { personPath } from './routes';
import { StartWithYou } from './StartWithYou';
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

/** A member's face: their initials on a colour that follows them (their record, else their place). */
function MemberAvatar({ node }: { node: LinkedNode }): ReactElement {
  const known = node.person_id !== null;
  return (
    <span
      aria-hidden='true'
      className={`inline-flex size-7 shrink-0 items-center justify-center rounded-full text-[0.65rem] font-semibold ${known ? 'text-white' : 'border border-dashed text-muted-foreground'}`}
      style={
        known ? { backgroundColor: `hsl(${String(personHue({ id: node.person_id ?? node.key }))} 55% 30%)` } : undefined
      }
    >
      {known ? personInitials({ name: node.name ?? SOMEONE }) : '?'}
    </span>
  );
}

/**
 * How a member joins the network, read off the tie to someone one step nearer the centre:
 * "Dating · you", "Dating · Alex Chen". Null when no such tie is in the map.
 */
export function linkOf(linked: LinkedNetwork, node: LinkedNode): string | null {
  const byKey = new Map(linked.nodes.map((other) => [other.key, other]));
  for (const tie of linked.ties) {
    const otherKey = tie.source === node.key ? tie.target : tie.target === node.key ? tie.source : null;
    if (otherKey === null) {
      continue;
    }
    const other = byKey.get(otherKey);
    const nearer = otherKey === linked.center || (other !== undefined && other.distance < node.distance);
    if (!nearer) {
      continue;
    }
    const how = (tie.discriminator ?? tie.kind).replace(/_/g, ' ');
    const whom = otherKey === linked.center ? 'you' : (other?.name ?? SOMEONE);
    return `${how.charAt(0).toUpperCase()}${how.slice(1)} · ${whom}`;
  }
  return null;
}

function Member({ node, link }: { node: LinkedNode; link: string | null }): ReactElement {
  const name = node.name ?? SOMEONE;
  const text = (
    <span className='grid min-w-0 leading-tight'>
      <span className='truncate'>{name}</span>
      {link !== null && <span className='truncate text-xs font-normal text-muted-foreground'>{link}</span>}
    </span>
  );
  return node.person_id === null ? (
    <span className='flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground'>
      <MemberAvatar node={node} />
      {text}
    </span>
  ) : (
    <Link
      href={personPath(node.person_id)}
      className='flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-muted'
    >
      <MemberAvatar node={node} />
      {text}
    </Link>
  );
}

const NOT_FOUND = 404;

/**
 * What the map says instead of drawing: the start for a user with no record of themselves, a load
 * failure, or that nobody is connected yet (with the form to add someone beneath it).
 */
function NetworkStatus({
  linked,
  empty,
}: {
  linked: ReturnType<typeof useLinkedNetwork>;
  empty: boolean;
}): ReactElement | null {
  const { error } = linked;
  if (error instanceof ApiError && error.status === NOT_FOUND) {
    return <StartWithYou onStarted={async () => linked.mutate()} />;
  }
  if (error !== undefined) {
    return <LoadProblem what='the network' error={error} onRetry={async () => linked.mutate()} />;
  }
  return empty ? (
    linked.isLoading ? (
      <SkeletonRows rows={3} avatar label='Loading your polycules' />
    ) : (
      <p className='text-sm text-muted-foreground'>Nobody is connected to you yet.</p>
    )
  ) : null;
}

/** Which ties the map walks beyond its own kinds: friendships, and relationships that have ended. */
function MapFilters({
  throughFriends,
  includeEnded,
  onThroughFriends,
  onIncludeEnded,
}: {
  throughFriends: boolean;
  includeEnded: boolean;
  onThroughFriends: (on: boolean) => void;
  onIncludeEnded: (on: boolean) => void;
}): ReactElement {
  const chip =
    'rounded-full border px-3 py-1 text-sm transition-colors hover:bg-muted aria-pressed:border-primary aria-pressed:bg-primary/10 aria-pressed:text-foreground text-muted-foreground';
  return (
    <fieldset aria-label='Show on the map' className='min-w-0 flex flex-wrap gap-2'>
      <button type='button' aria-pressed={throughFriends} className={chip} onClick={() => onThroughFriends(!throughFriends)}>
        Through friends
      </button>
      <button type='button' aria-pressed={includeEnded} className={chip} onClick={() => onIncludeEnded(!includeEnded)}>
        Past relationships
      </button>
    </fieldset>
  );
}

/**
 * Adding the people the user is connected to, from the map itself: someone new by name or someone
 * already recorded, tied to the user's own record. Without it a new map is a dead end.
 */
function AddToMap({ centre, inline }: { centre: string | null; inline: boolean }): ReactElement | null {
  const persons = usePersons();
  const { mutate } = useSWRConfig();
  const [open, setOpen] = useState(false);
  const own = persons.data?.find((person) => person.id === centre);
  if (own === undefined) {
    return null;
  }
  const form = (
    <AddRelative
      person={own}
      people={persons.data ?? []}
      onAdded={async () => {
        setOpen(false);
        // The people, the map and every other walk over the ties are now stale.
        await mutate((key) => typeof key === 'string' && key.includes(PERSON_ENDPOINT));
      }}
    />
  );
  // Before anyone is connected the form is the page's next step, so it stays in view.
  if (inline) {
    return (
      <section aria-label='Add someone you are connected to' className='grid gap-2 rounded-md border p-4'>
        <h3 className='text-sm font-medium'>Add someone you are connected to</h3>
        {form}
      </section>
    );
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add connection</Button>
      </DialogTrigger>
      <DialogContent aria-label='Add someone you are connected to'>
        <DialogHeader>
          <DialogTitle>Add someone you are connected to</DialogTitle>
          <DialogDescription>Someone already recorded, or someone new. They do not need to be on the app.</DialogDescription>
        </DialogHeader>
        {form}
      </DialogContent>
    </Dialog>
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
  const [throughFriends, setThroughFriends] = useState(false);
  const [includeEnded, setIncludeEnded] = useState(false);
  const linked = useLinkedNetwork({
    kinds: throughFriends ? [...kinds, FRIENDSHIP] : kinds,
    includeEnded,
  });
  const graph = useMemo(() => (linked.data === undefined ? undefined : fromLinkedNetwork(linked.data)), [linked.data]);
  const groups = linked.data === undefined ? [] : byGroup(linked.data);
  const centre = linked.data?.nodes.find((node) => node.key === linked.data?.center)?.person_id ?? null;

  return (
    <Card>
      {title !== null && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      )}
      <CardContent className={title === null ? 'grid gap-4 pt-(--card-p)' : 'grid gap-4'}>
        {linked.data !== undefined && (
          <div className='flex flex-wrap items-center justify-between gap-3'>
            {/* The filters, once there is a map to filter (and while one is on, even if it empties it). */}
            {groups.length > 0 || throughFriends || includeEnded ? (
              <MapFilters
                throughFriends={throughFriends}
                includeEnded={includeEnded}
                onThroughFriends={setThroughFriends}
                onIncludeEnded={setIncludeEnded}
              />
            ) : (
              <span />
            )}
            {groups.length > 0 && <AddToMap centre={centre} inline={false} />}
          </div>
        )}
        <NetworkStatus linked={linked} empty={groups.length === 0} />
        {linked.data !== undefined && groups.length === 0 && <AddToMap centre={centre} inline />}
        {/* On a wide screen the polycules sit beside the map, a list to read it by. */}
        <div className={groups.length > 0 ? 'grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_17rem]' : 'contents'}>
          {graph !== undefined && groups.length > 0 && <NetworkGraph graph={graph} legend={legend} />}
          {groups.length > 0 && (
            <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-1'>
              {groups.map((members, index) => {
                const label = groupLabel(
                  index,
                  members.map((node) => node.name ?? SOMEONE),
                );
                return (
                  <section
                    key={members[0]?.key ?? index}
                    aria-label={label}
                    className='grid content-start gap-1 rounded-lg border p-3'
                  >
                    <h3 className='flex items-baseline justify-between gap-2 px-2 text-sm font-semibold'>
                      {label}
                      <span className='text-xs font-normal tabular-nums text-muted-foreground'>
                        {String(members.length)}
                      </span>
                    </h3>
                    <ul className='grid'>
                      {members.map((node) => (
                        <li key={node.key}>
                          <Member node={node} link={linked.data === undefined ? null : linkOf(linked.data, node)} />
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
