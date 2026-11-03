// SPDX-License-Identifier: AGPL-3.0-or-later
// An in-memory agreements server for the package's tests and stories (never compiled into dist),
// keeping the server's rules: a change to the terms asks everyone to confirm again; only the owner
// adds people or deletes it.
import { http, HttpResponse, type RequestHandler } from 'msw';
import { z } from 'zod';
import { type Agreement, DEFAULT_KINDS, type Term, type TermKindInfo } from './agreementsModel';

export const ME_ID = 'user-me';
export const ALEX_ID = 'user-alex';
export const SAM_ID = 'user-sam';

/** The kinds of term a house share's agreements might hold: the default, and house rules. */
export const HOUSE_KINDS: readonly TermKindInfo[] = [
  ...DEFAULT_KINDS,
  { value: 'rule', heading: 'House rules', choice: 'Rule' },
];
const FIXTURE_VERSION = '2026-10-01T09:00:00';

export interface AgreementsStore {
  agreements: Agreement[];
}

/** Every field any agreements route reads from a body. */
const BodySchema = z.object({
  title: z.string().optional(),
  revisit_on: z.string().nullish(),
  clear_revisit: z.boolean().optional(),
  party_user_ids: z.array(z.string()).optional(),
  user_id: z.string().optional(),
  kind: z.string().optional(),
  text: z.string().optional(),
});
const read = async (request: Request): Promise<z.infer<typeof BodySchema>> => BodySchema.parse(await request.json());

const party = (userId: string, confirmedVersion: number | null): Agreement['parties'][number] => ({
  user_id: userId,
  confirmed: false,
  confirmed_version: confirmedVersion,
});

const term = (id: string, kind: string, text: string, position: number, writtenBy: string): Term => ({
  id,
  kind,
  text,
  position,
  written_by: writtenBy,
  updated_at: FIXTURE_VERSION,
});

/** The server's view of an agreement: who has confirmed this version, and whether it is in effect. */
export function settled(agreement: Agreement): Agreement {
  const parties = agreement.parties.map((p) => ({ ...p, confirmed: p.confirmed_version === agreement.version }));
  return { ...agreement, parties, in_effect: parties.length > 0 && parties.every((p) => p.confirmed) };
}

/** One agreement with Alex, in effect, and one with Alex and Sam that Sam has yet to confirm. */
export function agreementsFixture(): AgreementsStore {
  return {
    agreements: [
      settled({
        id: 'a1',
        title: 'Us',
        revisit_on: '2027-01-01',
        version: 2,
        owner_id: ME_ID,
        parties: [party(ME_ID, 2), party(ALEX_ID, 2)],
        terms: [
          term('t1', 'term', 'We split the bills evenly', 0, ME_ID),
          term('t2', 'rule', 'Guests leave by midnight', 1, ALEX_ID),
          term('t3', 'rule', 'Quiet after ten on weeknights', 2, ME_ID),
        ],
        in_effect: false,
        updated_at: FIXTURE_VERSION,
      }),
      settled({
        id: 'a2',
        title: 'Household',
        revisit_on: '2026-09-01',
        version: 1,
        owner_id: ALEX_ID,
        parties: [party(ALEX_ID, 1), party(ME_ID, 1), party(SAM_ID, null)],
        terms: [term('t4', 'term', 'Whoever cooks does not wash up', 0, ALEX_ID)],
        in_effect: false,
        updated_at: FIXTURE_VERSION,
      }),
    ],
  };
}

export function emptyAgreementsStore(): AgreementsStore {
  return { agreements: [] };
}

const NOT_FOUND = 404;
const FORBIDDEN = 403;
const CONFLICT = 409;
const NO_AGREEMENT = 'Agreement not found';
const NO_TERM = 'Term not found';
const OWNER_ONLY = 'Only the person who started it can do that';
const problem = (status: number, detail: string): Response => HttpResponse.json({ detail }, { status });
/** A path parameter, as the one string it always is on these routes. */
const param = (value: string | readonly string[] | undefined): string => (typeof value === 'string' ? value : '');

