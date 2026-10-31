// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import Link from 'next/link.js';
import { type ReactElement, useId, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'zephyrex/ui/card';
import { FRIENDSHIP, type Person, useMetamours, useNetwork } from './genealogyApi';
import { NetworkGraph } from './NetworkGraph';
import { useGenealogyOptions } from './OptionsProvider';
import { fromNetwork } from './socialLayout';
import { personName } from './people';
import { personPath } from './routes';

/** "Direct ties", "Ties of ties", "3 ties away", … for a network distance. */
export function distanceTitle(distance: number): string {
  if (distance === 1) {
    return 'Direct ties';
  }
  if (distance === 2) {
    return 'Ties of ties';
  }
  return `${distance} ties away`;
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
  return (
    <Link href={personPath(id)} className='block rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted'>
      {personName(people.get(id))}
    </Link>
  );
}

/**
 * A person's polycule: everyone they reach through partnerships, or the kinds of tie the app's
 * options walk (and friendships, when asked), and their metamours, the partners' partners who are not their own partners.
 */
export function SocialCircle({ person, people }: { person: Person; people: Person[] }): ReactElement {
  const { circleKinds, legend } = useGenealogyOptions();
  const ids = { friends: useId(), ended: useId() };
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
  const groups = network.data === undefined ? [] : byDistance(network.data.members);
  const name = personName(person);
  const error = network.error ?? metamours.error;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Polycule</CardTitle>
        <CardDescription>Everyone {name} is connected to through partners, and their metamours.</CardDescription>
      </CardHeader>
      <CardContent className='grid gap-4'>
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
        {error !== undefined && (
          <p role='alert' className='text-sm text-destructive'>
            The polycule could not be loaded: {error.message}
          </p>
        )}
        {error === undefined && groups.length === 0 && (
          <p className='text-sm text-muted-foreground'>
            {network.isLoading ? 'Loading…' : `No partners are recorded for ${name}.`}
          </p>
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
