// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import useSWR, { type SWRResponse } from 'swr';
import { useClient, type ZephyrexClient } from 'zephyrex';
import { z } from 'zod';
import { CategorySchema, type Midpoint, MidpointSchema, type Mode, type PlaceCategory } from './mapsModel';

export const MAPS_ENDPOINT = '/v1/maps';
const CATEGORIES = `${MAPS_ENDPOINT}/categories`;
const MIDPOINT = `${MAPS_ENDPOINT}/midpoint`;

/** The kinds of place the server finds nearby. */
export function usePlaceCategories(): SWRResponse<PlaceCategory[], Error> {
  const client = useClient();
  return useSWR<PlaceCategory[], Error>(
    client.url(CATEGORIES),
    async () => z.object({ categories: z.array(CategorySchema) }).parse(await client.get(CATEGORIES)).categories,
  );
}

export interface MidpointRequest {
  locations: string[];
  mode: Mode;
  /** A kind of place to find there; none for only the point. */
  category: string | null;
}

/** The point halfway between `locations`, each one's way there, and places of `category` around it. */
export async function findMidpoint(client: ZephyrexClient, request: MidpointRequest): Promise<Midpoint> {
  return MidpointSchema.parse(
    await client.post(MIDPOINT, { locations: request.locations, mode: request.mode, category: request.category }),
  );
}
