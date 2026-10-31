// SPDX-License-Identifier: AGPL-3.0-or-later
import {
  ACQUAINTANCE,
  ANCESTRY,
  FRIENDSHIP,
  MENTORSHIP,
  PARTNERSHIP,
  type Relationship,
  type RelationshipFields,
  SIBLING_OF,
  SYMMETRIC_KINDS,
} from './genealogyApi';
import type { AppTie } from './options';

/** One of a person's relationships as their page lists it: who the relative is, and what to them. */
export interface RelationshipLine {
  /** The rows behind the line; deleting the line deletes all of them, each guarded by its version. */
  relationships: Relationship[];
  relativeId: string;
  /** "Parent", "Child", "Partner", "Sibling", "Friend", "Acquaintance", or the raw kind for another extension's. */
  role: string;
  /** The discriminator (e.g. "adopted", "marriage"), when one is recorded. */
  detail: string | null;
}

/** What a relative of a symmetric kind is, from either end. */
const SYMMETRIC_ROLES: [string, string][] = [
  [PARTNERSHIP, 'Partner'],
  [SIBLING_OF, 'Sibling'],
  [FRIENDSHIP, 'Friend'],
  [ACQUAINTANCE, 'Acquaintance'],
];
// A directed kind names the relative by which end they are: as the object, a mentor's student.
const ROLE_AS_SUBJECT = new Map([[ANCESTRY, 'Child'], [MENTORSHIP, 'Student'], ...SYMMETRIC_ROLES]);
const ROLE_AS_OBJECT = new Map([[ANCESTRY, 'Parent'], [MENTORSHIP, 'Mentor'], ...SYMMETRIC_ROLES]);

/** Kinds stored the same both ways, which the page shows once per relative. */
const SYMMETRIC = new Set<string>(SYMMETRIC_KINDS);

/**
 * A person's relationships, described from their side. `asSubject` are the rows with them as
 * `person_id` (so for ancestry, the relative is their child), and `asObject` those with them as
 * `target_person_id` (the relative is their parent). A symmetric kind recorded both ways is one line.
 * `ties` names the relatives of the kinds an app adds.
 */
export function relationshipLines(
  asSubject: Relationship[],
  asObject: Relationship[],
  ties: readonly AppTie[] = [],
): RelationshipLine[] {
  const lines = new Map<string, RelationshipLine>();
  const asSubjectRoles = new Map([
    ...ROLE_AS_SUBJECT,
    ...ties.map((tie): [string, string] => [tie.kind, tie.objectRelative]),
  ]);
  const asObjectRoles = new Map([
    ...ROLE_AS_OBJECT,
    ...ties.map((tie): [string, string] => [tie.kind, tie.subjectRelative]),
  ]);
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
    add(row, row.target_person_id, asSubjectRoles);
  }
  for (const row of asObject) {
    add(row, row.person_id, asObjectRoles);
  }
  return [...lines.values()];
}

/** Whether every row behind `line` has a `valid_to` at or before `now`: a tie that has ended. */
export function hasEnded(line: RelationshipLine, now: Date): boolean {
  return line.relationships.every((row) => row.valid_to !== null && new Date(`${row.valid_to}Z`) <= now);
}

/** What a person can record about a relative on their page. */
export type RelativeRole = 'parent' | 'child' | 'partner' | 'sibling' | 'friend' | 'acquaintance' | 'mentor' | 'student';

/**
 * The row to store for "`relativeId` is `personId`'s `role`" (a symmetric kind is mirrored when it
 * is stored). `detail` is the parent's role for ancestry, or the subkind of a symmetric tie.
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
      return { person_id: personId, target_person_id: relativeId, kind: SIBLING_OF, discriminator: detail };
    case 'friend':
      return { person_id: personId, target_person_id: relativeId, kind: FRIENDSHIP, discriminator: detail };
    case 'acquaintance':
      return { person_id: personId, target_person_id: relativeId, kind: ACQUAINTANCE, discriminator: detail };
    case 'mentor':
      return { person_id: relativeId, target_person_id: personId, kind: MENTORSHIP, discriminator: detail };
    case 'student':
      return { person_id: personId, target_person_id: relativeId, kind: MENTORSHIP, discriminator: detail };
  }
}

/**
 * The row to store for an app's directed `tie` between `personId` and `relativeId`: with the person
 * as its subject (the relative is the tie's `objectRelative`), or as its object.
 */
export function appTieFor(
  personId: string,
  relativeId: string,
  tie: AppTie,
  personIsSubject: boolean,
  detail: string | null,
): RelationshipFields {
  return personIsSubject
    ? { person_id: personId, target_person_id: relativeId, kind: tie.kind, discriminator: detail }
    : { person_id: relativeId, target_person_id: personId, kind: tie.kind, discriminator: detail };
}
