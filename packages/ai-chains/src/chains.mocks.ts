// SPDX-License-Identifier: AGPL-3.0-or-later
// An in-memory chains server for the package's tests and stories (never compiled into dist): the
// chains, steps, runs and step results as the server's REST routes (each change held to the row's
// version), running a chain, and stopping a run. The prompts and abilities steps name are served too.
import { http, HttpResponse, type RequestHandler } from 'msw';
import { notFound, restTable, versionStamp } from 'zephyrex/testing/msw';
import { z } from 'zod';
import {
  type Chain,
  CHAIN_ENDPOINT,
  CHAIN_RUN_ENDPOINT,
  CHAIN_STEP_ENDPOINT,
  ChainRunSchema,
  ChainSchema,
  type ChainRun,
  type ChainStep,
  ChainStepSchema,
  STEP_RESULT_ENDPOINT,
  DEFAULT_MAX_OUTPUT_CHARACTERS,
  DEFAULT_MAX_STEPS,
  DEFAULT_TIMEOUT_SECONDS,
  type StepResult,
  StepResultSchema,
} from './chainsApi';

/** When the fixture's rows were recorded: their version until a test or story changes one. */
export const FIXTURE_VERSION = '2026-10-01T09:00:00.000001';
export const CHAIN_ID = 'digest';
export const RUN_ID = 'run-1';
/** How often the fixture's check may jump back. */
const CHECK_MAX_LOOPS = 3;
/** The fixture chain's last step's place. */
const LAST_POSITION = 3;
/** How long the fixture's finished run's steps took (ms). */
const SEARCH_MS = 1200;
const CHECK_MS = 3;
const SUMMARY_MS = 2500;
/** The steps the fixture's finished run executed, in order, and how long each took. */
const RUN_STEPS: readonly [string, string, number][] = [
  ['search', 'ability', SEARCH_MS],
  ['check', 'condition', CHECK_MS],
  ['summarise', 'prompt', SUMMARY_MS],
];

const PromptSchema = z.object({ id: z.string(), name: z.string(), favourite: z.boolean(), content: z.string() });
const AbilitySchema = z.object({
  id: z.string(),
  name: z.string(),
  friendly_name: z.string().nullable(),
  extension_id: z.string(),
});

export interface ChainStore {
  chains: Chain[];
  steps: ChainStep[];
  runs: ChainRun[];
  results: StepResult[];
  prompts: z.infer<typeof PromptSchema>[];
  abilities: z.infer<typeof AbilitySchema>[];
}

const stamped = { created_at: FIXTURE_VERSION, updated_at: null };

const chain = (id: string, name: string, favourite: boolean): Chain => ({
  id,
  name,
  description: null,
  favourite,
  max_steps: DEFAULT_MAX_STEPS,
  timeout_seconds: DEFAULT_TIMEOUT_SECONDS,
  max_output_characters: DEFAULT_MAX_OUTPUT_CHARACTERS,
  user_id: 'u-me',
  team_id: null,
  ...stamped,
});

const step = (id: string, position: number, fields: Pick<ChainStep, 'name' | 'kind'> & Partial<ChainStep>): ChainStep => ({
  id,
  chain_id: CHAIN_ID,
  position,
  prompt_id: null,
  ability_id: null,
  arguments: null,
  expression: null,
  variable: null,
  on_true: null,
  on_false: null,
  max_loops: null,
  ...stamped,
  ...fields,
});

const run = (id: string, fields: Partial<ChainRun>): ChainRun => ({
  id,
  chain_id: CHAIN_ID,
  user_id: 'u-me',
  status: 'succeeded',
  inputs: null,
  variables: null,
  output: null,
  error: null,
  error_kind: null,
  steps_executed: 0,
  cancel_requested: false,
  started_at: null,
  completed_at: null,
  ...stamped,
  ...fields,
});

const result = (sequence: number, stepName: string, kind: string, durationMs: number): StepResult => ({
  id: `result-${String(sequence)}`,
  chain_run_id: RUN_ID,
  chain_step_id: null,
  step_name: stepName,
  kind,
  sequence,
  status: 'succeeded',
  input: null,
  output: null,
  error: null,
  started_at: null,
  completed_at: null,
  duration_ms: durationMs,
});

