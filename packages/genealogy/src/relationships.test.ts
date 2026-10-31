// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import type { Relationship } from './genealogyApi';
import { appTieFor, hasEnded, relationshipFor, relationshipLines } from './relationships';

const row = (id: string, from: string, to: string, kind: string, discriminator: string | null = null): Relationship => ({
  id,
  person_id: from,
  target_person_id: to,
  kind,
  discriminator,
  intensity: null,
  qualifier: null,
  valid_from: null,
  valid_to: null,
  notes: null,
});

describe('relationshipLines', () => {
  it("describes ancestry from the person's side: their children and their parents", () => {
    const child = row('r1', 'ada', 'byron-jr', 'ancestry', 'biological');
    const father = row('r2', 'byron', 'ada', 'ancestry', 'biological');
    const mother = row('r3', 'annabella', 'ada', 'ancestry');
    expect(relationshipLines([child], [father, mother])).toEqual([
      { relationships: [child], relativeId: 'byron-jr', role: 'Child', detail: 'biological' },
      { relationships: [father], relativeId: 'byron', role: 'Parent', detail: 'biological' },
      { relationships: [mother], relativeId: 'annabella', role: 'Parent', detail: null },
    ]);
  });

  it('shows a partnership recorded both ways once, carrying both rows', () => {
    const forward = row('p1', 'ada', 'william', 'partnership', 'marriage');
    const back = row('p2', 'william', 'ada', 'partnership', 'marriage');
    expect(relationshipLines([forward], [back])).toEqual([
      { relationships: [forward, back], relativeId: 'william', role: 'Partner', detail: 'marriage' },
    ]);
  });

  it('shows a friendship recorded both ways once, as a friend from either end', () => {
    const forward = row('f1', 'ben', 'fay', 'friendship', 'best_friend');
    const back = row('f2', 'fay', 'ben', 'friendship', 'best_friend');
    const colleague = row('a1', 'gus', 'ben', 'acquaintance', 'colleague');
    expect(relationshipLines([forward], [back, colleague])).toEqual([
      { relationships: [forward, back], relativeId: 'fay', role: 'Friend', detail: 'best_friend' },
      { relationships: [colleague], relativeId: 'gus', role: 'Acquaintance', detail: 'colleague' },
    ]);
  });

  it("names a sibling from either end, and keeps another extension's kind as it is", () => {
    const sibling = row('s1', 'ada', 'medora', 'sibling_of');
    const member = row('m1', 'guild', 'ada', 'member_of', 'founder');
    expect(relationshipLines([sibling], [member])).toEqual([
      { relationships: [sibling], relativeId: 'medora', role: 'Sibling', detail: null },
      { relationships: [member], relativeId: 'guild', role: 'member_of', detail: 'founder' },
    ]);
  });
});

describe('relationshipFor', () => {
  it('points ancestry from parent to child, whichever end the page is', () => {
    expect(relationshipFor('ada', 'byron', 'parent', 'biological')).toEqual({
      person_id: 'byron',
      target_person_id: 'ada',
      kind: 'ancestry',
      discriminator: 'biological',
    });
    expect(relationshipFor('ada', 'byron-jr', 'child', 'adopted')).toMatchObject({
      person_id: 'ada',
      target_person_id: 'byron-jr',
      kind: 'ancestry',
    });
  });

  it('records partners and siblings from the person', () => {
    expect(relationshipFor('ada', 'william', 'partner', 'marriage')).toMatchObject({
      person_id: 'ada',
      kind: 'partnership',
      discriminator: 'marriage',
    });
    expect(relationshipFor('ada', 'medora', 'sibling', 'half')).toMatchObject({
      kind: 'sibling_of',
      discriminator: 'half',
    });
  });

  it('records friends and acquaintances from the person, with their subkind', () => {
    expect(relationshipFor('ana', 'fay', 'friend', 'best_friend')).toEqual({
      person_id: 'ana',
      target_person_id: 'fay',
      kind: 'friendship',
      discriminator: 'best_friend',
    });
    expect(relationshipFor('ana', 'gus', 'acquaintance', null)).toMatchObject({
      kind: 'acquaintance',
      discriminator: null,
    });
  });
});

describe('hasEnded', () => {
  const NOW = new Date('2026-10-30T12:00:00Z');
  const LAST_SUMMER = '2025-06-01T00:00:00';
  const line = (...ends: (string | null)[]): Parameters<typeof hasEnded>[0] => ({
    relationships: ends.map((end, index) => ({ ...row(`r${String(index)}`, 'sam', 'dana', 'partnership'), valid_to: end })),
    relativeId: 'dana',
    role: 'Partner',
    detail: 'dating',
  });

  it('is true once every row has ended, read as UTC like the server stores it', () => {
    expect(hasEnded(line(LAST_SUMMER, LAST_SUMMER), NOW)).toBe(true);
    expect(hasEnded(line('2026-10-30T12:00:00'), NOW)).toBe(true);
  });

  it('is false while any row is open or ends later', () => {
    expect(hasEnded(line(null), NOW)).toBe(false);
    expect(hasEnded(line(LAST_SUMMER, null), NOW)).toBe(false);
    expect(hasEnded(line('2027-01-01T00:00:00'), NOW)).toBe(false);
  });
});

describe('app ties', () => {
  const dynamic = {
    kind: 'dynamic',
    objectRelative: 'Sub',
    subjectRelative: 'Dom',
    details: ['master'],
    detailLabel: 'Dynamic',
  };

  it('stores the person as the subject or the object', () => {
    expect(appTieFor('ana', 'ben', dynamic, true, 'master')).toEqual({
      person_id: 'ana',
      target_person_id: 'ben',
      kind: 'dynamic',
      discriminator: 'master',
    });
    expect(appTieFor('ana', 'ben', dynamic, false, null)).toMatchObject({ person_id: 'ben', target_person_id: 'ana' });
  });

  it('names the relative from each end', () => {
    const tie = row('d1', 'ana', 'ben', 'dynamic', 'master');
    expect(relationshipLines([tie], [], [dynamic])[0]).toMatchObject({ relativeId: 'ben', role: 'Sub', detail: 'master' });
    expect(relationshipLines([], [tie], [dynamic])[0]).toMatchObject({ relativeId: 'ana', role: 'Dom' });
    expect(relationshipLines([tie], [])[0]?.role).toBe('dynamic');
  });
});
