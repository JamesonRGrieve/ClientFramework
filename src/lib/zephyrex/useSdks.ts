// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import useSWR, { type SWRResponse } from 'swr';
import { z } from 'zod';
import { useClient } from './hooks';

export const SDK_LIST_PATH = '/v1/sdk';

/** Where one SDK's zip downloads from. */
export const sdkDownloadPath = (language: string): string => `${SDK_LIST_PATH}/${encodeURIComponent(language)}/download`;

/** A generated client SDK: `size` is the zip's length in bytes, `sha256` the hex digest of exactly those bytes. */
const SdkSchema = z.object({
  language: z.string(),
  extension: z.string(),
  version: z.string(),
  filename: z.string(),
  size: z.number().int().nonnegative(),
  sha256: z.string().regex(/^[\da-f]{64}$/),
});
export type Sdk = z.infer<typeof SdkSchema>;

const SdkListSchema = z.object({ sdks: z.array(SdkSchema) });

/** The client SDKs this server has generated, for any signed-in user; an SDK not yet generated isn't listed. */
export function useSdks(): SWRResponse<Sdk[], Error> {
  const client = useClient();
  return useSWR<Sdk[], Error>(
    client.url(SDK_LIST_PATH),
    async () => SdkListSchema.parse(await client.get(SDK_LIST_PATH)).sdks,
  );
}
