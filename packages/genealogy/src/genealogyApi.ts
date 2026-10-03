// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import useSWR, { type SWRResponse } from 'swr';
import { useClient, type ZephyrexClient } from 'zephyrex';
import { z } from 'zod';

export const PERSON_ENDPOINT = '/v1/person';
export const RELATIONSHIP_ENDPOINT = '/v1/relationship';
export const GEDCOM_ENDPOINT = `${PERSON_ENDPOINT}/gedcom`;

/** Parent → child; the discriminator is the parent's role. */
export const ANCESTRY = 'ancestry';
/** Symmetric: stored as one directed row each way. */
export const PARTNERSHIP = 'partnership';
export const SIBLING_OF = 'sibling_of';

export const ANCESTRY_ROLES = ['biological', 'adopted', 'step', 'foster', 'legal_guardian'] as const;
export const PARTNERSHIP_KINDS = ['marriage', 'engagement', 'partnership', 'liaison'] as const;

const nullableText = z.string().nullable();

export const PersonSchema = z.object({
  id: z.string(),
  name: nullableText,
  description: nullableText,
  /** A datetime without a timezone, e.g. "1900-03-12T00:00:00". */
  birth_date: nullableText,
  death_date: nullableText,
  gender: nullableText,
  // The row's version, sent back verbatim as If-Match on every change.
  created_at: nullableText.optional(),
  updated_at: nullableText.optional(),
});
export type Person = z.infer<typeof PersonSchema>;

/** "subject (kind, discriminator) object"; kind and discriminator are free text other extensions extend. */
export const RelationshipSchema = z.object({
  id: z.string(),
  person_id: z.string(),
  target_person_id: z.string(),
  kind: z.string(),
  discriminator: nullableText,
  intensity: z.number().min(-1).max(1).nullable(),
  qualifier: nullableText,
  valid_from: nullableText,
  valid_to: nullableText,
  notes: nullableText,
  created_at: nullableText.optional(),
  updated_at: nullableText.optional(),
});
export type Relationship = z.infer<typeof RelationshipSchema>;

/** The people an ancestors or descendants walk reaches, nearest generation first. */
export const LineageSchema = z.object({
  person_id: z.string(),
  relatives: z.array(z.object({ person_id: z.string(), generation: z.number().int() })),
});
export type Lineage = z.infer<typeof LineageSchema>;

/** How two people are related; for an unrelated pair every count is null. */
export const KinshipSchema = z.object({
  related: z.boolean(),
  common_ancestors: z.array(z.string()),
  up_from_person: z.number().int().nullable(),
  up_from_other: z.number().int().nullable(),
  degree: z.number().int().nullable(),
  cousin: z.number().int().nullable(),
  removed: z.number().int().nullable(),
  lineal: z.boolean().nullable(),
});
export type Kinship = z.infer<typeof KinshipSchema>;

export const GedcomImportSchema = z.object({
  version: z.string(),
  people: z.record(z.string(), z.string()),
  relationships: z.number().int(),
});
export type GedcomImport = z.infer<typeof GedcomImportSchema>;

const PersonEnvelopeSchema = z.object({ person: PersonSchema });
const RelationshipEnvelopeSchema = z.object({ relationship: RelationshipSchema });

export type PersonFields = Partial<Omit<Person, 'id' | 'created_at' | 'updated_at'>>;
export type RelationshipFields = Pick<Relationship, 'person_id' | 'target_person_id' | 'kind'> &
  Partial<Omit<Relationship, 'id' | 'person_id' | 'target_person_id' | 'kind' | 'created_at' | 'updated_at'>>;

export type LineageDirection = 'ancestors' | 'descendants';

export interface WalkOptions {
  /** How many generations to walk; all of them when omitted. */
  generations?: number | undefined;
  /** Which parental roles to follow; every role when omitted. */
  roles?: readonly string[] | undefined;
}

const walkParams = ({ generations, roles }: WalkOptions): Record<string, string> => ({
  ...(generations === undefined ? {} : { generations: String(generations) }),
  ...(roles === undefined || roles.length === 0 ? {} : { roles: roles.join(',') }),
});

