// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import useSWR, { type SWRResponse } from 'swr';
import { useClient } from 'zephyrex';
import { z } from 'zod';

export const ARTIFACT_ENDPOINT = '/v1/artifact';

const optionalText = z.string().nullable().optional();

/**
 * A file kept with a conversation (often an agent's output): its name, type and size, and its text
 * when the server holds it inline. The server records where the file lives but does not serve it.
 */
export const ArtifactSchema = z.object({
  id: z.string(),
  name: optionalText,
  conversation_id: optionalText,
  message_id: optionalText,
  user_id: optionalText,
  relative_path: z.string(),
  hosted_path: z.string(),
  /** The file's text, when held inline. */
  content: optionalText,
  /** Whether the file is stored encrypted: its content is not shown. */
  encrypted: z.boolean(),
  file_size: z.number().int().nullable().optional(),
  mime_type: optionalText,
  created_at: optionalText,
  updated_at: optionalText,
});
export type Artifact = z.infer<typeof ArtifactSchema>;

/** A conversation's files, by name. */
export function useArtifacts(conversationId: string): SWRResponse<Artifact[], Error> {
  const client = useClient();
  const params = { conversation_id: conversationId };
  return useSWR<Artifact[], Error>(client.url(ARTIFACT_ENDPOINT, params), async () =>
    (await client.list(ARTIFACT_ENDPOINT, 'artifacts', ArtifactSchema, params)).sort((a, b) =>
      (a.name ?? a.relative_path).localeCompare(b.name ?? b.relative_path),
    ),
  );
}
