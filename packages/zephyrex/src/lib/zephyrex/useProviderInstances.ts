// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { useCallback } from 'react';
import useSWR, { type SWRResponse } from 'swr';
import { z } from 'zod';
import { useClient } from './hooks';
import type { ProviderExtensionLink, ProviderInstance } from './providerScope';
import { type GuardedSave, useGuardedSave } from './useGuardedSave';

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
  created_at: optionalText,
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

/** An instance as an edit sees it: its fields, and the write-only key an edit may replace. */
export type EditableProviderInstance = ProviderInstance & { api_key?: string | undefined };
const EditableInstanceSchema = ProviderInstanceSchema.extend({ api_key: z.string().optional() });

export interface ProviderInstanceActions {
  create: (instance: NewProviderInstance) => Promise<ProviderInstance>;
  /** `update.save(instance, changes)`: change an instance, guarded by it as loaded. */
  update: GuardedSave<EditableProviderInstance>;
  /** `remove.save(instance, {})`: delete an instance, guarded by it as loaded. */
  remove: GuardedSave<EditableProviderInstance>;
  /** `updateSetting.save(setting, { value })`; the caller refreshes the settings it shows. */
  updateSetting: GuardedSave<ProviderInstanceSetting>;
  createSetting: (instanceId: string, key: string, value: string) => Promise<ProviderInstanceSetting>;
  /**
   * `removeSetting.save(setting, {})`. Deleting is the only way to clear a write-only setting; the
   * caller refreshes the settings it shows.
   */
  removeSetting: GuardedSave<ProviderInstanceSetting>;
}

/** Create, change and delete provider instances and their settings; instance writes refresh the instance list. */
export function useProviderInstanceActions(): ProviderInstanceActions {
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
    async (seen: EditableProviderInstance, changes: Partial<EditableProviderInstance>): Promise<void> => {
      await client.put(`${INSTANCES_PATH}/${encodeURIComponent(seen.id)}`, { provider_instance: changes }, seen);
      await mutate();
    },
    [client, mutate],
  );

  const remove = useCallback(
    async (seen: EditableProviderInstance): Promise<void> => {
      await client.delete(`${INSTANCES_PATH}/${encodeURIComponent(seen.id)}`, seen);
      await mutate();
    },
    [client, mutate],
  );

  const updateSetting = useCallback(
    async (seen: ProviderInstanceSetting, changes: Partial<ProviderInstanceSetting>): Promise<void> => {
      await client.put(
        `${SETTINGS_PATH}/${encodeURIComponent(seen.id)}`,
        { provider_instance_setting: { value: changes.value } },
        seen,
      );
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
    async (seen: ProviderInstanceSetting): Promise<void> => {
      await client.delete(`${SETTINGS_PATH}/${encodeURIComponent(seen.id)}`, seen);
    },
    [client],
  );

  return {
    create,
    update: useGuardedSave(update, EditableInstanceSchema),
    remove: useGuardedSave(remove, EditableInstanceSchema),
    updateSetting: useGuardedSave(updateSetting, SettingSchema),
    createSetting,
    removeSetting: useGuardedSave(removeSetting, SettingSchema),
  };
}
