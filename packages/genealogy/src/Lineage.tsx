// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { Label } from '@jgrieve/forms/components/ui/label';
import Link from 'next/link.js';
import { type ReactElement, useId, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'zephyrex/ui/card';
import { ANCESTRY_ROLES, type LineageDirection, type Person, useLineage } from './genealogyApi';
import { byGeneration, generationTitle, lifeSpan, personName } from './people';
import { personPath } from './routes';

const MOST_GENERATIONS_OFFERED = 5;
const GENERATION_CHOICES = Array.from({ length: MOST_GENERATIONS_OFFERED }, (_, index) => index + 1);
const SELECT_CLASS = 'h-9 rounded-md border bg-background px-3 text-sm';

/** A person's family tree up (ancestors) or down (descendants), generation by generation. */
export function Lineage({ person, people }: { person: Person; people: Person[] }): ReactElement {
  const ids = { direction: useId(), generations: useId() };
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
          <div className='grid gap-1'>
            <Label htmlFor={ids.direction}>Show</Label>
            <select
              id={ids.direction}
              value={direction}
              onChange={(event) => setDirection(event.target.value === 'descendants' ? 'descendants' : 'ancestors')}
              className={SELECT_CLASS}
            >
              <option value='ancestors'>Ancestors</option>
              <option value='descendants'>Descendants</option>
            </select>
          </div>
          <div className='grid gap-1'>
            <Label htmlFor={ids.generations}>Generations</Label>
            <select
              id={ids.generations}
              value={generations ?? ''}
              onChange={(event) => setGenerations(event.target.value === '' ? undefined : Number(event.target.value))}
              className={SELECT_CLASS}
            >
              <option value=''>All</option>
              {GENERATION_CHOICES.map((count) => (
                <option key={count} value={count}>
                  {count}
                </option>
              ))}
            </select>
          </div>
          <fieldset className='flex flex-wrap gap-3 text-sm'>
            <legend className='mb-1 text-sm font-medium'>Through parents who are (all when none is ticked)</legend>
            {ANCESTRY_ROLES.map((role) => (
              <label key={role} className='flex items-center gap-1'>
                <input
                  type='checkbox'
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
