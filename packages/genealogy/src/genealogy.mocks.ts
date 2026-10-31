// SPDX-License-Identifier: AGPL-3.0-or-later
// An in-memory genealogy server for the package's tests and stories (never compiled into dist):
// the routes and shapes of the server's genealogy extension, over a small family.
import { http, HttpResponse, type RequestHandler } from 'msw';
import { refuseStale, versionStamp } from 'zephyrex/testing/msw';
import { z } from 'zod';
import {
  ANCESTRY,
  ATTRIBUTE_ENDPOINT,
  type Attribute,
  AttributeSchema,
  FRIENDSHIP,
  GEDCOM_ENDPOINT,
  type Kinship,
  type LinkedNetwork,
  PERSON_ENDPOINT,
  type Person,
  PersonSchema,
  RELATIONSHIP_ENDPOINT,
  type Relationship,
  RelationshipSchema,
  LINKED_NETWORK_ENDPOINT,
  MENTORSHIP,
  PARTNERSHIP,
  SYMMETRIC_KINDS,
} from './genealogyApi';

const GedcomBodySchema = z.object({ gedcom: z.string() });
const PersonBodySchema = z.object({ person: PersonSchema.omit({ id: true }).partial() });
const RelationshipBodySchema = z.object({ relationship: RelationshipSchema.omit({ id: true }).partial() });
const AttributeBodySchema = z.object({
  person_attribute: AttributeSchema.omit({ id: true }).partial().extend({ person_id: z.string().optional() }),
});

const HTTP_CREATED = 201;
const HTTP_NO_CONTENT = 204;
const HTTP_NOT_FOUND = 404;
const HTTP_UNPROCESSABLE = 422;

/** When the fixture's rows were recorded: their version until a test or story changes one. */
export const FIXTURE_VERSION = '2026-10-01T09:00:00.000001';

const person = (id: string, name: string, born: string | null, died: string | null, gender: string | null): Person => ({
  id,
  name,
  description: null,
  birth_date: born === null ? null : `${born}T00:00:00`,
  death_date: died === null ? null : `${died}T00:00:00`,
  gender,
  created_at: FIXTURE_VERSION,
  updated_at: null,
});

const edge = (id: string, from: string, to: string, kind: string, discriminator: string | null): Relationship => ({
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
  created_at: FIXTURE_VERSION,
  updated_at: null,
});

/** Byron's family: Ada, her parents, her husband and their three children. */
export function familyFixture(): Store {
  return {
    persons: [
      person('byron', 'George Gordon Byron', '1788-01-22', '1824-04-19', 'male'),
      person('annabella', 'Anne Isabella Milbanke', '1792-05-17', '1860-05-16', 'female'),
      person('ada', 'Ada Lovelace', '1815-12-10', '1852-11-27', 'female'),
      person('william', 'William King', '1805-02-21', '1893-12-29', 'male'),
      person('byron-jr', 'Byron King-Noel', '1836-05-12', '1862-09-01', 'male'),
      person('anne', 'Anne Blunt', '1837-09-22', '1917-12-15', 'female'),
      person('ralph', 'Ralph King-Milbanke', '1839-07-02', '1906-08-28', 'male'),
    ],
    relationships: [
      edge('r-byron-ada', 'byron', 'ada', ANCESTRY, 'biological'),
      edge('r-annabella-ada', 'annabella', 'ada', ANCESTRY, 'biological'),
      edge('r-ada-william', 'ada', 'william', 'partnership', 'marriage'),
      edge('r-william-ada', 'william', 'ada', 'partnership', 'marriage'),
      ...['byron-jr', 'anne', 'ralph'].flatMap((child) => [
        edge(`r-ada-${child}`, 'ada', child, ANCESTRY, 'biological'),
        edge(`r-william-${child}`, 'william', child, ANCESTRY, 'biological'),
      ]),
      edge('r-byron-jr-anne', 'byron-jr', 'anne', 'sibling_of', null),
    ],
  };
}

/** The people and ties a mock server holds, and the card facts on them. */
export interface Store {
  persons: Person[];
  relationships: Relationship[];
  /** Facts on each person's card that the user keeps (their notes, or on their own record, their profile). */
  attributes?: (Attribute & { person_id: string })[];
  /** What each person published to the user, by person id. */
  published?: Record<string, Attribute[]>;
}

/** When `edge`'s tie ended, if it has: the polycule fixture's ana and eli split in 2020. */
const ENDED = '2020-01-01T00:00:00';

