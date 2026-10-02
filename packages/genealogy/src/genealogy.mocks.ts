// SPDX-License-Identifier: AGPL-3.0-or-later
// An in-memory genealogy server for the package's tests and stories (never compiled into dist):
// the routes and shapes of the server's genealogy extension, over a small family.
import { http, HttpResponse, type RequestHandler } from 'msw';
import { z } from 'zod';
import {
  ANCESTRY,
  GEDCOM_ENDPOINT,
  type Kinship,
  PERSON_ENDPOINT,
  type Person,
  PersonSchema,
  RELATIONSHIP_ENDPOINT,
  type Relationship,
  RelationshipSchema,
} from './genealogyApi';

const GedcomBodySchema = z.object({ gedcom: z.string() });
const PersonBodySchema = z.object({ person: PersonSchema.omit({ id: true }).partial() });
const RelationshipBodySchema = z.object({ relationship: RelationshipSchema.omit({ id: true }).partial() });

const HTTP_CREATED = 201;
const HTTP_NO_CONTENT = 204;
const HTTP_NOT_FOUND = 404;
const HTTP_UNPROCESSABLE = 422;

const person = (id: string, name: string, born: string | null, died: string | null, gender: string | null): Person => ({
  id,
  name,
  description: null,
  birth_date: born === null ? null : `${born}T00:00:00`,
  death_date: died === null ? null : `${died}T00:00:00`,
  gender,
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
});

/** Byron's family: Ada, her parents, her husband and their three children. */
export function familyFixture(): { persons: Person[]; relationships: Relationship[] } {
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

export type Store = ReturnType<typeof familyFixture>;

/** `store`'s person `id`; a test or story naming someone who isn't there is a mistake in it. */
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

const rolesOf = (url: URL): string[] => (url.searchParams.get('roles') ?? '').split(',').filter((role) => role !== '');
const page = <T>(key: string, rows: T[]): Response =>
  HttpResponse.json({ [key]: rows, pagination: { offset: 0, limit: rows.length, total: rows.length, has_more: false } });

/** The genealogy routes over `store`, which they read and change in place. */
export function genealogyHandlers(store: Store = familyFixture()): RequestHandler[] {
  let created = 0;
  const nextId = (prefix: string): string => `${prefix}-${++created}`;
  const known = (id: string): boolean => store.persons.some((row) => row.id === id);

  return [
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
      const row = PersonSchema.parse({ ...person(nextId('person'), '', null, null, null), ...defined(fields) });
      store.persons.push(row);
      return HttpResponse.json({ person: row }, { status: HTTP_CREATED });
    }),
    http.put(`*${PERSON_ENDPOINT}/:id`, async ({ params: { id }, request }) => {
      const index = store.persons.findIndex((candidate) => candidate.id === id);
      const current = store.persons.at(index);
      if (index < 0 || current === undefined) {
        return HttpResponse.json({ detail: 'Not found' }, { status: HTTP_NOT_FOUND });
      }
      const { person: fields } = PersonBodySchema.parse(await request.json());
      const updated = PersonSchema.parse({ ...current, ...defined(fields) });
      store.persons.splice(index, 1, updated);
      return HttpResponse.json({ person: updated });
    }),
    http.delete(`*${PERSON_ENDPOINT}/:id`, ({ params: { id } }) => {
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
      const row = RelationshipSchema.parse({ ...edge(nextId('relationship'), '', '', '', null), ...defined(fields) });
      store.relationships.push(row);
      return HttpResponse.json({ relationship: row }, { status: HTTP_CREATED });
    }),
    http.delete(`*${RELATIONSHIP_ENDPOINT}/:id`, ({ params: { id } }) => {
      store.relationships = store.relationships.filter((row) => row.id !== id);
      return new HttpResponse(null, { status: HTTP_NO_CONTENT });
    }),
  ];
}
