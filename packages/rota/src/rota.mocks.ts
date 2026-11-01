// SPDX-License-Identifier: AGPL-3.0-or-later
// An in-memory rota server for the package's tests and stories (never compiled into dist): the
// routes of the server's rota extension, with its rules: the owner sets the nights, members read
// the rota and strangers do not, and a swap moves a night once the other of the two accepts.
import { http, HttpResponse, type RequestHandler } from 'msw';
import { notFound, refuseStale, versionStamp } from 'zephyrex/testing/msw';
import { z } from 'zod';
import { dayOf, isoDay, MAX_CYCLE_DAYS, type RotaNight, type ScheduledNight, type Swap } from './rotaModel';

const HTTP_CREATED = 201;
const HTTP_NO_CONTENT = 204;
const HTTP_FORBIDDEN = 403;
const HTTP_CONFLICT = 409;
const HTTP_UNPROCESSABLE = 422;
const MS_PER_DAY = 86_400_000;
const MAX_SCHEDULE_DAYS = 62;

/** The signed-in account in the fixture, and the two people it shares nights with. */
export const ME = 'u-me';
export const ALEX = 'u-alex';
export const SAM = 'u-sam';

/** When the fixture's rows were recorded: their version until a test or story changes one. */
export const FIXTURE_VERSION = '2026-10-01T09:00:00.000001';

interface StoredRota {
  id: string;
  name: string;
  cycle_days: number;
  starts_on: string;
  created_by_user_id: string;
}

interface StoredNight extends RotaNight {
  rota_id: string;
}

/** What the mock server holds. */
export interface RotaStore {
  me: string;
  rotas: StoredRota[];
  nights: StoredNight[];
  swaps: (Swap & { rota_id: string })[];
}

const version = { created_at: FIXTURE_VERSION, updated_at: null };

/** A four-night cycle from Monday 28 September 2026: two nights with Alex, one with Sam, one open; and Alex asks for a Sam night. */
export function rotaFixture(): RotaStore {
  const night = (id: string, dayIndex: number, userId: string): StoredNight => ({
    id,
    rota_id: 'r1',
    day_index: dayIndex,
    user_id: userId,
    ...version,
  });
  return {
    me: ME,
    rotas: [{ id: 'r1', name: 'Nights', cycle_days: 4, starts_on: '2026-09-28', created_by_user_id: ME }],
    nights: [night('n0', 0, ALEX), night('n1', 1, SAM), night('n2', 2, ALEX)],
    swaps: [
      {
        id: 's1',
        rota_id: 'r1',
        night: '2026-10-06',
        from_user_id: ALEX,
        to_user_id: ME,
        status: 'pending',
        requested_by: ALEX,
        ...version,
      },
    ],
  };
}

/** The same store, seen by an account with no rotas. */
export function emptyRotaStore(): RotaStore {
  return { me: ME, rotas: [], nights: [], swaps: [] };
}

/** Whom each of `days` nights from `start` is with: the cycle's night, unless an accepted swap moved it. */
export function scheduleOf(store: RotaStore, rotaId: string, start: string, days: number): ScheduledNight[] {
  const rota = store.rotas.find((candidate) => candidate.id === rotaId);
  if (rota === undefined) {
    return [];
  }
  const byIndex = new Map(store.nights.filter((n) => n.rota_id === rotaId).map((n) => [n.day_index, n.user_id]));
  const accepted = new Map(
    store.swaps
      .filter((swap) => swap.rota_id === rotaId && swap.status === 'accepted')
      .map((swap) => [`${swap.night}|${swap.from_user_id}`, swap.to_user_id]),
  );
  const origin = dayOf(rota.starts_on).getTime();
  return Array.from({ length: days }, (_, offset) => {
    const day = dayOf(start);
    day.setDate(day.getDate() + offset);
    const night = isoDay(day);
    const since = Math.round((day.getTime() - origin) / MS_PER_DAY);
    const base = since >= 0 ? (byIndex.get(since % rota.cycle_days) ?? null) : null;
    const moved = base === null ? undefined : accepted.get(`${night}|${base}`);
    return { night, user_id: moved ?? base, swapped: moved !== undefined };
  });
}