/**
 * A polycule and its friends: ana ══ ben ══ cleo ══ dev, partnerships stored both ways as the client
 * writes them; ben and fay are best friends, fay and dev friends; ana and eli's partnership has ended.
 */
export function polyculeFixture(): Store {
  const tie = (from: string, to: string, kind: string, discriminator: string | null): Relationship[] => [
    edge(`r-${from}-${to}`, from, to, kind, discriminator),
    edge(`r-${to}-${from}`, to, from, kind, discriminator),
  ];
  return {
    persons: ['ana', 'ben', 'cleo', 'dev', 'eli', 'fay'].map((id) =>
      person(id, id.charAt(0).toUpperCase() + id.slice(1), null, null, null),
    ),
    relationships: [
      ...tie('ana', 'ben', PARTNERSHIP, 'nesting'),
      ...tie('ben', 'cleo', PARTNERSHIP, 'dating'),
      ...tie('cleo', 'dev', PARTNERSHIP, 'anchor'),
      ...tie('ana', 'eli', PARTNERSHIP, 'dating').map((row) => ({ ...row, valid_to: ENDED })),
      ...tie('ben', 'fay', FRIENDSHIP, 'best_friend'),
      ...tie('fay', 'dev', FRIENDSHIP, null),
    ],
  };
}

/** `store`'s person `id`; a test or story options someone who isn't there is a mistake in it. */
export function personOf(store: Store, id: string): Person {
  const found = store.persons.find((row) => row.id === id);
  if (found === undefined) {
    throw new Error(`No person ${id} in the fixture`);
  }
  return found;
}

/** The fields a partial body actually sets, without the ones it leaves undefined. */
const defined = (fields: object): Record<string, unknown> =>
  Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined));

/** Every ancestor (or descendant) of `start` with its generation, following `roles` when given. */
function walk(store: Store, start: string, up: boolean, roles: string[], limit: number): Map<string, number> {
  const reached = new Map<string, number>();
  let frontier = [start];
  for (let generation = 1; generation <= limit && frontier.length > 0; generation++) {
    const next: string[] = [];
    for (const row of store.relationships) {
      const [near, far] = up ? [row.target_person_id, row.person_id] : [row.person_id, row.target_person_id];
      const followed = roles.length === 0 || (row.discriminator !== null && roles.includes(row.discriminator));
      if (row.kind === ANCESTRY && followed && frontier.includes(near) && !reached.has(far) && far !== start) {
        reached.set(far, generation);
        next.push(far);
      }
    }
    frontier = next;
  }
  return reached;
}

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

/** The kinship of `a` and `b` as the server works it out: through their nearest common ancestors. */
function kinship(store: Store, a: string, b: string, roles: string[]): Kinship {
  const fromA = new Map([[a, 0], ...walk(store, a, true, roles, Number.POSITIVE_INFINITY)]);
  const fromB = new Map([[b, 0], ...walk(store, b, true, roles, Number.POSITIVE_INFINITY)]);
  const shared = [...fromA.keys()].filter((id) => fromB.has(id));
  if (shared.length === 0) {
    return UNRELATED;
  }
  const total = (id: string): number => (fromA.get(id) ?? 0) + (fromB.get(id) ?? 0);
  const nearest = Math.min(...shared.map(total));
  const common = shared.filter((id) => total(id) === nearest).sort();
  const up = fromA.get(common[0] ?? a) ?? 0;
  const down = fromB.get(common[0] ?? b) ?? 0;
  const lineal = up === 0 || down === 0;
  return {
    related: true,
    common_ancestors: common,
    up_from_person: up,
    up_from_other: down,
    degree: up + down,
    cousin: lineal ? 0 : Math.min(up, down) - 1,
    removed: Math.abs(up - down),
    lineal,
  };
}

/** The undirected ties of `kinds` in `store`, in effect now unless `includeEnded`, as the server folds them. */
function ties(store: Store, kinds: readonly string[], includeEnded: boolean): Map<string, Map<string, Relationship>> {
  const now = new Date().toISOString();
  const graph = new Map<string, Map<string, Relationship>>();
  const link = (from: string, to: string, row: Relationship): void => {
    graph.set(from, new Map([...(graph.get(from) ?? []), [`${to}|${row.kind}|${row.discriminator ?? ''}`, row]]));
  };
  for (const row of store.relationships) {
    const ended = row.valid_to !== null && row.valid_to <= now;
    if (kinds.includes(row.kind) && row.person_id !== row.target_person_id && (includeEnded || !ended)) {
      link(row.person_id, row.target_person_id, row);
      link(row.target_person_id, row.person_id, row);
    }
  }
  return graph;
}

