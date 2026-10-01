// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Lineage, Person } from './genealogyApi';

const DATE_CHARS = 10;
const YEAR_CHARS = 4;

/** A person's name as shown, or a placeholder for a record without one. */
export const personName = (person: Pick<Person, 'name'> | undefined): string =>
  person?.name === null || person?.name === undefined || person.name.trim() === '' ? 'Unnamed person' : person.name;

/** The date part of a server datetime ("1900-03-12T00:00:00" → "1900-03-12"), as a date input holds it. */
export const dateInput = (value: string | null): string => (value === null ? '' : value.slice(0, DATE_CHARS));

/** A date input's value as the server takes it: the date, or null when it is empty. */
export const dateField = (value: string): string | null => (value === '' ? null : value);

/** "1900–1975", "b. 1900", "d. 1975", or '' when neither year is known. */
export function lifeSpan({ birth_date: birth, death_date: death }: Pick<Person, 'birth_date' | 'death_date'>): string {
  const born = birth === null ? '' : birth.slice(0, YEAR_CHARS);
  const died = death === null ? '' : death.slice(0, YEAR_CHARS);
  if (born !== '' && died !== '') {
    return `${born}–${died}`;
  }
  return born !== '' ? `b. ${born}` : died !== '' ? `d. ${died}` : '';
}

/** A walk's relatives grouped by generation, nearest first. */
export function byGeneration(lineage: Lineage): { generation: number; personIds: string[] }[] {
  const groups = new Map<number, string[]>();
  for (const { person_id: personId, generation } of lineage.relatives) {
    groups.set(generation, [...(groups.get(generation) ?? []), personId]);
  }
  return [...groups.entries()].sort(([a], [b]) => a - b).map(([generation, personIds]) => ({ generation, personIds }));
}

/** "Parents", "Grandparents", "Great-grandparents", "2× great-grandparents" (or the children's equivalents). */
export function generationTitle(generation: number, direction: 'ancestors' | 'descendants'): string {
  const [one, many] = direction === 'ancestors' ? ['Parents', 'parents'] : ['Children', 'children'];
  if (generation <= 1) {
    return one;
  }
  const greats = generation - 2;
  const prefix = greats === 0 ? 'Grand' : greats === 1 ? 'Great-grand' : `${greats}× great-grand`;
  return `${prefix}${many}`;
}
