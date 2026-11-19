// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { LoadProblem } from 'zephyrex/ui/load-problem';
import { SkeletonRows } from 'zephyrex/ui/skeleton';
import Link from 'next/link.js';
import { useUser } from 'zephyrex';
import { type ReactElement, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'zephyrex/ui/card';
import { FRIENDSHIP, type Person, useMetamours, useNetwork } from './genealogyApi';
import { NetworkGraph } from './NetworkGraph';
import { useGenealogyOptions } from './OptionsProvider';
import { fromNetwork } from './socialLayout';
import { personHue, personInitials, personName } from './people';
import { personPath } from './routes';

/** "Directly connected", "Two steps away", "3 steps away", … for a network distance. */
export function distanceTitle(distance: number): string {
  if (distance === 1) {
    return 'Directly connected';
  }
  if (distance === 2) {
    return 'Two steps away';
  }
  return `${String(distance)} steps away`;
}

/** Network members grouped by distance, nearest first, each group in the server's order. */
export function byDistance(
  members: readonly { person_id: string; distance: number }[],
): { distance: number; personIds: string[] }[] {
  const groups = new Map<number, string[]>();
  for (const member of members) {
    groups.set(member.distance, [...(groups.get(member.distance) ?? []), member.person_id]);
  }
  return [...groups.entries()].sort(([a], [b]) => a - b).map(([distance, personIds]) => ({ distance, personIds }));
}

function PersonLink({ id, people }: { id: string; people: ReadonlyMap<string, Person> }): ReactElement {
  const person = people.get(id);
  return (
    <Link
      href={personPath(id)}
      className='flex items-center gap-2 rounded-full border py-1 pr-3 pl-1 text-sm font-medium hover:bg-muted'
    >
      <span
        aria-hidden='true'
        className='inline-flex size-6 shrink-0 items-center justify-center rounded-full text-[0.6rem] font-semibold text-white'
        style={{ backgroundColor: `hsl(${String(personHue({ id }))} 55% 30%)` }}
      >
        {personInitials(person)}
      </span>
      {personName(person)}
    </Link>
  );
}

const CHIP =
  'rounded-full border px-3 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted aria-pressed:border-primary aria-pressed:bg-primary/10 aria-pressed:text-foreground';

/**
 * A person's polycule: everyone they reach through partnerships, or the kinds of tie the app's
 * options walk (and friendships, when asked), and their metamours, the partners' partners who are not their own partners.
 */
export function SocialCircle({ person, people }: { person: Person; people: Person[] }): ReactElement {
  const { circleKinds, legend } = useGenealogyOptions();
  const me = useUser().data?.id;
  const [throughFriends, setThroughFriends] = useState(false);
  const [includeEnded, setIncludeEnded] = useState(false);
  const kinds = throughFriends ? [...circleKinds, FRIENDSHIP] : circleKinds;
  const network = useNetwork(person.id, { kinds, includeEnded });
  const metamours = useMetamours(person.id, includeEnded);
  const lookup = useMemo(() => new Map(people.map((candidate) => [candidate.id, candidate])), [people]);
  // The graph lays itself out once per network, not on every render.
  const graph = useMemo(
    () => (network.data === undefined ? undefined : fromNetwork(network.data, lookup)),
    [network.data, lookup],
  );
  // Metamours have their own list, naming who they come through; the distances list everyone else.
  const metamourIds = new Set(metamours.data?.metamours.map((metamour) => metamour.person_id) ?? []);
  const groups =
    network.data === undefined
      ? []
      : byDistance(network.data.members.filter((member) => !metamourIds.has(member.person_id)));
  const name = personName(person);
  const isYou = me !== undefined && person.linked_user_id === me;
  const error = network.error ?? metamours.error;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Polycule</CardTitle>
        <CardDescription>
          Everyone {isYou ? 'you are' : `${name} is`} connected to through partners, and their metamours.
        </CardDescription>
      </CardHeader>
      <CardContent className='grid gap-4'>
        <fieldset aria-label='Show in the polycule' className='min-w-0 flex flex-wrap gap-2'>
          <button
            type='button'
            aria-pressed={throughFriends}
            className={CHIP}
            onClick={() => setThroughFriends(!throughFriends)}
          >
            Through friendships too
          </button>
          <button type='button' aria-pressed={includeEnded} className={CHIP} onClick={() => setIncludeEnded(!includeEnded)}>
            Include ended relationships
          </button>
        </fieldset>
        {error !== undefined && <LoadProblem what='the polycule' error={error} />}
        {error === undefined && groups.length === 0 && network.isLoading && (
          <SkeletonRows rows={3} avatar label='Loading the polycule' />
        )}
        {error === undefined && groups.length === 0 && !network.isLoading && (
          <p className='text-sm text-muted-foreground'>No partners are recorded for {name}.</p>
        )}
        {graph !== undefined && groups.length > 0 && <NetworkGraph graph={graph} legend={legend} />}
        {groups.map(({ distance, personIds }) => (
          <section key={distance} aria-label={distanceTitle(distance)} className='grid gap-2'>
            <h3 className='text-sm font-medium'>{distanceTitle(distance)}</h3>
            <ul className='flex flex-wrap gap-2'>
              {personIds.map((id) => (
                <li key={id}>
                  <PersonLink id={id} people={lookup} />
                </li>
              ))}
            </ul>
          </section>
        ))}
        {(metamours.data?.metamours.length ?? 0) > 0 && (
          <section aria-label='Metamours' className='grid gap-2'>
            <h3 className='text-sm font-medium'>Metamours</h3>
            <ul className='grid gap-2'>
              {metamours.data?.metamours.map((metamour) => (
                <li key={metamour.person_id} className='flex flex-wrap items-center gap-2 text-sm'>
                  <PersonLink id={metamour.person_id} people={lookup} />
                  <span className='text-muted-foreground'>
                    through {metamour.via.map((partner) => personName(lookup.get(partner))).join(', ')}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </CardContent>
    </Card>
  );
}