const otherEnd = (id: string, row: Relationship): string => (row.person_id === id ? row.target_person_id : row.person_id);

function neighbours(graph: Map<string, Map<string, Relationship>>, id: string, kind?: string): string[] {
  const rows = [...(graph.get(id)?.values() ?? [])].filter((row) => kind === undefined || row.kind === kind);
  return [...new Set(rows.map((row) => otherEnd(id, row)))].sort();
}

/** Everyone `start` reaches through `graph`, breadth first, with their distance. */
function network(graph: Map<string, Map<string, Relationship>>, start: string, depth: number): Map<string, number> {
  const reached = new Map<string, number>();
  let frontier = [start];
  for (let distance = 1; distance <= depth && frontier.length > 0; distance++) {
    const next = frontier.flatMap((id) => neighbours(graph, id)).filter((id) => id !== start && !reached.has(id));
    for (const id of [...new Set(next)].sort()) {
      reached.set(id, distance);
    }
    frontier = [...new Set(next)];
  }
  return reached;
}

const kindsOf = (url: URL): string[] => {
  const asked = (url.searchParams.get('kinds') ?? '').split(',').filter((kind) => kind !== '');
  return asked.length === 0 ? [...SYMMETRIC_KINDS] : asked;
};
const endedOf = (url: URL): boolean => url.searchParams.get('include_ended') === 'true';

/**
 * Sam at the centre of three polycules: Alex ══ Priya ══ Riley; Jordan ══ Morgan ══ Theo (Theo a
 * comet); and Casey, with Dana mentoring Casey. The first person is the viewer, as the merged
 * network's centre.
 */
export function threePolyculesFixture(): Store {
  const tie = (from: string, to: string, kind: string, discriminator: string | null): Relationship[] =>
    kind === MENTORSHIP
      ? [edge(`r-${from}-${to}`, from, to, kind, discriminator)]
      : [edge(`r-${from}-${to}`, from, to, kind, discriminator), edge(`r-${to}-${from}`, to, from, kind, discriminator)];
  return {
    persons: ['sam', 'alex', 'priya', 'riley', 'jordan', 'morgan', 'theo', 'casey', 'dana'].map((id) =>
      person(id, id.charAt(0).toUpperCase() + id.slice(1), null, null, null),
    ),
    relationships: [
      ...tie('sam', 'alex', PARTNERSHIP, 'nesting'),
      ...tie('alex', 'priya', PARTNERSHIP, 'anchor'),
      ...tie('priya', 'riley', PARTNERSHIP, 'casual'),
      ...tie('sam', 'jordan', PARTNERSHIP, 'dating'),
      ...tie('jordan', 'morgan', PARTNERSHIP, 'nesting'),
      ...tie('morgan', 'theo', PARTNERSHIP, 'comet'),
      ...tie('sam', 'casey', PARTNERSHIP, 'lover'),
      ...tie('dana', 'casey', MENTORSHIP, 'mentor'),
      ...tie('casey', 'dana', PARTNERSHIP, 'dating'),
    ],
  };
}

/** Each member's group once `center` is taken out, numbered from the nearest members out. */
function groupsOf(
  graph: Map<string, Map<string, Relationship>>,
  center: string,
  reached: Map<string, number>,
): Map<string, number> {
  const groups = new Map<string, number>();
  for (const start of [...reached.keys()].sort(
    (a, b) => (reached.get(a) ?? 0) - (reached.get(b) ?? 0) || a.localeCompare(b),
  )) {
    if (groups.has(start)) {
      continue;
    }
    const number = new Set(groups.values()).size;
    const queue = [start];
    groups.set(start, number);
    for (let id = queue.shift(); id !== undefined; id = queue.shift()) {
      for (const other of neighbours(graph, id)) {
        if (other !== center && reached.has(other) && !groups.has(other)) {
          groups.set(other, number);
          queue.push(other);
        }
      }
    }
  }
  return groups;
}

