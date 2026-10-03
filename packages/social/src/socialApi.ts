// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import useSWR, { type SWRResponse } from 'swr';
import { ApiError, useClient } from 'zephyrex';
import { z } from 'zod';

export const SOCIAL_PUBLICATION_ENDPOINT = '/v1/social_publication';

const HTTP_NOT_FOUND = 404;

/**
 * One post a platform accepted, as the server recorded it when it published. The server writes
 * these (through its publish ability); clients only read them.
 */
export const SocialPublicationSchema = z.object({
  id: z.string(),
  /** The platform's provider name: x, facebook, instagram, threads, tiktok or postiz. */
  provider: z.string(),
  /** The provider instance (the account) it was published through. */
  provider_instance_id: z.string(),
  platform_post_id: z.string(),
  url: z.string().nullable(),
  content: z.string(),
  /** null when the post had no media. */
  media_urls: z.array(z.string()).nullable(),
  published_at: z.string(),
  created_at: z.string(),
  user_id: z.string().nullable().optional(),
  team_id: z.string().nullable().optional(),
});
export type SocialPublication = z.infer<typeof SocialPublicationSchema>;

const PublicationEnvelopeSchema = z.object({ social_publication: SocialPublicationSchema });

const byNewest = (a: SocialPublication, b: SocialPublication): number => b.published_at.localeCompare(a.published_at);

/** Every post the signed-in user can see (from the accounts they can see), newest first. */
export function useSocialPublications(): SWRResponse<SocialPublication[], Error> {
  const client = useClient();
  return useSWR<SocialPublication[], Error>(client.url(SOCIAL_PUBLICATION_ENDPOINT), async () =>
    (await client.list(SOCIAL_PUBLICATION_ENDPOINT, 'social_publications', SocialPublicationSchema)).sort(byNewest),
  );
}

/** One post, or `null` when it doesn't exist or isn't the user's to see (the server answers 404 for both). */
export function useSocialPublication(publicationId: string): SWRResponse<SocialPublication | null, Error> {
  const client = useClient();
  const path = `${SOCIAL_PUBLICATION_ENDPOINT}/${encodeURIComponent(publicationId)}`;
  return useSWR<SocialPublication | null, Error>(client.url(path), async () => {
    try {
      return PublicationEnvelopeSchema.parse(await client.get(path)).social_publication;
    } catch (error) {
      if (error instanceof ApiError && error.status === HTTP_NOT_FOUND) {
        return null;
      }
      throw error;
    }
  });
}

const PLATFORM_NAMES: ReadonlyMap<string, string> = new Map([
  ['x', 'X'],
  ['facebook', 'Facebook'],
  ['instagram', 'Instagram'],
  ['threads', 'Threads'],
  ['tiktok', 'TikTok'],
  ['postiz', 'Postiz'],
]);

const LINKABLE_PROTOCOLS: ReadonlySet<string> = new Set(['http:', 'https:']);

/**
 * `value` as a link target when it is an http(s) address, else `null`. Post and media addresses
 * come from the platforms, so anything else (a `javascript:` URL, say) is shown, never linked.
 */
export function linkTarget(value: string): string | null {
  try {
    return LINKABLE_PROTOCOLS.has(new URL(value).protocol) ? value : null;
  } catch {
    return null;
  }
}

/** The platform's name for display; a provider the client doesn't know shows as the server names it. */
export const platformName = (provider: string): string => PLATFORM_NAMES.get(provider) ?? provider;
