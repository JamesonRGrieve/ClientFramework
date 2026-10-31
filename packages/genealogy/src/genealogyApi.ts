// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import useSWR, { type SWRResponse } from 'swr';
import { useClient, type ZephyrexClient } from 'zephyrex';
import { z } from 'zod';

export const PERSON_ENDPOINT = '/v1/person';
export const RELATIONSHIP_ENDPOINT = '/v1/relationship';
export const GEDCOM_ENDPOINT = `${PERSON_ENDPOINT}/gedcom`;
export const ATTRIBUTE_ENDPOINT = '/v1/person_attribute';

/** Parent → child; the discriminator is the parent's role. */
export const ANCESTRY = 'ancestry';
/** Romantic and sexual partners. Symmetric, like the kinds below: stored as one directed row each way. */
export const PARTNERSHIP = 'partnership';
export const SIBLING_OF = 'sibling_of';
export const FRIENDSHIP = 'friendship';
export const ACQUAINTANCE = 'acquaintance';
/** Directed: the subject teaches, mentors or coaches the object. */
export const MENTORSHIP = 'mentorship';

/** The kinds that hold both ways, which the server walks as social ties. */
export const SYMMETRIC_KINDS = [PARTNERSHIP, SIBLING_OF, FRIENDSHIP, ACQUAINTANCE] as const;
export type SymmetricKind = (typeof SYMMETRIC_KINDS)[number];

// Each kind's discriminators, as the server's genealogy Relationships registry accepts them.
export const ANCESTRY_ROLES = ['biological', 'adopted', 'step', 'foster', 'legal_guardian'] as const;
/** Most to least entangled: nesting partners share a home, an anchor is central, a comet is seen rarely. */
export const PARTNERSHIP_KINDS = [
  'marriage',
  'civil_union',
  'engagement',
  'partnership',
  'nesting',
  'anchor',
  'dating',
  'comet',
  'casual',
  'lover',
  'liaison',
] as const;
export const FRIENDSHIP_KINDS = ['best_friend', 'close_friend', 'friend', 'queerplatonic', 'friends_with_benefits'] as const;
export const ACQUAINTANCE_KINDS = ['colleague', 'classmate', 'neighbour', 'online'] as const;
export const SIBLING_KINDS = ['full', 'half', 'step', 'adopted', 'foster'] as const;
export const MENTORSHIP_ROLES = ['teacher', 'mentor', 'coach'] as const;

const isSymmetric = (kind: string): boolean => SYMMETRIC_KINDS.some((symmetric) => symmetric === kind);

const nullableText = z.string().nullable();

