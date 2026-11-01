// SPDX-License-Identifier: AGPL-3.0-or-later
// What the server's rota extension answers: rotas with their cycle of nights, the schedule they
// make, and the swaps of single nights between two of their members.
import { z } from 'zod';

/** The longest cycle a rota repeats over, as the server allows. */
export const MAX_CYCLE_DAYS = 28;

const version = {
  created_at: z.string().nullish(),
  updated_at: z.string().nullish(),
};

/** One night of a rota's cycle, and whom it is with. */
export const RotaNightSchema = z.object({ id: z.string(), day_index: z.number(), user_id: z.string(), ...version });
export type RotaNight = z.infer<typeof RotaNightSchema>;

/** A rota, as its owner and members see it. */
export const RotaSchema = z.object({
  id: z.string(),
  name: z.string(),
  cycle_days: z.number(),
  starts_on: z.string(),
  owner_id: z.string(),
  nights: z.array(RotaNightSchema),
});
export type Rota = z.infer<typeof RotaSchema>;

/** One night of the schedule: whom it is with (none when the cycle leaves it open), and whether a swap moved it. */
export const ScheduledNightSchema = z.object({ night: z.string(), user_id: z.string().nullable(), swapped: z.boolean() });
export type ScheduledNight = z.infer<typeof ScheduledNightSchema>;

export const ScheduleSchema = z.object({ rota_id: z.string(), nights: z.array(ScheduledNightSchema) });

const SWAP_STATUSES = ['pending', 'accepted', 'declined'] as const;

/** A night handed from one member to another, once the other of the two agrees. */
export const SwapSchema = z.object({
  id: z.string(),
  night: z.string(),
  from_user_id: z.string(),
  to_user_id: z.string(),
  status: z.enum(SWAP_STATUSES),
  requested_by: z.string().nullish(),
  ...version,
});
export type Swap = z.infer<typeof SwapSchema>;

/** Someone a rota's nights can be with: their account and what to call them. */
export interface RotaPerson {
  userId: string;
  name: string;
}

/** A day as the server writes it (YYYY-MM-DD), in local time. */
export function isoDay(day: Date): string {
  const pad = (value: number): string => String(value).padStart(2, '0');
  return `${String(day.getFullYear())}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}`;
}

/** A YYYY-MM-DD day as a local date. */
export function dayOf(iso: string): Date {
  const [year = 0, month = 1, day = 1] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** The cycle's night `index`: the weekday and date it first falls on, e.g. "Night 1 · Mon 1 Jun". */
export function cycleNightLabel(rota: Pick<Rota, 'starts_on'>, index: number): string {
  const first = dayOf(rota.starts_on);
  first.setDate(first.getDate() + index);
  return `Night ${String(index + 1)} · ${nightLabel(isoDay(first))}`;
}

/** A night for the schedule, e.g. "Mon 1 Jun". */
export function nightLabel(iso: string): string {
  return dayOf(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

/** Whom the cycle's night `index` is with, if anyone. */
export function nightAt(rota: Pick<Rota, 'nights'>, index: number): RotaNight | undefined {
  return rota.nights.find((night) => night.day_index === index);
}

/** Who can be given a rota's nights or asked for a swap: you, everyone with a night, and `people`. */
export function membersOf(rota: Pick<Rota, 'owner_id' | 'nights'>, people: readonly RotaPerson[]): string[] {
  return [
    ...new Set([rota.owner_id, ...rota.nights.map((night) => night.user_id), ...people.map((person) => person.userId)]),
  ];
}
