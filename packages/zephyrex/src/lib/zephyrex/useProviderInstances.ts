// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { useCallback } from 'react';
import useSWR, { type SWRResponse } from 'swr';
import { z } from 'zod';
import { useClient } from './hooks';
import type { ProviderExtensionLink, ProviderInstance } from './providerScope';

const INSTANCES_PATH = '/v1/provider/instance';
const LINKS_PATH = '/v1/provider/extension';
const SETTINGS_PATH = '/v1/provider/instance/setting';
const USAGE_PATH = '/v1/provider/instance/usage';

const optionalText = z.string().nullable().optional();

const ProviderExtensionLinkSchema = z.object({ provider_id: z.string(), extension_id: z.string() });

const ProviderInstanceSchema = z.object({
  id: z.string(),
  name: z.string(),
  provider_id: z.string(),
  model_name: optionalText,
  enabled: z.boolean().nullable().optional(),
  scope: z.enum(['root', 'system', 'team', 'user']).optional(),
  created_at: z.string(),
  updated_at: optionalText,
});

const SettingSchema = z.object({
  id: z.string(),
  provider_instance_id: z.string(),
  key: z.string(),
  /** Always null for a write-only setting: the server keeps the value encrypted and never returns it. */
  value: optionalText,
  write_only: z.boolean().optional(),
  updated_at: optionalText,
});
export type ProviderInstanceSetting = z.infer<typeof SettingSchema>;
const SettingEnvelopeSchema = z.object({ provider_instance_setting: SettingSchema });

const UsageSchema = z.object({
  id: z.string(),
  key: optionalText,
  value: z.number().nullable().optional(),
  updated_at: optionalText,
});
export type ProviderInstanceUsage = z.infer<typeof UsageSchema>;

/** Which extensions each provider supports. */
export function useProviderExtensionLinks(): SWRResponse<ProviderExtensionLink[], Error> {
  const client = useClient();
  return useSWR<ProviderExtensionLink[], Error>(
    LINKS_PATH,
    async () =>
      z.object({ provider_extensions: z.array(ProviderExtensionLinkSchema) }).parse(await client.get(LINKS_PATH))
        .provider_extensions,
  );
}

/** Every provider instance the signed-in user can see. */
export function useProviderInstances(): SWRResponse<ProviderInstance[], Error> {
  const client = useClient();
  return useSWR<ProviderInstance[], Error>(
    INSTANCES_PATH,
    async () =>
      z.object({ provider_instances: z.array(ProviderInstanceSchema) }).parse(await client.get(INSTANCES_PATH))
        .provider_instances,
  );
}

const byInstance = (entity: string, instanceId: string): Record<string, Record<string, { eq: string }>> => ({
  [entity]: { provider_instance_id: { eq: instanceId } },
});

/** An instance's settings and usage records, found with the generic search routes. */
export function useProviderInstanceDetail(instanceId: string | null): {
  settings: SWRResponse<ProviderInstanceSetting[], Error>;
  usage: SWRResponse<ProviderInstanceUsage[], Error>;
} {
  const client = useClient();
  const settings = useSWR<ProviderInstanceSetting[], Error>(
    instanceId === null ? null : [SETTINGS_PATH, instanceId],
    async () =>
      z
        .object({ provider_instance_settings: z.array(SettingSchema) })
        .parse(await client.post(`${SETTINGS_PATH}/search`, byInstance('provider_instance_setting', instanceId ?? '')))
        .provider_instance_settings,
  );
  const usage = useSWR<ProviderInstanceUsage[], Error>(
    instanceId === null ? null : [USAGE_PATH, instanceId],
    async () =>
      z
        .object({ provider_instance_usages: z.array(UsageSchema) })
        .parse(await client.post(`${USAGE_PATH}/search`, byInstance('provider_instance_usage', instanceId ?? '')))
        .provider_instance_usages,
  );
  return { settings, usage };
}

export type NewProviderInstance = {
  name: string;
  provider_id: string;
  /** The owner of a user-scoped instance. */
  user_id?: string;
  model_name?: string;
  /** Write-only: sent once, never returned. */
  api_key?: string;
};

/** Fields an instance edit may change; omit `api_key` to keep the stored credential. */
export type ProviderInstanceChanges = Partial<Pick<NewProviderInstance, 'name' | 'model_name' | 'api_key'>> & {
  enabled?: boolean;
};

const InstanceEnvelopeSchema = z.object({ provider_instance: ProviderInstanceSchema });

/** Create, change and delete provider instances and their settings; each refreshes the instance list. */
export function useProviderInstanceActions(): {
  create: (instance: NewProviderInstance) => Promise<ProviderInstance>;
  update: (id: string, changes: ProviderInstanceChanges) => Promise<ProviderInstance>;
  remove: (id: string) => Promise<void>;
  updateSetting: (setting: ProviderInstanceSetting, value: string) => Promise<void>;
  createSetting: (instanceId: string, key: string, value: string) => Promise<ProviderInstanceSetting>;
  /** Deleting is the only way to clear a write-only setting. */
  removeSetting: (setting: ProviderInstanceSetting) => Promise<void>;
} {
  const client = useClient();
  const { mutate } = useProviderInstances();

  const create = useCallback(
    async (instance: NewProviderInstance): Promise<ProviderInstance> => {
      const created = InstanceEnvelopeSchema.parse(await client.post(INSTANCES_PATH, { provider_instance: instance }));
      await mutate();
      return created.provider_instance;
    },
    [client, mutate],
  );

  const update = useCallback(
    async (id: string, changes: ProviderInstanceChanges): Promise<ProviderInstance> => {
      const updated = InstanceEnvelopeSchema.parse(
        await client.put(`${INSTANCES_PATH}/${encodeURIComponent(id)}`, { provider_instance: changes }),
      );
      await mutate();
      return updated.provider_instance;
    },
    [client, mutate],
  );

  const remove = useCallback(
    async (id: string): Promise<void> => {
      await client.delete(`${INSTANCES_PATH}/${encodeURIComponent(id)}`);
      await mutate();
    },
    [client, mutate],
  );

  const updateSetting = useCallback(
    async (setting: ProviderInstanceSetting, value: string): Promise<void> => {
      await client.put(`${SETTINGS_PATH}/${encodeURIComponent(setting.id)}`, { provider_instance_setting: { value } });
    },
    [client],
  );

  const createSetting = useCallback(
    async (instanceId: string, key: string, value: string): Promise<ProviderInstanceSetting> =>
      SettingEnvelopeSchema.parse(
        await client.post(SETTINGS_PATH, {
          provider_instance_setting: { provider_instance_id: instanceId, key, value },
        }),
      ).provider_instance_setting,
    [client],
  );

  const removeSetting = useCallback(
    async (setting: ProviderInstanceSetting): Promise<void> => {
      await client.delete(`${SETTINGS_PATH}/${encodeURIComponent(setting.id)}`);
    },
    [client],
  );

  return { create, update, remove, updateSetting, createSetting, removeSetting };
}
