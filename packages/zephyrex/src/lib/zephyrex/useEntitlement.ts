// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import useSWR, { type SWRResponse } from 'swr';
import { z } from 'zod';
import { useClient, useHasSession, useServerExtensions } from './hooks';

/** The server's entitlements extension: the signed-in user's plan. */
export const ENTITLEMENT_PATH = '/v1/entitlement';

export const EntitlementSchema = z.object({
  plan: z.string(),
  features: z.array(z.string()),
  /** Each limit's count; null is unlimited, and a limit not listed is 0. */
  limits: z.record(z.string(), z.number().int().nullable()),
  seats: z.number().int(),
  seats_given: z.number().int(),
  /** The subscriber whose shared seat gives this plan, when it is not the user's own. */
  via_seat_from: z.string().nullable().optional(),
});
export type Entitlement = z.infer<typeof EntitlementSchema>;

/** Whether `entitlement`'s plan unlocks `feature`. */
export function hasFeature(entitlement: Entitlement, feature: string): boolean {
  return entitlement.features.includes(feature);
}

/** `entitlement`'s count for `limit`: null when unlimited, 0 when its plan does not name it. */
export function limitOf(entitlement: Entitlement, limit: string): number | null {
  return Object.hasOwn(entitlement.limits, limit) ? (entitlement.limits[limit] ?? null) : 0;
}

/** Whether having `count` of `limit` (after the action about to be taken) is within the plan. */
export function withinLimit(entitlement: Entitlement, limit: string, count: number): boolean {
  const allowed = limitOf(entitlement, limit);
  return allowed === null || count <= allowed;
}

/** The server extension that sells plans; a server without it has no plan to ask for. */
const ENTITLEMENTS_EXTENSION = 'entitlements';

/**
 * The signed-in user's plan, its features, limits and seats. Not asked of a server that, asked
 * while signed in, lists its extensions without entitlements: it sells no plans, and would only
 * answer 404 (`data` stays undefined). Signed out, or where the list is empty or unanswered, it is
 * asked as it always was.
 */
export function useEntitlement(): SWRResponse<Entitlement, Error> {
  const client = useClient();
  const signedIn = useHasSession();
  const extensions = useServerExtensions();
  const listed = extensions.data;
  const sellsNoPlans =
    listed !== undefined && listed.length > 0 && !listed.some((extension) => extension.name === ENTITLEMENTS_EXTENSION);
  // Signed in, the list is coming: wait for it rather than ask a server that may sell no plans.
  const waiting = signedIn && listed === undefined && extensions.error === undefined;
  return useSWR<Entitlement, Error>(waiting || sellsNoPlans ? null : client.url(ENTITLEMENT_PATH), async () =>
    EntitlementSchema.parse(await client.get(ENTITLEMENT_PATH)),
  );
}
