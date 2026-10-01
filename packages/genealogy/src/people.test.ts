// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { byGeneration, dateField, dateInput, generationTitle, lifeSpan, personName } from './people';

const UNNAMED = 'Unnamed person';
const DATE = '1900-03-12';

describe('personName', () => {
  it('is the name, or a placeholder for a nameless record', () => {
    expect(personName({ name: 'Ada Lovelace' })).toBe('Ada Lovelace');
    expect(personName({ name: null })).toBe(UNNAMED);
    expect(personName({ name: '  ' })).toBe(UNNAMED);
    expect(personName(undefined)).toBe(UNNAMED);
  });
});

describe('dateInput and dateField', () => {
  it('carry a server datetime into a date input and back', () => {
    expect(dateInput(`${DATE}T00:00:00`)).toBe(DATE);
    expect(dateInput(null)).toBe('');
    expect(dateField(DATE)).toBe(DATE);
    expect(dateField('')).toBeNull();
  });
});

describe('lifeSpan', () => {
  it('shows the years that are known', () => {
    expect(lifeSpan({ birth_date: '1815-12-10T00:00:00', death_date: '1852-11-27T00:00:00' })).toBe('1815–1852');
    expect(lifeSpan({ birth_date: '1815-12-10T00:00:00', death_date: null })).toBe('b. 1815');
    expect(lifeSpan({ birth_date: null, death_date: '1852-11-27T00:00:00' })).toBe('d. 1852');
    expect(lifeSpan({ birth_date: null, death_date: null })).toBe('');
  });
});

describe('byGeneration', () => {
  it('groups a walk by generation, nearest first', () => {
    expect(
      byGeneration({
        person_id: 'me',
        relatives: [
          { person_id: 'grandma', generation: 2 },
          { person_id: 'mum', generation: 1 },
          { person_id: 'grandpa', generation: 2 },
        ],
      }),
    ).toEqual([
      { generation: 1, personIds: ['mum'] },
      { generation: 2, personIds: ['grandma', 'grandpa'] },
    ]);
    expect(byGeneration({ person_id: 'me', relatives: [] })).toEqual([]);
  });
});

describe('generationTitle', () => {
  it('names each generation up or down', () => {
    expect(generationTitle(1, 'ancestors')).toBe('Parents');
    expect(generationTitle(2, 'ancestors')).toBe('Grandparents');
    expect(generationTitle(3, 'ancestors')).toBe('Great-grandparents');
    expect(generationTitle(4, 'ancestors')).toBe('2× great-grandparents');
    expect(generationTitle(1, 'descendants')).toBe('Children');
    expect(generationTitle(3, 'descendants')).toBe('Great-grandchildren');
  });
});