export const PersonSchema = z.object({
  id: z.string(),
  name: nullableText,
  description: nullableText,
  /** A datetime without a timezone, e.g. "1900-03-12T00:00:00". */
  birth_date: nullableText,
  death_date: nullableText,
  gender: nullableText,
  /** The account this person is; on the account's own record, its self person. */
  linked_user_id: nullableText.optional(),
  /** How they show to strangers when linked trees merge: hidden, anonymous, named or profile. */
  visibility: nullableText.optional(),
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

/** Everyone a person is tied to, by kind (and subkind) of tie. */
export const ConnectionsSchema = z.object({
  person_id: z.string(),
  connections: z.array(z.object({ person_id: z.string(), kind: z.string(), discriminator: nullableText })),
});
export type Connections = z.infer<typeof ConnectionsSchema>;

/** A person's partners' partners who are not their own partners, with the partners they share. */
export const MetamoursSchema = z.object({
  person_id: z.string(),
  metamours: z.array(z.object({ person_id: z.string(), via: z.array(z.string()) })),
});
export type Metamours = z.infer<typeof MetamoursSchema>;

/**
 * Everyone reachable through the walked kinds of tie, nearest first (1 = a direct tie), and every
 * walked tie among them once, `person_id` sorting first, to draw the network with.
 */
export const NetworkSchema = z.object({
  person_id: z.string(),
  kinds: z.array(z.string()),
  members: z.array(z.object({ person_id: z.string(), distance: z.number().int() })),
  ties: z.array(
    z.object({
      person_id: z.string(),
      target_person_id: z.string(),
      kind: z.string(),
      discriminator: nullableText,
      /** A directed tie (mentorship) has its subject as `person_id`. */
      directed: z.boolean().default(false),
    }),
  ),
});
export type Network = z.infer<typeof NetworkSchema>;

/**
 * The requester's network merged with the trees of the accounts they and those accounts have
 * mutually linked. A node is `user:<account>` or `person:<id>`; one shown anonymously has no name;
 * `group` is which of the requester's polycules (groups once they are taken out) it is in.
 */
export const LinkedNetworkSchema = z.object({
  center: z.string(),
  kinds: z.array(z.string()),
  nodes: z.array(
    z.object({
      key: z.string(),
      name: nullableText,
      visibility: z.string(),
      mine: z.boolean(),
      person_id: nullableText,
      user_id: nullableText,
      distance: z.number().int(),
      group: z.number().int().nullable(),
    }),
  ),
  ties: z.array(
    z.object({
      source: z.string(),
      target: z.string(),
      kind: z.string(),
      discriminator: nullableText,
      directed: z.boolean(),
    }),
  ),
});
export type LinkedNetwork = z.infer<typeof LinkedNetworkSchema>;

export const LINKED_NETWORK_ENDPOINT = `${PERSON_ENDPOINT}/linked-network`;

export const GedcomImportSchema = z.object({
  version: z.string(),
  people: z.record(z.string(), z.string()),
  relationships: z.number().int(),
});
export type GedcomImport = z.infer<typeof GedcomImportSchema>;

/**
 * One typed fact on a person's card (category "sizes", label "ring", value "7", unit "US"): on
 * someone else's record, its writer's private note; on the user's own, their profile.
 */
export const AttributeSchema = z.object({
  id: z.string(),
  category: z.string(),
  label: z.string(),
  value: z.string(),
  unit: nullableText.optional(),
  position: z.number().int().nullable().optional(),
  created_by_user_id: nullableText.optional(),
  // The row's version, sent back verbatim as If-Match on every change.
  created_at: nullableText.optional(),
  updated_at: nullableText.optional(),
});
export type Attribute = z.infer<typeof AttributeSchema>;
export type AttributeFields = Pick<Attribute, 'category' | 'label' | 'value'> & { unit?: string | null };

/** A person as the user sees them: what they keep about them, and what the person published to them. */
export const PersonCardSchema = z.object({
  person_id: z.string(),
  linked_user_id: nullableText.optional(),
  notes: z.array(AttributeSchema),
  published: z.array(AttributeSchema),
});
export type CardContents = z.infer<typeof PersonCardSchema>;

/** The framework's card route; an app that reconciles sharing first can serve its own. */
export const personCardPath = (personId: string): string => `${PERSON_ENDPOINT}/${encodeURIComponent(personId)}/card`;

const PersonEnvelopeSchema = z.object({ person: PersonSchema });
const AttributeEnvelopeSchema = z.object({ person_attribute: AttributeSchema });
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

export interface TieOptions {
  /**
   * Which kinds of tie to follow: the symmetric ones, a directed one such as mentorship, or one an
   * app registers on the server; every symmetric kind when omitted.
   */
  kinds?: readonly string[] | undefined;
  /** Keep ties whose `valid_to` has passed; only ties in effect now when omitted. */
  includeEnded?: boolean | undefined;
}

export interface NetworkOptions extends TieOptions {
  /** How many ties away to walk; all the way when omitted. */
  depth?: number | undefined;
}

const tieParams = ({ kinds, includeEnded, depth }: NetworkOptions): Record<string, string> => ({
  ...(kinds === undefined || kinds.length === 0 ? {} : { kinds: kinds.join(',') }),
  ...(includeEnded === true ? { include_ended: 'true' } : {}),
  ...(depth === undefined ? {} : { depth: String(depth) }),
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

/** Reads `personId`'s `route` (connections, metamours, network) and parses it with `schema`. */
function usePersonRoute<T>(
  personId: string,
  route: string,
  params: Record<string, string>,
  schema: z.ZodType<T>,
): SWRResponse<T, Error> {
  const client = useClient();
  const path = `${PERSON_ENDPOINT}/${encodeURIComponent(personId)}/${route}`;
  return useSWR<T, Error>(client.url(path, params), async () => schema.parse(await client.get(path, params)));
}

/** Everyone `personId` is tied to: partners, friends, siblings and acquaintances. */
export function useConnections(personId: string, options: TieOptions = {}): SWRResponse<Connections, Error> {
  return usePersonRoute(personId, 'connections', tieParams(options), ConnectionsSchema);
}

/** `personId`'s metamours: their partners' partners who are not their own partners. */
export function useMetamours(personId: string, includeEnded = false): SWRResponse<Metamours, Error> {
  return usePersonRoute(personId, 'metamours', tieParams({ includeEnded }), MetamoursSchema);
}

/** Everyone `personId` reaches through the chosen ties, such as their polycule through partnerships. */
export function useNetwork(personId: string, options: NetworkOptions = {}): SWRResponse<Network, Error> {
  return usePersonRoute(personId, 'network', tieParams(options), NetworkSchema);
}

/** `personId`'s card, read from `path` (the framework's card route unless the app serves its own). */
export function usePersonCard(personId: string, path: string = personCardPath(personId)): SWRResponse<CardContents, Error> {
  const client = useClient();
  return useSWR<CardContents, Error>(client.url(path), async () => PersonCardSchema.parse(await client.get(path)));
}

/** The signed-in user's network merged across linked trees, grouped into their polycules. */
export function useLinkedNetwork(options: TieOptions = {}): SWRResponse<LinkedNetwork, Error> {
  const client = useClient();
  const params = tieParams(options);
  return useSWR<LinkedNetwork, Error>(client.url(LINKED_NETWORK_ENDPOINT, params), async () =>
    LinkedNetworkSchema.parse(await client.get(LINKED_NETWORK_ENDPOINT, params)),
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
   * Records a relationship. A symmetric kind (partnership, friendship, …) is recorded in both
   * directions (the server stores only the row it is sent).
   */
  createRelationship: async (client: ZephyrexClient, fields: RelationshipFields): Promise<Relationship[]> => {
    const create = async (row: RelationshipFields): Promise<Relationship> =>
      RelationshipEnvelopeSchema.parse(await client.post(RELATIONSHIP_ENDPOINT, { relationship: row })).relationship;
    const forward = await create(fields);
    if (!isSymmetric(fields.kind)) {
      return [forward];
    }
    return [forward, await create({ ...fields, person_id: fields.target_person_id, target_person_id: fields.person_id })];
  },

  deleteRelationship: async (client: ZephyrexClient, seen: Relationship): Promise<void> => {
    await client.delete(`${RELATIONSHIP_ENDPOINT}/${encodeURIComponent(seen.id)}`, seen);
  },

  /** Adds a fact to `personId`'s card: a private note, or on the user's own record, their profile. */
  createAttribute: async (client: ZephyrexClient, personId: string, fields: AttributeFields): Promise<Attribute> =>
    AttributeEnvelopeSchema.parse(
      await client.post(ATTRIBUTE_ENDPOINT, { person_attribute: { person_id: personId, ...fields } }),
    ).person_attribute,

  updateAttribute: async (client: ZephyrexClient, seen: Attribute, fields: Partial<AttributeFields>): Promise<Attribute> =>
    AttributeEnvelopeSchema.parse(
      await client.put(`${ATTRIBUTE_ENDPOINT}/${encodeURIComponent(seen.id)}`, { person_attribute: fields }, seen),
    ).person_attribute,

  deleteAttribute: async (client: ZephyrexClient, seen: Attribute): Promise<void> => {
    await client.delete(`${ATTRIBUTE_ENDPOINT}/${encodeURIComponent(seen.id)}`, seen);
  },

  importGedcom: async (client: ZephyrexClient, gedcom: string): Promise<GedcomImport> =>
    GedcomImportSchema.parse(await client.post(GEDCOM_ENDPOINT, { gedcom })),

  /** Where the browser downloads the user's tree as GEDCOM 5.5.1, with the session cookie. */
  exportUrl: (client: ZephyrexClient): string => client.url(GEDCOM_ENDPOINT),
};
