// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import type { Kinship } from './genealogyApi';
import { describeKinship, kinshipLabel } from './kinship';

const UNRELATED: Kinship = {
  related: false,
  common_ancestors: [],
  up_from_person: null,
  up_from_other: null,
  degree: null,
  cousin: null,
  removed: null,
  lineal: null,
};

/** A related pair `up` generations above the first person and `down` above the other. */
const pair = (up: number, down: number): Kinship => {
  const lineal = up === 0 || down === 0;
  return {
    related: true,
    common_ancestors: ['a'],
    up_from_person: up,
    up_from_other: down,
    degree: up + down,
    cousin: lineal ? 0 : Math.min(up, down) - 1,
    removed: Math.abs(up - down),
    lineal,
  };
};

describe('kinshipLabel', () => {
  it('names direct ancestors and descendants', () => {
    expect(kinshipLabel(pair(1, 0))).toBe('parent');
    expect(kinshipLabel(pair(2, 0))).toBe('grandparent');
    expect(kinshipLabel(pair(3, 0))).toBe('great-grandparent');
    expect(kinshipLabel(pair(5, 0))).toBe('3× great-grandparent');
    expect(kinshipLabel(pair(0, 1))).toBe('child');
    expect(kinshipLabel(pair(0, 2))).toBe('grandchild');
    expect(kinshipLabel(pair(0, 3))).toBe('great-grandchild');
  });

  it('names siblings, aunts and uncles, nieces and nephews', () => {
    expect(kinshipLabel(pair(1, 1))).toBe('sibling');
    expect(kinshipLabel(pair(2, 1))).toBe('aunt or uncle');
    expect(kinshipLabel(pair(3, 1))).toBe('great-aunt or uncle');
    expect(kinshipLabel(pair(4, 1))).toBe('2× great-aunt or uncle');
    expect(kinshipLabel(pair(1, 2))).toBe('niece or nephew');
    expect(kinshipLabel(pair(1, 3))).toBe('great-niece or nephew');
  });

  it('names cousins by degree and removal', () => {
    expect(kinshipLabel(pair(2, 2))).toBe('first cousin');
    expect(kinshipLabel(pair(3, 3))).toBe('second cousin');
    expect(kinshipLabel(pair(3, 2))).toBe('first cousin once removed');
    expect(kinshipLabel(pair(2, 4))).toBe('first cousin twice removed');
    expect(kinshipLabel(pair(5, 2))).toBe('first cousin 3 times removed');
    expect(kinshipLabel(pair(13, 13))).toBe('12th cousin');
    expect(kinshipLabel(pair(22, 22))).toBe('21st cousin');
    expect(kinshipLabel(pair(23, 23))).toBe('22nd cousin');
    expect(kinshipLabel(pair(24, 24))).toBe('23rd cousin');
  });

  it('has no label for the same person or an unrelated pair', () => {
    expect(kinshipLabel(pair(0, 0))).toBeNull();
    expect(kinshipLabel(UNRELATED)).toBeNull();
  });
});

describe('describeKinship', () => {
  it('says what the relative is to the person', () => {
    expect(describeKinship(pair(0, 2), 'Byron', 'Ada')).toBe('Ada is Byron’s grandchild.');
    expect(describeKinship(pair(3, 2), 'Ada', 'Augusta')).toBe('Augusta is Ada’s first cousin once removed.');
  });

  it('says when they are the same person, or share no recorded ancestor', () => {
    expect(describeKinship(pair(0, 0), 'Ada', 'Ada')).toBe('Ada and Ada are the same person.');
    expect(describeKinship(UNRELATED, 'Ada', 'Mary')).toBe('Ada and Mary share no recorded ancestor.');
  });
});
