// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { useCallback } from 'react';
import useSWR, { type SWRResponse } from 'swr';
import { ApiError, type GuardedSave, serverInstant, useClient, useGuardedSave, type ZephyrexClient } from 'zephyrex';
import { z } from 'zod';

export const CHAIN_ENDPOINT = '/v1/chain';
export const CHAIN_STEP_ENDPOINT = '/v1/chain-step';
export const CHAIN_RUN_ENDPOINT = '/v1/chain-run';
export const STEP_RESULT_ENDPOINT = '/v1/chain-step-result';

const HTTP_NOT_FOUND = 404;
/** How often a chain's runs are read again while one may still be running. */
const RUN_REFRESH_MS = 5000;

/** A chain's bounds as the server sets them unless raised, and the ceilings an owner may raise them to. */
export const DEFAULT_MAX_STEPS = 100;
export const MAX_MAX_STEPS = 10_000;
export const DEFAULT_TIMEOUT_SECONDS = 300;
export const MAX_TIMEOUT_SECONDS = 3600;
export const DEFAULT_MAX_OUTPUT_CHARACTERS = 20_000;
export const MAX_MAX_OUTPUT_CHARACTERS = 100_000;
export const MAX_LOOPS = 1000;

export const STEP_KINDS = ['prompt', 'ability', 'condition', 'set'] as const;
export type StepKind = (typeof STEP_KINDS)[number];
const RUN_STATUSES = ['pending', 'running', 'succeeded', 'failed', 'cancelled'] as const;
export type RunStatus = (typeof RUN_STATUSES)[number];

const optionalText = z.string().nullable().optional();
/** The row's version, sent back verbatim as If-Match on every change. */
const versioned = { created_at: optionalText, updated_at: optionalText };

/** A chain: steps run in order, within its bounds, as its owner. Its owner and team never change. */
export const ChainSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: optionalText,
  favourite: z.boolean(),
  max_steps: z.number().int(),
  timeout_seconds: z.number().int(),
  max_output_characters: z.number().int(),
  user_id: optionalText,
  team_id: optionalText,
  ...versioned,
});
export type Chain = z.infer<typeof ChainSchema>;

/**
 * One step: a prompt (its {VARIABLE}s filled from `arguments`), an ability (called with `arguments`), a
 * condition (jumping to `on_true` or `on_false`, "end" to stop) or a set (`expression` into `variable`).
 * `arguments` and `expression` are expressions over the run's variables.
 */
export const ChainStepSchema = z.object({
  id: z.string(),
  chain_id: z.string(),
  name: z.string(),
  position: z.number().int(),
  kind: z.enum(STEP_KINDS),
  prompt_id: optionalText,
  ability_id: optionalText,
  arguments: z.record(z.string(), z.string()).nullable().optional(),
  expression: optionalText,
  variable: optionalText,
  on_true: optionalText,
  on_false: optionalText,
  max_loops: z.number().int().nullable().optional(),
  ...versioned,
});
export type ChainStep = z.infer<typeof ChainStepSchema>;

/** One run of a chain: what it started with, where it got to, and how it ended (all but asking it to stop set by the server). */
export const ChainRunSchema = z.object({
  id: z.string(),
  chain_id: z.string(),
  user_id: optionalText,
  status: z.enum(RUN_STATUSES),
  inputs: z.record(z.string(), z.json()).nullable().optional(),
  /** The variables when it ended. */
  variables: z.record(z.string(), z.json()).nullable().optional(),
  /** The last step's output, as JSON. */
  output: optionalText,
  error: optionalText,
  /** definition | limit | timeout | step | cancelled | error */
  error_kind: optionalText,
  steps_executed: z.number().int(),
  cancel_requested: z.boolean(),
  started_at: optionalText,
  completed_at: optionalText,
  ...versioned,
});
export type ChainRun = z.infer<typeof ChainRunSchema>;

/** One step a run executed (a step in a loop has one for each time): its input and output as JSON, and timing. */
export const StepResultSchema = z.object({
  id: z.string(),
  chain_run_id: z.string(),
  chain_step_id: optionalText,
  step_name: z.string(),
  kind: z.string(),
  sequence: z.number().int(),
  status: z.string(),
  input: optionalText,
  output: optionalText,
  error: optionalText,
  started_at: optionalText,
  completed_at: optionalText,
  duration_ms: z.number().int().nullable().optional(),
});
export type StepResult = z.infer<typeof StepResultSchema>;

const ChainEnvelopeSchema = z.object({ chain: ChainSchema });

const path = (endpoint: string, id: string): string => `${endpoint}/${encodeURIComponent(id)}`;
const NO_TIME = '1970-01-01T00:00:00';
const createdAt = ({ created_at: created }: { created_at?: string | null | undefined }): number =>
  serverInstant(created ?? NO_TIME).getTime();

/** Favourites first, then by name. */
const byFavouriteThenName = (a: Chain, b: Chain): number =>
  Number(b.favourite) - Number(a.favourite) || a.name.localeCompare(b.name);

/** Steps in the order they run: by position, then as made. */
const byRunOrder = (a: ChainStep, b: ChainStep): number => a.position - b.position || createdAt(a) - createdAt(b);

/** The chains the user can see, favourites first. */
export function useChains(): SWRResponse<Chain[], Error> {
  const client = useClient();
  return useSWR<Chain[], Error>(client.url(CHAIN_ENDPOINT), async () =>
    (await client.list(CHAIN_ENDPOINT, 'chains', ChainSchema)).sort(byFavouriteThenName),
  );
}