/** A favourite chain of four steps (a search, a check, a summary and a set) with a run of each outcome; and a second chain. */
export function chainsFixture(): ChainStore {
  return {
    chains: [chain('empty', 'Blank', false), chain(CHAIN_ID, 'Daily digest', true)],
    steps: [
      step('s-search', 0, {
        name: 'search',
        kind: 'ability',
        ability_id: 'ab-search',
        arguments: { query: 'topic' },
        variable: 'found',
      }),
      step('s-check', 1, {
        name: 'check',
        kind: 'condition',
        expression: 'len(found) > 0',
        on_false: 'end',
        max_loops: CHECK_MAX_LOOPS,
      }),
      step('s-sum', 2, {
        name: 'summarise',
        kind: 'prompt',
        prompt_id: 'brief',
        arguments: { TEXT: 'found' },
        variable: 'summary',
      }),
      step('s-done', LAST_POSITION, { name: 'done', kind: 'set', expression: 'true', variable: 'finished' }),
    ],
    runs: [
      run(RUN_ID, {
        inputs: { topic: 'engines' },
        output: '"Engines are fine."',
        steps_executed: 4,
        started_at: '2026-10-01T09:00:01',
        completed_at: '2026-10-01T09:00:05',
      }),
      run('run-2', {
        status: 'failed',
        error: 'No model answered',
        error_kind: 'step',
        steps_executed: 3,
        created_at: '2026-10-02T09:00:00',
      }),
      run('run-3', { status: 'running', steps_executed: 1, created_at: '2026-10-03T09:00:00' }),
    ],
    results: RUN_STEPS.map(([stepName, kind, durationMs], index) => result(index + 1, stepName, kind, durationMs)),
    prompts: [{ id: 'brief', name: 'Brief', favourite: true, content: 'Summarise {TEXT}.' }],
    abilities: [{ id: 'ab-search', name: 'web_search', friendly_name: 'Search the web', extension_id: 'ext-web' }],
  };
}

const RunBodySchema = z.object({ inputs: z.record(z.string(), z.json()) });

/** The chain routes over `store`, with the prompts and abilities steps name. */
export function chainHandlers(store: ChainStore = chainsFixture()): RequestHandler[] {
  let ran = 0;
  return [
    http.post(`*${CHAIN_ENDPOINT}/:id/run`, async ({ params: { id }, request }) => {
      const found = store.chains.find((row) => row.id === id);
      if (found === undefined) {
        return notFound();
      }
      const { inputs } = RunBodySchema.parse(await request.json());
      ran += 1;
      const steps = store.steps.filter(({ chain_id: owner }) => owner === found.id).length;
      const done = run(`run-new-${String(ran)}`, {
        chain_id: found.id,
        inputs,
        variables: inputs,
        output: steps === 0 ? null : '"Done."',
        steps_executed: steps,
        started_at: versionStamp(),
        completed_at: versionStamp(),
        created_at: versionStamp(),
      });
      store.runs = [...store.runs, done];
      return HttpResponse.json(done);
    }),
    http.post(`*${CHAIN_RUN_ENDPOINT}/:id/cancel`, ({ params: { id } }) => {
      const found = store.runs.find((row) => row.id === id);
      if (found === undefined) {
        return notFound();
      }
      const stopped = ChainRunSchema.parse({
        ...found,
        cancel_requested: true,
        status: found.status === 'pending' ? 'cancelled' : found.status,
        updated_at: versionStamp(),
      });
      store.runs = store.runs.map((row) => (row.id === stopped.id ? stopped : row));
      return HttpResponse.json(stopped);
    }),
    ...restTable({
      rows: () => store.chains,
      set: (rows) => (store.chains = rows),
      schema: ChainSchema,
      endpoint: CHAIN_ENDPOINT,
      single: 'chain',
      plural: 'chains',
      filters: [],
      defaults: {
        favourite: false,
        max_steps: DEFAULT_MAX_STEPS,
        timeout_seconds: DEFAULT_TIMEOUT_SECONDS,
        max_output_characters: DEFAULT_MAX_OUTPUT_CHARACTERS,
        user_id: 'u-me',
      },
    }),
    ...restTable({
      rows: () => store.steps,
      set: (rows) => (store.steps = rows),
      schema: ChainStepSchema,
      endpoint: CHAIN_STEP_ENDPOINT,
      single: 'chain_step',
      plural: 'chain_steps',
      filters: ['chain_id'],
    }),
    ...restTable({
      rows: () => store.runs,
      set: (rows) => (store.runs = rows),
      schema: ChainRunSchema,
      endpoint: CHAIN_RUN_ENDPOINT,
      single: 'chain_run',
      plural: 'chain_runs',
      filters: ['chain_id'],
    }),
    ...restTable({
      rows: () => store.results,
      set: (rows) => (store.results = rows),
      schema: StepResultSchema,
      endpoint: STEP_RESULT_ENDPOINT,
      single: 'chain_step_result',
      plural: 'chain_step_results',
      filters: ['chain_run_id'],
    }),
    ...restTable({
      rows: () => store.prompts,
      set: (rows) => (store.prompts = rows),
      schema: PromptSchema,
      endpoint: '/v1/prompt',
      single: 'prompt',
      plural: 'prompts',
      filters: [],
    }),
    ...restTable({
      rows: () => store.abilities,
      set: (rows) => (store.abilities = rows),
      schema: AbilitySchema,
      endpoint: '/v1/ability',
      single: 'ability',
      plural: 'abilities',
      filters: [],
    }),
  ];
}