/** Every person the signed-in user has recorded. */
export function usePersons(): SWRResponse<Person[], Error> {
  const client = useClient();
  return useSWR<Person[], Error>(client.url(PERSON_ENDPOINT), async () =>
    client.list(PERSON_ENDPOINT, 'persons', PersonSchema),
  );
}

/** Which end of its relationships a person is: the subject (`person_id`) or the object (`target_person_id`). */
export type RelationshipEnd = 'person_id' | 'target_person_id';

/** Every relationship with `personId` at `end`. */
export function useRelationships(personId: string, end: RelationshipEnd): SWRResponse<Relationship[], Error> {
  const client = useClient();
  const params = { [end]: personId };
  return useSWR<Relationship[], Error>(client.url(RELATIONSHIP_ENDPOINT, params), async () =>
    client.list(RELATIONSHIP_ENDPOINT, 'relationships', RelationshipSchema, params),
  );
}

/** `personId`'s ancestors or descendants. */
export function useLineage(
  personId: string,
  direction: LineageDirection,
  options: WalkOptions = {},
): SWRResponse<Lineage, Error> {
  const client = useClient();
  const path = `${PERSON_ENDPOINT}/${encodeURIComponent(personId)}/${direction}`;
  const params = walkParams(options);
  return useSWR<Lineage, Error>(client.url(path, params), async () => LineageSchema.parse(await client.get(path, params)));
}

/** How `personId` and `otherId` are related, or `null` until both are chosen. */
export function useKinship(
  personId: string | null,
  otherId: string | null,
  roles: readonly string[] = [],
): SWRResponse<Kinship, Error> {
  const client = useClient();
  const path =
    personId === null || otherId === null
      ? null
      : `${PERSON_ENDPOINT}/${encodeURIComponent(personId)}/kinship/${encodeURIComponent(otherId)}`;
  const params = walkParams({ roles });
  return useSWR<Kinship, Error>(path === null ? null : client.url(path, params), async () =>
    KinshipSchema.parse(await client.get(path ?? '', params)),
  );
}

/** The writes behind the genealogy pages, each answering with what the server stored. */
export const genealogyApi = {
  createPerson: async (client: ZephyrexClient, fields: PersonFields): Promise<Person> =>
    PersonEnvelopeSchema.parse(await client.post(PERSON_ENDPOINT, { person: fields })).person,

  /** Changes `seen`, guarded by it as loaded: StaleWriteError when someone changed it first. */
  updatePerson: async (client: ZephyrexClient, seen: Person, fields: PersonFields): Promise<Person> =>
    PersonEnvelopeSchema.parse(
      await client.put(`${PERSON_ENDPOINT}/${encodeURIComponent(seen.id)}`, { person: fields }, seen),
    ).person,

  deletePerson: async (client: ZephyrexClient, seen: Person): Promise<void> => {
    await client.delete(`${PERSON_ENDPOINT}/${encodeURIComponent(seen.id)}`, seen);
  },

  /**
   * Records a relationship. A partnership is symmetric, so it is recorded in both directions
   * (the server stores only the row it is sent).
   */
  createRelationship: async (client: ZephyrexClient, fields: RelationshipFields): Promise<Relationship[]> => {
    const create = async (row: RelationshipFields): Promise<Relationship> =>
      RelationshipEnvelopeSchema.parse(await client.post(RELATIONSHIP_ENDPOINT, { relationship: row })).relationship;
    const forward = await create(fields);
    if (fields.kind !== PARTNERSHIP) {
      return [forward];
    }
    return [forward, await create({ ...fields, person_id: fields.target_person_id, target_person_id: fields.person_id })];
  },

  deleteRelationship: async (client: ZephyrexClient, seen: Relationship): Promise<void> => {
    await client.delete(`${RELATIONSHIP_ENDPOINT}/${encodeURIComponent(seen.id)}`, seen);
  },

  importGedcom: async (client: ZephyrexClient, gedcom: string): Promise<GedcomImport> =>
    GedcomImportSchema.parse(await client.post(GEDCOM_ENDPOINT, { gedcom })),

  /** Where the browser downloads the user's tree as GEDCOM 5.5.1, with the session cookie. */
  exportUrl: (client: ZephyrexClient): string => client.url(GEDCOM_ENDPOINT),
};