/** The merged network as the server answers it, over `store` as the viewer's own tree. */
function linkedNetwork(store: Store, kinds: readonly string[], includeEnded: boolean): LinkedNetwork {
  const center = store.persons[0]?.id ?? '';
  const graph = ties(store, kinds, includeEnded);
  const reached = network(graph, center, Number.POSITIVE_INFINITY);
  const groups = groupsOf(graph, center, reached);
  const node = (id: string): LinkedNetwork['nodes'][number] => ({
    key: `person:${id}`,
    name: store.persons.find((row) => row.id === id)?.name ?? null,
    visibility: 'named',
    mine: true,
    person_id: id,
    user_id: null,
    distance: reached.get(id) ?? 0,
    group: id === center ? null : (groups.get(id) ?? null),
  });
  const within = new Set([center, ...reached.keys()]);
  const drawn = new Map<string, LinkedNetwork['ties'][number]>();
  for (const row of store.relationships) {
    if (!kinds.includes(row.kind) || !within.has(row.person_id) || !within.has(row.target_person_id)) {
      continue;
    }
    const directed = row.kind === MENTORSHIP;
    const [source, target] =
      directed || row.person_id < row.target_person_id
        ? [row.person_id, row.target_person_id]
        : [row.target_person_id, row.person_id];
    drawn.set(`${source}|${target}|${row.kind}`, {
      source: `person:${source}`,
      target: `person:${target}`,
      kind: row.kind,
      discriminator: row.discriminator,
      directed,
    });
  }
  return {
    center: `person:${center}`,
    kinds: [...kinds],
    nodes: [node(center), ...[...reached.keys()].map(node)],
    ties: [...drawn.values()],
  };
}

const rolesOf = (url: URL): string[] => (url.searchParams.get('roles') ?? '').split(',').filter((role) => role !== '');
const page = <T>(key: string, rows: T[]): Response =>
  HttpResponse.json({ [key]: rows, pagination: { offset: 0, limit: rows.length, total: rows.length, has_more: false } });

