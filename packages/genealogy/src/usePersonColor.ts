// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { personTone, personToneClass, personTones } from 'zephyrex/ui/person-tone';
import { usePersons } from './genealogyApi';

/**
 * Each person's colour, assigned across the whole tree, so the people one view shows side by side
 * (a list, a graph, someone's connections) don't share one while the tree has eight or fewer, and a
 * person keeps the same colour on every page. Someone not in the tree yet keeps their own colour.
 */
export function usePersonColor(): (id: string) => string {
  const persons = usePersons();
  // By id, so the assignment doesn't change with the order a page lists people in.
  const tones = personTones((persons.data ?? []).map((person) => person.id).sort());
  return (id) => personToneClass(tones.get(id) ?? personTone(id));
}
