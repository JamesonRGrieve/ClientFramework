// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { useCallback } from 'react';
import useSWR, { type SWRResponse, useSWRConfig } from 'swr';
import { useClient } from 'zephyrex';
import { z } from 'zod';
import { type Rota, RotaSchema, ScheduleSchema, type ScheduledNight, type Swap, SwapSchema } from './rotaModel';

export const ROTA_ENDPOINT = '/v1/rota';
export const ROTA_NIGHT_ENDPOINT = '/v1/rota_night';
const ROTAS = '/v1/rotas';

const RotaListSchema = z.object({ rotas: z.array(RotaSchema) });
const SwapListSchema = z.object({ swaps: z.array(SwapSchema) });
const CreatedRotaSchema = z.object({ rota: z.object({ id: z.string() }) });

const rotaPath = (rotaId: string): string => `${ROTAS}/${encodeURIComponent(rotaId)}`;

/** The rotas the signed-in user keeps, and those they have a night in. */
export function useMyRotas(): SWRResponse<Rota[], Error> {
  const client = useClient();
  return useSWR<Rota[], Error>(
    client.url(`${ROTAS}/mine`),
    async () => RotaListSchema.parse(await client.get(`${ROTAS}/mine`)).rotas,
  );
}

/** Whom each of `days` nights from `start` (YYYY-MM-DD) is with, swaps applied. */
export function useSchedule(rotaId: string, start: string, days: number): SWRResponse<ScheduledNight[], Error> {
  const client = useClient();
  const path = `${rotaPath(rotaId)}/schedule`;
  const params = { start, days: String(days) };
  return useSWR<ScheduledNight[], Error>(
    client.url(path, params),
    async () => ScheduleSchema.parse(await client.get(path, params)).nights,
  );
}

/** The rota's swaps, asked and answered. */
export function useSwaps(rotaId: string): SWRResponse<Swap[], Error> {
  const client = useClient();
  const path = `${rotaPath(rotaId)}/swaps`;
  return useSWR<Swap[], Error>(client.url(path), async () => SwapListSchema.parse(await client.get(path)).swaps);
}

export interface RotaActions {
  /** Starts a rota of `cycle_days` nights from `starts_on`; resolves to its id. */
  create: (rota: { name: string; cycle_days: number; starts_on: string }) => Promise<string>;
  /** The owner gives the cycle's night `index` to `userId`, or leaves it open (null). */
  setNight: (rota: Rota, index: number, userId: string | null) => Promise<void>;
  /** Asks to hand `night` to `toUserId`: your own night to them, or theirs to you. */
  askSwap: (rota: Rota, night: string, toUserId: string) => Promise<void>;
  /** The other of the two accepts or declines a swap. */
  answerSwap: (rota: Rota, swap: Swap, accept: boolean) => Promise<void>;
}

/** The writes to the user's rotas, each refreshing what it changes. */
export function useRotaActions(): RotaActions {
  const client = useClient();
  const { cache, mutate } = useSWRConfig();
  const refreshRotas = useCallback(async (): Promise<void> => {
    await mutate(client.url(`${ROTAS}/mine`));
  }, [client, mutate]);
  // The rotas, and every schedule and swap list of this one, whichever window is showing.
  const refreshRota = useCallback(
    async (rotaId: string): Promise<void> => {
      const prefix = client.url(rotaPath(rotaId));
      const shown = [...cache.keys()].filter((key) => key.startsWith(prefix));
      await Promise.all([
        refreshRotas(),
        ...shown.map(async (key): Promise<void> => {
          await mutate(key);
        }),
      ]);
    },
    [cache, client, mutate, refreshRotas],
  );
  const create = useCallback(
    async (rota: { name: string; cycle_days: number; starts_on: string }): Promise<string> => {
      const made = CreatedRotaSchema.parse(await client.post(ROTA_ENDPOINT, { rota }));
      await refreshRotas();
      return made.rota.id;
    },
    [client, refreshRotas],
  );
  const setNight = useCallback(
    async (rota: Rota, index: number, userId: string | null): Promise<void> => {
      const current = rota.nights.find((night) => night.day_index === index);
      const nightPath = current === undefined ? '' : `${ROTA_NIGHT_ENDPOINT}/${encodeURIComponent(current.id)}`;
      if (current === undefined && userId !== null) {
        await client.post(ROTA_NIGHT_ENDPOINT, { rota_night: { rota_id: rota.id, day_index: index, user_id: userId } });
      } else if (current !== undefined && userId === null) {
        await client.delete(nightPath, current);
      } else if (current !== undefined && userId !== null && userId !== current.user_id) {
        await client.put(nightPath, { rota_night: { user_id: userId } }, current);
      }
      await refreshRota(rota.id);
    },
    [client, refreshRota],
  );
  const askSwap = useCallback(
    async (rota: Rota, night: string, toUserId: string): Promise<void> => {
      await client.post(`${rotaPath(rota.id)}/swaps`, { night, to_user_id: toUserId });
      await refreshRota(rota.id);
    },
    [client, refreshRota],
  );
  const answerSwap = useCallback(
    async (rota: Rota, swap: Swap, accept: boolean): Promise<void> => {
      await client.post(`${ROTAS}/swaps/${encodeURIComponent(swap.id)}/answer`, { accept });
      await refreshRota(rota.id);
    },
    [client, refreshRota],
  );
  return { create, setNight, askSwap, answerSwap };
}
