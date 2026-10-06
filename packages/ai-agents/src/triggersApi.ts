// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { useCallback } from 'react';
import useSWR, { type SWRResponse } from 'swr';
import { type GuardedSave, serverInstant, useClient, useGuardedSave, type ZephyrexClient } from 'zephyrex';
import { z } from 'zod';

export const TRIGGER_ENDPOINT = '/v1/invocation-trigger';
export const INSTANCE_ENDPOINT = '/v1/invocation-instance';
export const ACTIVITY_ENDPOINT = '/v1/activity';

/** How often an agent's turns are read again: they run, and end, on the server. */
const TURN_REFRESH_MS = 5000;

export const TRIGGER_TYPES = ['schedule', 'timer', 'event'] as const;
export type TriggerType = (typeof TRIGGER_TYPES)[number];
/** What an event trigger listens for: a message in a conversation the agent is in, a signed call, or mail. */
export const EVENT_SOURCES = ['conversation_message', 'webhook', 'email'] as const;
export type TriggerSource = (typeof EVENT_SOURCES)[number];
const TURN_STATUSES = ['pending', 'running', 'succeeded', 'failed'] as const;
/** A task's urgency: 1 (most urgent) to 5, 3 unless set. */
export const HIGHEST_PRIORITY = 1;
export const LOWEST_PRIORITY = 5;
export const DEFAULT_PRIORITY = 3;

const optionalText = z.string().nullable().optional();
const versioned = { created_at: optionalText, updated_at: optionalText };

/**
 * What makes an agent take a turn, many times over: a schedule (cron), a timer (an interval, or once)
 * or an event. A task is a trigger whose payload is the instructions, with a due time and priority.
 * A webhook trigger's signing secret is never returned; it is shown once when made.
 */
export const TriggerSchema = z.object({
  id: z.string(),
  agent_id: z.string(),
  invocation_type: z.enum(TRIGGER_TYPES),
  enabled: z.boolean(),
  cron: optionalText,
  interval_seconds: z.number().int().nullable().optional(),
  one_shot: z.boolean(),
  event_source: z.enum(EVENT_SOURCES).nullable().optional(),
  /** A JSON object an event must match; an email trigger's has "from" and/or "subject". */
  event_filter: optionalText,
  invocation_payload: optionalText,
  due_at: optionalText,
  priority: z.number().int(),
  /** Set by the server. */
  last_fired_at: optionalText,
  next_fire_at: optionalText,
  fire_count: z.number().int(),
  /** Set by the server for an email trigger: where its mail goes. */
  email_address: optionalText,
  ...versioned,
});
export type Trigger = z.infer<typeof TriggerSchema>;

/** One agent turn: what caused it, what it was handed, and how it ended. */
export const TurnSchema = z.object({
  id: z.string(),
  agent_id: z.string(),
  invocation_trigger_id: optionalText,
  trigger_message_id: optionalText,
  status: z.enum(TURN_STATUSES),
  payload: optionalText,
  error: optionalText,
  started_at: optionalText,
  completed_at: optionalText,
  ...versioned,
});
export type Turn = z.infer<typeof TurnSchema>;

/** Something an agent did during a turn: 0 success, 1 warning, 2 error. */
const ActivitySchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  state: z.number().int().nullable().optional(),
  parent_id: optionalText,
  ability_id: optionalText,
  artifact_id: optionalText,
  created_at: optionalText,
});
export type Activity = z.infer<typeof ActivitySchema>;

/** A turn's activities as a tree: each activity with its sub-activities. */
export interface ActivityNode {
  activity: Activity;
  children: ActivityNode[];
}

/** The server's tree: each activity's id to the activity and its children, the same way. */
interface ActivityTree {
  [id: string]: { activity: Activity; children: ActivityTree };
}

const ActivityTreeSchema: z.ZodType<ActivityTree> = z.lazy(() =>
  z.record(z.string(), z.object({ activity: ActivitySchema, children: ActivityTreeSchema })),
);
const HierarchySchema = z.object({ activities: ActivityTreeSchema });

/** The server's tree as nodes, oldest first at each level. */
export function activityNodes(tree: Readonly<ActivityTree>): ActivityNode[] {
  return Object.values(tree)
    .map(({ activity, children }) => ({ activity, children: activityNodes(children) }))
    .sort((a, b) => (a.activity.created_at ?? '').localeCompare(b.activity.created_at ?? ''));
}

