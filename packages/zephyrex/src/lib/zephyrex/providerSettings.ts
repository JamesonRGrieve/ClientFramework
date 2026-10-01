// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import useSWR, { type SWRResponse } from 'swr';
import { z } from 'zod';
import { useClient } from './hooks';
import type { ProviderInstanceSetting } from './useProviderInstances';

const optionalText = z.string().nullable().optional();

/** One setting a provider reads, as it declares it (GET /v1/provider/{id}/settings). */
const ProviderSettingSpecSchema = z.object({
  key: z.string(),
  description: optionalText,
  /** The environment variable read when the instance has no value. */
  env: optionalText,
  /** Used when neither the instance nor the environment sets it. */
  default: z.union([z.string(), z.number(), z.boolean()]).nullable().optional(),
  /** A secret: it can be set or cleared, never read back. */
  write_only: z.boolean(),
  /** Set when the value is the instance's own column (e.g. `api_key`), edited on the instance. */
  field: optionalText,
  /** The value spans lines (a PEM key, a certificate, a JSON blob). */
  multiline: z.boolean().optional(),
});
export type ProviderSettingSpec = z.infer<typeof ProviderSettingSpecSchema>;

const CatalogueSchema = z.object({ provider_id: z.string(), settings: z.array(ProviderSettingSpecSchema) });

const cataloguePath = (providerId: string): string => `/v1/provider/${encodeURIComponent(providerId)}/settings`;

/** The settings `providerId` reads; empty for a provider that declares none. */
export function useProviderSettingCatalogue(providerId: string | null): SWRResponse<ProviderSettingSpec[], Error> {
  const client = useClient();
  return useSWR<ProviderSettingSpec[], Error>(
    providerId === null ? null : cataloguePath(providerId),
    async () => CatalogueSchema.parse(await client.get(cataloguePath(providerId ?? ''))).settings,
  );
}

/** One row of an instance's settings: what the provider declares, and what the instance has stored. */
export interface ProviderSettingRow {
  key: string;
  /** Null for a stored setting the provider no longer declares. */
  spec: ProviderSettingSpec | null;
  /** Null until the instance sets it. */
  setting: ProviderInstanceSetting | null;
  writeOnly: boolean;
}

/**
 * The rows an instance's settings page shows: every setting the provider declares, in its order,
 * then any stored ones it doesn't. A declared value that lives on the instance itself (`field`,
 * e.g. the API key) is edited with the instance, so it has no row here.
 */
export function settingRows(
  catalogue: readonly ProviderSettingSpec[],
  stored: readonly ProviderInstanceSetting[],
): ProviderSettingRow[] {
  const byKey = new Map(stored.map((setting) => [setting.key, setting]));
  const declared = catalogue
    .filter((spec) => spec.field === null || spec.field === undefined || spec.field === '')
    .map((spec) => {
      const setting = byKey.get(spec.key) ?? null;
      return { key: spec.key, spec, setting, writeOnly: spec.write_only || setting?.write_only === true };
    });
  const declaredKeys = new Set(catalogue.map((spec) => spec.key));
  const undeclared = stored
    .filter((setting) => !declaredKeys.has(setting.key))
    .map((setting) => ({ key: setting.key, spec: null, setting, writeOnly: setting.write_only === true }));
  return [...declared, ...undeclared];
}

/** How a provider describes the instance column `field` (e.g. "AWS access key id" for `api_key`). */
export function fieldDescription(catalogue: readonly ProviderSettingSpec[], field: string): string | null {
  return catalogue.find((spec) => spec.field === field)?.description ?? null;
}
