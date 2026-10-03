// SPDX-License-Identifier: AGPL-3.0-or-later
import { ANCESTRY, PARTNERSHIP, type Relationship, type RelationshipFields, SIBLING_OF } from './genealogyApi';

/** One of a person's relationships as their page lists it: who the relative is, and what to them. */
export interface RelationshipLine {
  /** The rows behind the line; deleting the line deletes all of them, each guarded by its version. */
  relationships: Relationship[];
  relativeId: string;
  /** "Parent", "Child", "Partner", "Sibling", or the raw kind for another extension's. */
  role: string;
  /** The discriminator (e.g. "adopted", "marriage"), when one is recorded. */
  detail: string | null;
}

const ROLE_AS_SUBJECT = new Map([
  [ANCESTRY, 'Child'],
  [PARTNERSHIP, 'Partner'],
  [SIBLING_OF, 'Sibling'],
]);
const ROLE_AS_OBJECT = new Map([
  [ANCESTRY, 'Parent'],
  [PARTNERSHIP, 'Partner'],
  [SIBLING_OF, 'Sibling'],
]);

/** Kinds stored the same both ways, which the page shows once per relative. */
const SYMMETRIC = new Set([PARTNERSHIP, SIBLING_OF]);

/**
 * A person's relationships, described from their side. `asSubject` are the rows with them as
 * `person_id` (so for ancestry, the relative is their child), and `asObject` those with them as
 * `target_person_id` (the relative is their parent). A symmetric kind recorded both ways is one line.
 */
export function relationshipLines(asSubject: Relationship[], asObject: Relationship[]): RelationshipLine[] {
  const lines = new Map<string, RelationshipLine>();
  const add = (row: Relationship, relativeId: string, roles: Map<string, string>): void => {
    const symmetric = SYMMETRIC.has(row.kind);
    const key = symmetric ? `${row.kind}|${row.discriminator ?? ''}|${relativeId}` : row.id;
    const existing = lines.get(key);
    if (existing !== undefined) {
      existing.relationships.push(row);
      return;
    }
    lines.set(key, {
      relationships: [row],
      relativeId,
      role: roles.get(row.kind) ?? row.kind,
      detail: row.discriminator,
    });
  };
  for (const row of asSubject) {
    add(row, row.target_person_id, ROLE_AS_SUBJECT);
  }
  for (const row of asObject) {
    add(row, row.person_id, ROLE_AS_OBJECT);
  }
  return [...lines.values()];
}

/** What a person can record about a relative on their page. */
export type RelativeRole = 'parent' | 'child' | 'partner' | 'sibling';

/**
 * The row to store for "`relativeId` is `personId`'s `role`" (a partnership is mirrored when it is
 * stored). `detail` is the parent's role for ancestry, or the kind of partnership.
 */
export function relationshipFor(
  personId: string,
  relativeId: string,
  role: RelativeRole,
  detail: string | null,
): RelationshipFields {
  switch (role) {
    case 'parent':
      return { person_id: relativeId, target_person_id: personId, kind: ANCESTRY, discriminator: detail };
    case 'child':
      return { person_id: personId, target_person_id: relativeId, kind: ANCESTRY, discriminator: detail };
    case 'partner':
      return { person_id: personId, target_person_id: relativeId, kind: PARTNERSHIP, discriminator: detail };
    case 'sibling':
      return { person_id: personId, target_person_id: relativeId, kind: SIBLING_OF, discriminator: null };
  }
}