/** A webhook trigger's new signing secret, shown once, and the headers a caller signs with. */
const WebhookSecretSchema = z.object({
  trigger_id: z.string(),
  secret: z.string(),
  timestamp_header: z.string(),
  signature_header: z.string(),
});
export type WebhookSecret = z.infer<typeof WebhookSecretSchema>;

const TriggerEnvelopeSchema = z.object({ invocation_trigger: TriggerSchema });

const path = (endpoint: string, id: string): string => `${endpoint}/${encodeURIComponent(id)}`;
const NO_TIME = '1970-01-01T00:00:00';
const newestFirst = (a: Turn, b: Turn): number =>
  serverInstant(b.created_at ?? NO_TIME).getTime() - serverInstant(a.created_at ?? NO_TIME).getTime();

/** The agent's triggers. */
export function useTriggers(agentId: string): SWRResponse<Trigger[], Error> {
  const client = useClient();
  const params = { agent_id: agentId };
  return useSWR<Trigger[], Error>(client.url(TRIGGER_ENDPOINT, params), async () =>
    client.list(TRIGGER_ENDPOINT, 'invocation_triggers', TriggerSchema, params),
  );
}

/** The agent's turns, newest first, read again every few seconds while they run. */
export function useTurns(agentId: string): SWRResponse<Turn[], Error> {
  const client = useClient();
  const params = { agent_id: agentId };
  return useSWR<Turn[], Error>(
    client.url(INSTANCE_ENDPOINT, params),
    async () => (await client.list(INSTANCE_ENDPOINT, 'invocation_instances', TurnSchema, params)).sort(newestFirst),
    { refreshInterval: TURN_REFRESH_MS },
  );
}

/** A turn's activities as trees. */
export function useActivityTree(turnId: string): SWRResponse<ActivityNode[], Error> {
  const client = useClient();
  const at = `${ACTIVITY_ENDPOINT}/hierarchy/${encodeURIComponent(turnId)}`;
  return useSWR<ActivityNode[], Error>(client.url(at), async () =>
    activityNodes(HierarchySchema.parse(await client.get(at)).activities),
  );
}

/** A trigger's fields as the user sets them; the server checks them and sets the rest. */
export type TriggerFields = Pick<
  Trigger,
  | 'invocation_type'
  | 'enabled'
  | 'cron'
  | 'interval_seconds'
  | 'one_shot'
  | 'event_source'
  | 'event_filter'
  | 'invocation_payload'
  | 'due_at'
  | 'priority'
>;

/** Makes a trigger for the agent; resolves to what the server stored (an email trigger with its address). */
export async function createTrigger(client: ZephyrexClient, agentId: string, fields: TriggerFields): Promise<Trigger> {
  const body = { invocation_trigger: { agent_id: agentId, ...fields } };
  return TriggerEnvelopeSchema.parse(await client.post(TRIGGER_ENDPOINT, body)).invocation_trigger;
}

/** A new signing secret for a webhook trigger, shown once; the old one stops working. */
export async function newWebhookSecret(client: ZephyrexClient, triggerId: string): Promise<WebhookSecret> {
  return WebhookSecretSchema.parse(await client.post(`${path(TRIGGER_ENDPOINT, triggerId)}/webhook-secret`, {}));
}

/** Runs one turn of the agent now, handed `payload`; resolves to the turn, finished. */
export async function takeTurn(client: ZephyrexClient, agentId: string, payload: string | null): Promise<Turn> {
  return TurnSchema.parse(await client.post(`${path('/v1/agent', agentId)}/turn`, { payload }));
}

/** Changing and removing the agent's triggers, each guarded by the trigger as loaded. */
export function useTriggerActions(agentId: string): { update: GuardedSave<Trigger>; remove: GuardedSave<Trigger> } {
  const client = useClient();
  const { mutate: refreshTriggers } = useTriggers(agentId);
  const update = useCallback(
    async (seen: Trigger, changes: Partial<Trigger>): Promise<void> => {
      await client.put(path(TRIGGER_ENDPOINT, seen.id), { invocation_trigger: changes }, seen);
      await refreshTriggers();
    },
    [client, refreshTriggers],
  );
  const remove = useCallback(
    async (seen: Trigger): Promise<void> => {
      await client.delete(path(TRIGGER_ENDPOINT, seen.id), seen);
      await refreshTriggers();
    },
    [client, refreshTriggers],
  );
  return { update: useGuardedSave(update, TriggerSchema), remove: useGuardedSave(remove, TriggerSchema) };
}