const BodySchema = z.looseObject({});
const fieldsOf = async (request: Request, key?: string): Promise<z.infer<typeof BodySchema>> => {
  const body = BodySchema.parse(await request.json());
  return key === undefined ? body : BodySchema.parse(new Map(Object.entries(body)).get(key));
};
const refuse = (status: number, detail: string): Response => HttpResponse.json({ detail }, { status });

/** The rota routes over `store`, answering as `store.me`. */
export function rotaHandlers(store: RotaStore = rotaFixture()): RequestHandler[] {
  let made = 0;
  const nightsOf = (rotaId: string): StoredNight[] => store.nights.filter((night) => night.rota_id === rotaId);
  const membersOf = (rota: StoredRota): Set<string> =>
    new Set([rota.created_by_user_id, ...nightsOf(rota.id).map((night) => night.user_id)]);
  const visible = (rotaId: string | readonly string[] | undefined): StoredRota | undefined => {
    const rota = store.rotas.find((candidate) => candidate.id === rotaId);
    return rota !== undefined && membersOf(rota).has(store.me) ? rota : undefined;
  };
  const owned = (rotaId: string): StoredRota | undefined =>
    store.rotas.find((rota) => rota.id === rotaId && rota.created_by_user_id === store.me);
  const swapEntry = (swap: RotaStore['swaps'][number]): Swap => ({
    id: swap.id,
    night: swap.night,
    from_user_id: swap.from_user_id,
    to_user_id: swap.to_user_id,
    status: swap.status,
    requested_by: swap.requested_by,
    created_at: swap.created_at,
    updated_at: swap.updated_at,
  });
  const nightEntry = (night: StoredNight): RotaNight => ({
    id: night.id,
    day_index: night.day_index,
    user_id: night.user_id,
    created_at: night.created_at,
    updated_at: night.updated_at,
  });
  return [
    http.get('*/v1/user', () => HttpResponse.json({ user: { id: store.me, email: 'me@example.com' } })),
    http.get('*/v1/rotas/mine', () =>
      HttpResponse.json({
        rotas: store.rotas
          .filter((rota) => membersOf(rota).has(store.me))
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((rota) => ({
            id: rota.id,
            name: rota.name,
            cycle_days: rota.cycle_days,
            starts_on: rota.starts_on,
            owner_id: rota.created_by_user_id,
            nights: nightsOf(rota.id)
              .sort((a, b) => a.day_index - b.day_index)
              .map(nightEntry),
          })),
      }),
    ),
    http.get('*/v1/rotas/:rotaId/schedule', ({ params: { rotaId }, request }) => {
      const rota = visible(rotaId);
      if (rota === undefined) {
        return notFound();
      }
      const query = new URL(request.url).searchParams;
      const days = Math.max(1, Math.min(Number(query.get('days') ?? '14'), MAX_SCHEDULE_DAYS));
      return HttpResponse.json({
        rota_id: rota.id,
        nights: scheduleOf(store, rota.id, query.get('start') ?? isoDay(new Date()), days),
      });
    }),
    http.get('*/v1/rotas/:rotaId/swaps', ({ params: { rotaId } }) => {
      const rota = visible(rotaId);
      if (rota === undefined) {
        return notFound();
      }
      const swaps = store.swaps.filter((swap) => swap.rota_id === rota.id).sort((a, b) => a.night.localeCompare(b.night));
      return HttpResponse.json({ swaps: swaps.map(swapEntry) });
    }),
    http.post('*/v1/rotas/:rotaId/swaps', async ({ params: { rotaId }, request }) => {
      const rota = visible(rotaId);
      if (rota === undefined) {
        return notFound();
      }
      const { night, to_user_id: to } = z
        .object({ night: z.string(), to_user_id: z.string() })
        .parse(await fieldsOf(request));
      const holder = scheduleOf(store, rota.id, night, 1).at(0)?.user_id ?? null;
      if (holder === null) {
        return refuse(HTTP_UNPROCESSABLE, 'Nobody has that night');
      }
      if (!membersOf(rota).has(to) || to === holder) {
        return refuse(HTTP_UNPROCESSABLE, 'A night is handed to another member of the rota');
      }
      if (store.me !== holder && store.me !== to) {
        return refuse(HTTP_FORBIDDEN, 'Only the two people swapping can ask');
      }
      const swap = {
        id: `swap-${String(++made)}`,
        rota_id: rota.id,
        night,
        from_user_id: holder,
        to_user_id: to,
        status: 'pending' as const,
        requested_by: store.me,
        created_at: versionStamp(),
        updated_at: null,
      };
      store.swaps.push(swap);
      return HttpResponse.json(swapEntry(swap));
    }),
    http.post('*/v1/rotas/swaps/:swapId/answer', async ({ params: { swapId }, request }) => {
      const swap = store.swaps.find((candidate) => candidate.id === swapId);
      if (swap === undefined || (swap.from_user_id !== store.me && swap.to_user_id !== store.me)) {
        return notFound();
      }
      if (swap.requested_by === store.me) {
        return refuse(HTTP_FORBIDDEN, 'The other person answers a swap you asked for');
      }
      if (swap.status !== 'pending') {
        return refuse(HTTP_CONFLICT, 'That swap has been answered');
      }
      const { accept } = z.object({ accept: z.boolean() }).parse(await fieldsOf(request));
      swap.status = accept ? 'accepted' : 'declined';
      swap.updated_at = versionStamp();
      return HttpResponse.json(swapEntry(swap));
    }),
    http.post('*/v1/rota', async ({ request }) => {
      const fields = z
        .object({ name: z.string().min(1), cycle_days: z.number().int().min(1).max(MAX_CYCLE_DAYS), starts_on: z.string() })
        .safeParse(await fieldsOf(request, 'rota'));
      if (!fields.success) {
        return refuse(HTTP_UNPROCESSABLE, 'A rota needs a name, a cycle of 1 to 28 nights and a first night');
      }
      const rota = { id: `rota-${String(++made)}`, ...fields.data, created_by_user_id: store.me };
      store.rotas.push(rota);
      return HttpResponse.json({ rota }, { status: HTTP_CREATED });
    }),
    http.post('*/v1/rota_night', async ({ request }) => {
      const fields = z
        .object({ rota_id: z.string(), day_index: z.number(), user_id: z.string() })
        .parse(await fieldsOf(request, 'rota_night'));
      const rota = owned(fields.rota_id);
      if (rota === undefined) {
        return notFound();
      }
      if (fields.day_index < 0 || fields.day_index >= rota.cycle_days) {
        return refuse(HTTP_UNPROCESSABLE, "That night is outside the rota's cycle");
      }
      if (nightsOf(rota.id).some((taken) => taken.day_index === fields.day_index)) {
        return refuse(HTTP_CONFLICT, 'That night already has someone');
      }
      const night = { id: `night-${String(++made)}`, ...fields, created_at: versionStamp(), updated_at: null };
      store.nights.push(night);
      return HttpResponse.json({ rota_night: night }, { status: HTTP_CREATED });
    }),
    http.put('*/v1/rota_night/:id', async ({ params: { id }, request }) => {
      const night = store.nights.find((candidate) => candidate.id === id);
      if (night === undefined || owned(night.rota_id) === undefined) {
        return notFound();
      }
      const refused = refuseStale(request, night);
      if (refused !== null) {
        return refused;
      }
      const { user_id: userId } = z.object({ user_id: z.string() }).parse(await fieldsOf(request, 'rota_night'));
      night.user_id = userId;
      night.updated_at = versionStamp();
      return HttpResponse.json({ rota_night: night });
    }),
    http.delete('*/v1/rota_night/:id', ({ params: { id }, request }) => {
      const night = store.nights.find((candidate) => candidate.id === id);
      if (night === undefined || owned(night.rota_id) === undefined) {
        return notFound();
      }
      const refused = refuseStale(request, night);
      if (refused !== null) {
        return refused;
      }
      store.nights = store.nights.filter((candidate) => candidate.id !== id);
      return new HttpResponse(null, { status: HTTP_NO_CONTENT });
    }),
  ];
}
