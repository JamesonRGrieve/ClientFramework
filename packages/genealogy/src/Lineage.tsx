// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { chipGroup } from 'zephyrex/hooks/chipKeys';
import Link from 'next/link.js';
import { type ReactElement, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'zephyrex/ui/card';
import { ANCESTRY_ROLES, type LineageDirection, type Person, useLineage } from './genealogyApi';
import { byGeneration, generationTitle, lifeSpan, personName } from './people';
import { personPath } from './routes';

const MOST_GENERATIONS_OFFERED = 5;
const GENERATION_CHOICES = Array.from({ length: MOST_GENERATIONS_OFFERED }, (_, index) => index + 1);

/** A person's family tree up (ancestors) or down (descendants), generation by generation. */
export function Lineage({ person, people }: { person: Person; people: Person[] }): ReactElement {
  const [direction, setDirection] = useState<LineageDirection>('ancestors');
  const [generations, setGenerations] = useState<number | undefined>(undefined);
  const [roles, setRoles] = useState<string[]>([]);
  const lineage = useLineage(person.id, direction, { generations, roles });
  const groups = lineage.data === undefined ? [] : byGeneration(lineage.data);
  const lookup = new Map(people.map((candidate) => [candidate.id, candidate]));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Family tree</CardTitle>
        <CardDescription>{personName(person)}’s ancestors or descendants, nearest generation first.</CardDescription>
      </CardHeader>
      <CardContent className='grid gap-4'>
        <div className='flex flex-wrap items-end gap-3'>
          <fieldset className='grid min-w-0 gap-1.5'>
            <legend className='mb-1.5 text-sm font-medium'>Show</legend>
            <div className='inline-flex w-fit rounded-full border p-0.5' ref={chipGroup}>
              {(['ancestors', 'descendants'] as const).map((choice) => (
                <button
                  key={choice}
                  type='button'
                  aria-pressed={direction === choice}
                  onClick={() => setDirection(choice)}
                  className='rounded-full px-3 py-1 text-sm text-muted-foreground transition-colors aria-pressed:bg-primary aria-pressed:text-primary-foreground'
                >
                  {choice === 'ancestors' ? 'Ancestors' : 'Descendants'}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset className='grid min-w-0 gap-1.5'>
            <legend className='mb-1.5 text-sm font-medium'>Generations</legend>
            <div className='inline-flex w-fit rounded-full border p-0.5' ref={chipGroup}>
              {[undefined, ...GENERATION_CHOICES].map((count) => (
                <button
                  key={count ?? 'all'}
                  type='button'
                  aria-pressed={generations === count}
                  onClick={() => setGenerations(count)}
                  className='min-w-8 rounded-full px-2.5 py-1 text-sm tabular-nums text-muted-foreground transition-colors aria-pressed:bg-primary aria-pressed:text-primary-foreground'
                >
                  {count ?? 'All'}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset className='flex flex-wrap gap-3 text-sm'>
            <legend className='mb-1 text-sm font-medium'>Through parents who are (all when none is ticked)</legend>
            {ANCESTRY_ROLES.map((role) => (
              <label key={role} className='flex items-center gap-1.5 capitalize'>
                <input
                  type='checkbox'
                  className='size-4 accent-primary'
                  checked={roles.includes(role)}
                  onChange={(event) =>
                    setRoles(event.target.checked ? [...roles, role] : roles.filter((chosen) => chosen !== role))
                  }
                />
                {role.replaceAll('_', ' ')}
              </label>
            ))}
          </fieldset>
        </div>
        {lineage.error !== undefined && (
          <p role='alert' className='text-sm text-destructive'>
            The family tree could not be loaded: {lineage.error.message}
          </p>
        )}
        {lineage.error === undefined && groups.length === 0 && (
          <p className='text-sm text-muted-foreground'>
            {lineage.isLoading ? 'Loading…' : `No ${direction} are recorded for ${personName(person)}.`}
          </p>
        )}
        {groups.map(({ generation, personIds }) => (
          <section key={generation} aria-label={generationTitle(generation, direction)} className='grid gap-2'>
            <h3 className='text-sm font-medium'>{generationTitle(generation, direction)}</h3>
            <ul className='flex flex-wrap gap-2'>
              {personIds.map((relativeId) => {
                const relative = lookup.get(relativeId);
                return (
                  <li key={relativeId}>
                    <Link href={personPath(relativeId)} className='block rounded-md border px-3 py-2 text-sm hover:bg-muted'>
                      <span className='font-medium'>{personName(relative)}</span>
                      {relative !== undefined && lifeSpan(relative) !== '' && (
                        <span className='block text-muted-foreground'>{lifeSpan(relative)}</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </CardContent>
    </Card>
  );
}
