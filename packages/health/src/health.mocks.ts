// SPDX-License-Identifier: AGPL-3.0-or-later
// An in-memory health server for the package's tests and stories (never compiled into dist): the
// four record routes of the server's health extension, holding every change to its version.
import { http, HttpResponse, type RequestHandler } from 'msw';
import { notFound, refuseStale, versionStamp } from 'zephyrex/testing/msw';
import { z } from 'zod';
import type { Activity, Meal, Sleep, Weight } from './healthModel';
import type { HealthRow, RecordType } from './records';
import { activityType, mealType, sleepType, weightType } from './recordTypes';

const HTTP_CREATED = 201;
const HTTP_NO_CONTENT = 204;
const HTTP_UNPROCESSABLE = 422;
const MS_PER_MINUTE = 60_000;
const MINUTES_PER_DAY = 1440;

/** When the fixture's rows were recorded: their version until a test or story changes one. */
export const FIXTURE_VERSION = '2026-10-01T09:00:00.000001';

/** Rows of every kind, in the store a test or story serves. */
export interface HealthStore {
  activities: Activity[];
  meals: Meal[];
  weights: Weight[];
  sleeps: Sleep[];
}

const version = { created_at: FIXTURE_VERSION, updated_at: null };

/** A week of the log, around Monday 28 September 2026. */
export function healthFixture(): HealthStore {
  return {
    activities: [
      { id: 'a1', performed_at: '2026-09-28T07:00:00Z', kind: 'running', duration_minutes: 30, distance_km: 5, ...version },
      { id: 'a2', performed_at: '2026-09-30T18:00:00Z', kind: 'yoga', duration_minutes: 45, ...version },
    ],
    meals: [
      { id: 'm1', eaten_at: '2026-09-30T08:00:00Z', kind: 'breakfast', food: 'Porridge', calories: 350, ...version },
      { id: 'm2', eaten_at: '2026-09-30T13:00:00Z', kind: 'lunch', food: 'Soup and bread', calories: 600, ...version },
    ],
    weights: [
      { id: 'w1', measured_at: '2026-09-28T07:30:00Z', weight_kg: 70.4, ...version },
      { id: 'w2', measured_at: '2026-09-30T07:30:00Z', weight_kg: 70.1, body_fat_percent: 21.5, ...version },
    ],
    sleeps: [
      {
        id: 's1',
        bedtime: '2026-09-29T23:00:00Z',
        wake_time: '2026-09-30T06:30:00Z',
        duration_minutes: 450,
        quality: 80,
        ...version,
      },
    ],
  };
}

/** Minutes from bed to waking, as the server counts them; null for a night it refuses. */
export function nightMinutes(bedtime: string, wakeTime: string): number | null {
  const minutes = Math.floor((new Date(wakeTime).getTime() - new Date(bedtime).getTime()) / MS_PER_MINUTE);
  return minutes > 0 && minutes <= MINUTES_PER_DAY ? minutes : null;
}

const FieldsSchema = z.looseObject({});

/** The record a request body carries under `key`: its fields as sent. */
async function fieldsOf(request: Request, key: string): Promise<z.infer<typeof FieldsSchema>> {
  return FieldsSchema.parse(new Map(Object.entries(FieldsSchema.parse(await request.json()))).get(key));
}

interface RecordRoutes<T> {
  rows: () => T[];
  setRows: (next: T[]) => void;
  /** What a new record starts with before its fields (what the server fills in itself). */
  defaults: Readonly<Record<string, string | number>>;
  /** Sets what the server computes, or refuses the record (null). */
  prepare: (row: T) => T | null;
}

/** The routes of one record type over its rows. */
function recordHandlers<T extends HealthRow>(
  type: RecordType<T>,
  { rows, setRows, defaults, prepare }: RecordRoutes<T>,
): RequestHandler[] {
  let created = 0;
  const refusedNight = (): Response =>
    HttpResponse.json({ detail: 'wake_time must come after bedtime, within 24 hours' }, { status: HTTP_UNPROCESSABLE });
  return [
    http.get(`*${type.endpoint}`, () => HttpResponse.json({ [type.envelope]: rows() })),
    http.post(`*${type.endpoint}`, async ({ request }) => {
      const fields = await fieldsOf(request, type.single);
      const row = prepare(
        type.schema.parse({
          ...defaults,
          ...fields,
          id: `${type.name}-${String(++created)}`,
          created_at: versionStamp(),
        }),
      );
      if (row === null) {
        return refusedNight();
      }
      setRows([...rows(), row]);
      return HttpResponse.json({ [type.single]: row }, { status: HTTP_CREATED });
    }),
    http.put(`*${type.endpoint}/:id`, async ({ params: { id }, request }) => {
      const current = rows().find((row) => row.id === id);
      if (current === undefined) {
        return notFound();
      }
      const refused = refuseStale(request, current);
      if (refused !== null) {
        return refused;
      }
      const fields = await fieldsOf(request, type.single);
      const updated = prepare(type.schema.parse({ ...current, ...fields, updated_at: versionStamp() }));
      if (updated === null) {
        return refusedNight();
      }
      setRows(rows().map((candidate) => (candidate.id === id ? updated : candidate)));
      return HttpResponse.json({ [type.single]: updated });
    }),
    http.delete(`*${type.endpoint}/:id`, ({ params: { id }, request }) => {
      const current = rows().find((row) => row.id === id);
      if (current === undefined) {
        return notFound();
      }
      const refused = refuseStale(request, current);
      if (refused !== null) {
        return refused;
      }
      setRows(rows().filter((row) => row.id !== id));
      return new HttpResponse(null, { status: HTTP_NO_CONTENT });
    }),
  ];
}

/** The four record routes over `store`, each change held to the row's version as the server does. */
export function healthHandlers(store: HealthStore = healthFixture()): RequestHandler[] {
  const kept = <T>(row: T): T => row;
  return [
    ...recordHandlers(activityType, {
      rows: () => store.activities,
      setRows: (next) => {
        store.activities = next;
      },
      defaults: {},
      prepare: kept,
    }),
    ...recordHandlers(mealType, {
      rows: () => store.meals,
      setRows: (next) => {
        store.meals = next;
      },
      defaults: {},
      prepare: kept,
    }),
    ...recordHandlers(weightType, {
      rows: () => store.weights,
      setRows: (next) => {
        store.weights = next;
      },
      defaults: {},
      prepare: kept,
    }),
    ...recordHandlers(sleepType, {
      rows: () => store.sleeps,
      setRows: (next) => {
        store.sleeps = next;
      },
      // The server counts the night's minutes itself.
      defaults: { duration_minutes: 0 },
      prepare: (night) => {
        const minutes = nightMinutes(night.bedtime, night.wake_time);
        return minutes === null ? null : { ...night, duration_minutes: minutes };
      },
    }),
  ];
}