export function agreementsHandlers(store: AgreementsStore = agreementsFixture(), me: string = ME_ID): RequestHandler[] {
  let made = 0;
  const mine = (): Agreement[] =>
    store.agreements
      .filter((a) => a.parties.some((p) => p.user_id === me))
      .map(settled)
      .sort((a, b) => a.title.localeCompare(b.title));
  const partyTo = (id: string): Agreement | undefined =>
    store.agreements.find((a) => a.id === id && a.parties.some((p) => p.user_id === me));
  const put = (next: Agreement): Response => {
    store.agreements = store.agreements.map((a) => (a.id === next.id ? next : a));
    return HttpResponse.json(settled(next));
  };
  const changed = (agreement: Agreement, terms: Term[]): Response =>
    put({ ...agreement, terms, version: agreement.version + 1 });
  const withTerm = (termId: string): { agreement: Agreement; found: Term } | undefined => {
    for (const agreement of store.agreements) {
      const found = agreement.terms.find((t) => t.id === termId);
      if (found !== undefined && agreement.parties.some((p) => p.user_id === me)) {
        return { agreement, found };
      }
    }
    return undefined;
  };
  return [
    http.get('*/v1/agreements/mine', () => HttpResponse.json({ agreements: mine() })),
    http.post('*/v1/agreements/terms/:termId/remove', ({ params }) => {
      const hit = withTerm(param(params['termId']));
      return hit === undefined
        ? problem(NOT_FOUND, NO_TERM)
        : changed(
            hit.agreement,
            hit.agreement.terms.filter((t) => t.id !== hit.found.id),
          );
    }),
    http.post('*/v1/agreements/terms/:termId', async ({ params, request }) => {
      const hit = withTerm(param(params['termId']));
      if (hit === undefined) {
        return problem(NOT_FOUND, NO_TERM);
      }
      const body = await read(request);
      const next = {
        ...hit.found,
        ...(body.kind === undefined ? {} : { kind: body.kind }),
        ...(body.text === undefined ? {} : { text: body.text.trim() }),
        written_by: me,
      };
      return next.kind === hit.found.kind && next.text === hit.found.text
        ? HttpResponse.json(settled(hit.agreement))
        : changed(
            hit.agreement,
            hit.agreement.terms.map((t) => (t.id === next.id ? next : t)),
          );
    }),
    http.post('*/v1/agreements/:id/parties/remove', async ({ params, request }) => {
      const agreement = partyTo(param(params['id']));
      const { user_id: userId } = await read(request);
      if (agreement === undefined) {
        return problem(NOT_FOUND, NO_AGREEMENT);
      }
      if (userId !== me && me !== agreement.owner_id) {
        return problem(FORBIDDEN, 'Only the person who started it can take someone out');
      }
      if (userId === agreement.owner_id) {
        return problem(CONFLICT, 'The person who started it deletes it instead of leaving');
      }
      put({ ...agreement, parties: agreement.parties.filter((p) => p.user_id !== userId) });
      return HttpResponse.json({ agreements: mine() });
    }),
    http.post('*/v1/agreements/:id/parties', async ({ params, request }) => {
      const agreement = partyTo(param(params['id']));
      const { user_id: userId } = await read(request);
      if (agreement === undefined) {
        return problem(NOT_FOUND, NO_AGREEMENT);
      }
      if (me !== agreement.owner_id) {
        return problem(FORBIDDEN, OWNER_ONLY);
      }
      if (agreement.parties.some((p) => p.user_id === userId)) {
        return problem(CONFLICT, 'They are already in it');
      }
      return put({ ...agreement, parties: [...agreement.parties, party(userId ?? '', null)] });
    }),
    http.post('*/v1/agreements/:id/terms', async ({ params, request }) => {
      const agreement = partyTo(param(params['id']));
      if (agreement === undefined) {
        return problem(NOT_FOUND, NO_AGREEMENT);
      }
      const body = await read(request);
      made += 1;
      const added = term(`t-new-${String(made)}`, body.kind ?? 'term', (body.text ?? '').trim(), agreement.terms.length, me);
      return changed(agreement, [...agreement.terms, added]);
    }),
    http.post('*/v1/agreements/:id/details', async ({ params, request }) => {
      const agreement = partyTo(param(params['id']));
      if (agreement === undefined) {
        return problem(NOT_FOUND, NO_AGREEMENT);
      }
      const body = await read(request);
      return put({
        ...agreement,
        ...(body.title === undefined ? {} : { title: body.title.trim() }),
        ...(body.clear_revisit === true
          ? { revisit_on: null }
          : body.revisit_on === undefined || body.revisit_on === null
            ? {}
            : { revisit_on: body.revisit_on }),
      });
    }),
    http.post('*/v1/agreements/:id/confirm', ({ params }) => {
      const agreement = partyTo(param(params['id']));
      return agreement === undefined
        ? problem(NOT_FOUND, NO_AGREEMENT)
        : put({
            ...agreement,
            parties: agreement.parties.map((p) => (p.user_id === me ? { ...p, confirmed_version: agreement.version } : p)),
          });
    }),
    http.post('*/v1/agreements/:id/remove', ({ params }) => {
      const agreement = partyTo(param(params['id']));
      if (agreement === undefined) {
        return problem(NOT_FOUND, NO_AGREEMENT);
      }
      if (me !== agreement.owner_id) {
        return problem(FORBIDDEN, OWNER_ONLY);
      }
      store.agreements = store.agreements.filter((a) => a.id !== agreement.id);
      return HttpResponse.json({ agreements: mine() });
    }),
    http.post('*/v1/agreements', async ({ request }) => {
      const body = await read(request);
      made += 1;
      const others = (body.party_user_ids ?? []).filter((u) => u !== me);
      const agreement: Agreement = {
        id: `a-new-${String(made)}`,
        title: (body.title ?? '').trim(),
        revisit_on: body.revisit_on ?? null,
        version: 1,
        owner_id: me,
        parties: [me, ...new Set(others)].map((u) => party(u, null)),
        terms: [],
        in_effect: false,
        updated_at: FIXTURE_VERSION,
      };
      store.agreements = [...store.agreements, agreement];
      return HttpResponse.json(settled(agreement));
    }),
  ];
}
