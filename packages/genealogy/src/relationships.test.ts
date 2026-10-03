// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import type { Relationship } from './genealogyApi';
import { relationshipFor, relationshipLines } from './relationships';

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
    expect(relationshipFor('ada', 'medora', 'sibling', 'ignored')).toMatchObject({
      kind: 'sibling_of',
      discriminator: null,
    });
  });
});