/** The genealogy routes over `store`, which they read and change in place. */
export function genealogyHandlers(store: Store = familyFixture()): RequestHandler[] {
  let created = 0;
  const nextId = (prefix: string): string => `${prefix}-${++created}`;
  const known = (id: string): boolean => store.persons.some((row) => row.id === id);

  const notFound = (): Response => HttpResponse.json({ detail: 'Not found' }, { status: HTTP_NOT_FOUND });

  return [
    http.get(`*${LINKED_NETWORK_ENDPOINT}`, ({ request }) => {
      const url = new URL(request.url);
      // The first person stands for the viewer's own record; without one, the server's 404.
      if (store.persons.length === 0) {
        return HttpResponse.json({ detail: 'You have no self person yet' }, { status: HTTP_NOT_FOUND });
      }
      return HttpResponse.json(linkedNetwork(store, kindsOf(url), endedOf(url)));
    }),
    http.get(`*${PERSON_ENDPOINT}/:id/connections`, ({ params: { id }, request }) => {
      if (typeof id !== 'string' || !known(id)) {
        return notFound();
      }
      const url = new URL(request.url);
      const rows = [...(ties(store, kindsOf(url), endedOf(url)).get(id)?.values() ?? [])];
      const connections = rows
        .map((row) => ({ person_id: otherEnd(id, row), kind: row.kind, discriminator: row.discriminator }))
        .sort((x, y) => x.kind.localeCompare(y.kind) || x.person_id.localeCompare(y.person_id));
      return HttpResponse.json({ person_id: id, connections });
    }),
    http.get(`*${PERSON_ENDPOINT}/:id/metamours`, ({ params: { id }, request }) => {
      if (typeof id !== 'string' || !known(id)) {
        return notFound();
      }
      const graph = ties(store, [PARTNERSHIP], endedOf(new URL(request.url)));
      const partners = neighbours(graph, id, PARTNERSHIP);
      const via = new Map<string, string[]>();
      for (const partner of partners) {
        for (const metamour of neighbours(graph, partner, PARTNERSHIP)) {
          if (metamour !== id && !partners.includes(metamour)) {
            via.set(metamour, [...(via.get(metamour) ?? []), partner].sort());
          }
        }
      }
      const metamours = [...via.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([m, shared]) => ({ person_id: m, via: shared }));
      return HttpResponse.json({ person_id: id, metamours });
    }),
    http.get(`*${PERSON_ENDPOINT}/:id/network`, ({ params: { id }, request }) => {
      if (typeof id !== 'string' || !known(id)) {
        return notFound();
      }
      const url = new URL(request.url);
      const kinds = kindsOf(url);
      const depth = Number(url.searchParams.get('depth') ?? Number.POSITIVE_INFINITY);
      const graph = ties(store, kinds, endedOf(url));
      const reached = network(graph, id, depth);
      const members = [...reached.entries()]
        .map(([personId, distance]) => ({ person_id: personId, distance }))
        .sort((x, y) => x.distance - y.distance || x.person_id.localeCompare(y.person_id));
      const within = new Set([id, ...reached.keys()]);
      const drawn = new Map<
        string,
        { person_id: string; target_person_id: string; kind: string; discriminator: string | null }
      >();
      for (const member of within) {
        for (const row of graph.get(member)?.values() ?? []) {
          const [first, second] =
            row.person_id < row.target_person_id
              ? [row.person_id, row.target_person_id]
              : [row.target_person_id, row.person_id];
          if (within.has(first) && within.has(second)) {
            const tie = { person_id: first, target_person_id: second, kind: row.kind, discriminator: row.discriminator };
            drawn.set(`${first}|${second}|${row.kind}|${row.discriminator ?? ''}`, tie);
          }
        }
      }
      const tiesDrawn = [...drawn.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, tie]) => tie);
      return HttpResponse.json({ person_id: id, kinds, members, ties: tiesDrawn });
    }),
    http.get(`*${GEDCOM_ENDPOINT}`, () =>
      HttpResponse.text(
        `0 HEAD\n1 GEDC\n2 VERS 5.5.1\n${store.persons.map((row) => `0 @${row.id}@ INDI`).join('\n')}\n0 TRLR\n`,
      ),
    ),
    http.post(`*${GEDCOM_ENDPOINT}`, async ({ request }) => {
      const { gedcom } = GedcomBodySchema.parse(await request.json());
      if (!gedcom.includes('INDI')) {
        return HttpResponse.json({ detail: 'The file has no INDI records.' }, { status: HTTP_UNPROCESSABLE });
      }
      const imported = person(nextId('imported'), 'Imported ancestor', null, null, null);
      store.persons.push(imported);
      return HttpResponse.json({ version: '5.5.1', people: { '@I1@': imported.id }, relationships: 0 });
    }),
    http.get(`*${PERSON_ENDPOINT}/:id/card`, ({ params: { id } }) => {
      const owner = store.persons.find((row) => row.id === id);
      if (owner === undefined || typeof id !== 'string') {
        return HttpResponse.json({ detail: 'Not found' }, { status: HTTP_NOT_FOUND });
      }
      return HttpResponse.json({
        person_id: id,
        linked_user_id: owner.linked_user_id ?? null,
        notes: (store.attributes ?? []).filter((row) => row.person_id === id),
        published: store.published?.[id] ?? [],
      });
    }),
    http.post(`*${ATTRIBUTE_ENDPOINT}`, async ({ request }) => {
      const { person_attribute: fields } = AttributeBodySchema.parse(await request.json());
      const row = {
        ...AttributeSchema.parse({ id: nextId('attribute'), category: '', label: '', value: '', ...defined(fields) }),
        person_id: fields.person_id ?? '',
        created_at: versionStamp(),
      };
      store.attributes = [...(store.attributes ?? []), row];
      return HttpResponse.json({ person_attribute: row }, { status: HTTP_CREATED });
    }),
    http.put(`*${ATTRIBUTE_ENDPOINT}/:id`, async ({ params: { id }, request }) => {
      const current = (store.attributes ?? []).find((row) => row.id === id);
      if (current === undefined) {
        return HttpResponse.json({ detail: 'Not found' }, { status: HTTP_NOT_FOUND });
      }
      const refused = refuseStale(request, current);
      if (refused !== null) {
        return refused;
      }
      const { person_attribute: fields } = AttributeBodySchema.parse(await request.json());
      const updated = { ...current, ...defined(fields), updated_at: versionStamp() };
      store.attributes = (store.attributes ?? []).map((row) => (row.id === id ? updated : row));
      return HttpResponse.json({ person_attribute: updated });
    }),
    http.delete(`*${ATTRIBUTE_ENDPOINT}/:id`, ({ params: { id }, request }) => {
      const current = (store.attributes ?? []).find((row) => row.id === id);
      if (current === undefined) {
        return HttpResponse.json({ detail: 'Not found' }, { status: HTTP_NOT_FOUND });
      }
      const refused = refuseStale(request, current);
      if (refused !== null) {
        return refused;
      }
      store.attributes = (store.attributes ?? []).filter((row) => row.id !== id);
      return new HttpResponse(null, { status: HTTP_NO_CONTENT });
    }),
    http.get(`*${PERSON_ENDPOINT}/:id/:direction`, ({ params: { id, direction }, request }) => {
      if (typeof id !== 'string' || !known(id) || (direction !== 'ancestors' && direction !== 'descendants')) {
        return HttpResponse.json({ detail: 'Not found' }, { status: HTTP_NOT_FOUND });
      }
      const url = new URL(request.url);
      const limit = Number(url.searchParams.get('generations') ?? Number.POSITIVE_INFINITY);
      const reached = walk(store, id, direction === 'ancestors', rolesOf(url), limit);
      const relatives = [...reached.entries()]
        .map(([personId, generation]) => ({ person_id: personId, generation }))
        .sort((x, y) => x.generation - y.generation);
      return HttpResponse.json({ person_id: id, relatives });
    }),
    http.get(`*${PERSON_ENDPOINT}/:id/kinship/:other`, ({ params: { id, other }, request }) => {
      if (typeof id !== 'string' || typeof other !== 'string' || !known(id) || !known(other)) {
        return HttpResponse.json({ detail: 'Not found' }, { status: HTTP_NOT_FOUND });
      }
      return HttpResponse.json(kinship(store, id, other, rolesOf(new URL(request.url))));
    }),
    http.get(`*${PERSON_ENDPOINT}`, () => page('persons', store.persons)),
    http.post(`*${PERSON_ENDPOINT}`, async ({ request }) => {
      const { person: fields } = PersonBodySchema.parse(await request.json());
      const row = PersonSchema.parse({
        ...person(nextId('person'), '', null, null, null),
        ...defined(fields),
        created_at: versionStamp(),
      });
      store.persons.push(row);
      return HttpResponse.json({ person: row }, { status: HTTP_CREATED });
    }),
    http.put(`*${PERSON_ENDPOINT}/:id`, async ({ params: { id }, request }) => {
      const index = store.persons.findIndex((candidate) => candidate.id === id);
      const current = store.persons.at(index);
      if (index < 0 || current === undefined) {
        return HttpResponse.json({ detail: 'Not found' }, { status: HTTP_NOT_FOUND });
      }
      const refused = refuseStale(request, current);
      if (refused !== null) {
        return refused;
      }
      const { person: fields } = PersonBodySchema.parse(await request.json());
      const updated = PersonSchema.parse({ ...current, ...defined(fields), updated_at: versionStamp() });
      store.persons.splice(index, 1, updated);
      return HttpResponse.json({ person: updated });
    }),
    http.delete(`*${PERSON_ENDPOINT}/:id`, ({ params: { id }, request }) => {
      const current = store.persons.find((row) => row.id === id);
      if (current === undefined) {
        return HttpResponse.json({ detail: 'Not found' }, { status: HTTP_NOT_FOUND });
      }
      const refused = refuseStale(request, current);
      if (refused !== null) {
        return refused;
      }
      store.persons = store.persons.filter((row) => row.id !== id);
      store.relationships = store.relationships.filter((row) => row.person_id !== id && row.target_person_id !== id);
      return new HttpResponse(null, { status: HTTP_NO_CONTENT });
    }),
    http.get(`*${RELATIONSHIP_ENDPOINT}`, ({ request }) => {
      const url = new URL(request.url);
      const subject = url.searchParams.get('person_id');
      const object = url.searchParams.get('target_person_id');
      return page(
        'relationships',
        store.relationships.filter(
          (row) => (subject === null || row.person_id === subject) && (object === null || row.target_person_id === object),
        ),
      );
    }),
    http.post(`*${RELATIONSHIP_ENDPOINT}`, async ({ request }) => {
      const { relationship: fields } = RelationshipBodySchema.parse(await request.json());
      const row = RelationshipSchema.parse({
        ...edge(nextId('relationship'), '', '', '', null),
        ...defined(fields),
        created_at: versionStamp(),
      });
      store.relationships.push(row);
      return HttpResponse.json({ relationship: row }, { status: HTTP_CREATED });
    }),
    http.delete(`*${RELATIONSHIP_ENDPOINT}/:id`, ({ params: { id }, request }) => {
      const current = store.relationships.find((row) => row.id === id);
      if (current === undefined) {
        return HttpResponse.json({ detail: 'Not found' }, { status: HTTP_NOT_FOUND });
      }
      const refused = refuseStale(request, current);
      if (refused !== null) {
        return refused;
      }
      store.relationships = store.relationships.filter((row) => row.id !== id);
      return new HttpResponse(null, { status: HTTP_NO_CONTENT });
    }),
  ];
}