/** One chain, or `null` when it doesn't exist or isn't the user's to see (the server answers 404 for both). */
export function useChain(id: string): SWRResponse<Chain | null, Error> {
  const client = useClient();
  return useSWR<Chain | null, Error>(client.url(path(CHAIN_ENDPOINT, id)), async () => {
    try {
      return ChainEnvelopeSchema.parse(await client.get(path(CHAIN_ENDPOINT, id))).chain;
    } catch (error) {
      if (error instanceof ApiError && error.status === HTTP_NOT_FOUND) {
        return null;
      }
      throw error;
    }
  });
}

/** The chain's steps in the order they run. */
export function useChainSteps(chainId: string): SWRResponse<ChainStep[], Error> {
  const client = useClient();
  const params = { chain_id: chainId };
  return useSWR<ChainStep[], Error>(client.url(CHAIN_STEP_ENDPOINT, params), async () =>
    (await client.list(CHAIN_STEP_ENDPOINT, 'chain_steps', ChainStepSchema, params)).sort(byRunOrder),
  );
}

/** The chain's runs, newest first, read again every few seconds while one may still be running. */
export function useChainRuns(chainId: string): SWRResponse<ChainRun[], Error> {
  const client = useClient();
  const params = { chain_id: chainId };
  return useSWR<ChainRun[], Error>(
    client.url(CHAIN_RUN_ENDPOINT, params),
    async () =>
      (await client.list(CHAIN_RUN_ENDPOINT, 'chain_runs', ChainRunSchema, params)).sort(
        (a, b) => createdAt(b) - createdAt(a),
      ),
    { refreshInterval: RUN_REFRESH_MS },
  );
}

/** The steps a run executed, in the order they ran. */
export function useStepResults(runId: string): SWRResponse<StepResult[], Error> {
  const client = useClient();
  const params = { chain_run_id: runId };
  return useSWR<StepResult[], Error>(client.url(STEP_RESULT_ENDPOINT, params), async () =>
    (await client.list(STEP_RESULT_ENDPOINT, 'chain_step_results', StepResultSchema, params)).sort(
      (a, b) => a.sequence - b.sequence,
    ),
  );
}

/** What a new chain is made from; its bounds are the server's defaults until raised. */
export interface NewChain {
  name: string;
  description: string | null;
}

/** Makes a chain the user's; resolves to what the server stored. */
export async function createChain(client: ZephyrexClient, chain: NewChain): Promise<Chain> {
  const body = { chain: { ...chain } };
  return ChainEnvelopeSchema.parse(await client.post(CHAIN_ENDPOINT, body)).chain;
}

/** A step's fields as the user sets them; the server checks them against its kind. */
export type StepFields = Omit<ChainStep, 'id' | 'chain_id' | 'created_at' | 'updated_at'>;

/** Adds a step to the chain. */
export async function addStep(client: ZephyrexClient, chainId: string, fields: StepFields): Promise<void> {
  await client.post(CHAIN_STEP_ENDPOINT, { chain_step: { chain_id: chainId, ...fields } });
}

/** A run's starting variables: each name an identifier, each value any JSON. */
export type Inputs = NonNullable<ChainRun['inputs']>;

/** Runs the chain now with `inputs` as its starting variables; resolves to the run, finished. */
export async function runChain(client: ZephyrexClient, chainId: string, inputs: Inputs): Promise<ChainRun> {
  return ChainRunSchema.parse(await client.post(`${path(CHAIN_ENDPOINT, chainId)}/run`, { inputs }));
}

/** Asks a run to stop: a pending one is cancelled at once, a running one before its next step. */
export async function cancelRun(client: ZephyrexClient, runId: string, reason: string | null): Promise<ChainRun> {
  return ChainRunSchema.parse(await client.post(`${path(CHAIN_RUN_ENDPOINT, runId)}/cancel`, { reason }));
}

export interface ChainActions {
  /** `update.save(chain, changes)`: change it, guarded by it as loaded. */
  update: GuardedSave<Chain>;
  /** `remove.save(chain, {})`: delete it, guarded by it as loaded. */
  remove: GuardedSave<Chain>;
}

/** The writes to chain `id`, each refreshing the chains (and the chain) shown. */
export function useChainActions(id: string): ChainActions {
  const client = useClient();
  const { mutate: refreshChains } = useChains();
  const { mutate: refreshChain } = useChain(id);
  const update = useCallback(
    async (seen: Chain, changes: Partial<Chain>): Promise<void> => {
      await client.put(path(CHAIN_ENDPOINT, seen.id), { chain: changes }, seen);
      await Promise.all([refreshChains(), refreshChain()]);
    },
    [client, refreshChains, refreshChain],
  );
  const remove = useCallback(
    async (seen: Chain): Promise<void> => {
      await client.delete(path(CHAIN_ENDPOINT, seen.id), seen);
      await refreshChains();
    },
    [client, refreshChains],
  );
  return { update: useGuardedSave(update, ChainSchema), remove: useGuardedSave(remove, ChainSchema) };
}

/** Changing and removing the chain's steps, each guarded by the step as loaded. */
export function useChainStepActions(chainId: string): { update: GuardedSave<ChainStep>; remove: GuardedSave<ChainStep> } {
  const client = useClient();
  const { mutate: refreshSteps } = useChainSteps(chainId);
  const update = useCallback(
    async (seen: ChainStep, changes: Partial<ChainStep>): Promise<void> => {
      await client.put(path(CHAIN_STEP_ENDPOINT, seen.id), { chain_step: changes }, seen);
      await refreshSteps();
    },
    [client, refreshSteps],
  );
  const remove = useCallback(
    async (seen: ChainStep): Promise<void> => {
      await client.delete(path(CHAIN_STEP_ENDPOINT, seen.id), seen);
      await refreshSteps();
    },
    [client, refreshSteps],
  );
  return { update: useGuardedSave(update, ChainStepSchema), remove: useGuardedSave(remove, ChainStepSchema) };
}
