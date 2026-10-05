// SPDX-License-Identifier: AGPL-3.0-or-later
// An in-memory prompts server for the package's tests and stories (never compiled into dist): the
// user's prompts and their arguments, each change held to its version, and building a prompt as
// the server does (values given, then the arguments' defaults; the rest reported missing).
import { http, HttpResponse, type RequestHandler } from 'msw';
import { refuseStale, versionStamp } from 'zephyrex/testing/msw';
import { z } from 'zod';
import { argumentNameProblem, VARIABLE, variablesIn } from './promptModel';
import { type Argument, ARGUMENT_ENDPOINT, ArgumentSchema, type Prompt, PROMPT_ENDPOINT, PromptSchema } from './promptsApi';

const HTTP_CREATED = 201;
const HTTP_NO_CONTENT = 204;
const HTTP_NOT_FOUND = 404;
const HTTP_UNPROCESSABLE = 422;

/** When the fixture's rows were recorded: their version until a test or story changes one. */
export const FIXTURE_VERSION = '2026-10-01T09:00:00.000001';
export const SUMMARY_ID = 'summary';
export const GREETING_ID = 'greeting';

export interface PromptStore {
  prompts: Prompt[];
  args: Argument[];
}

const prompt = (id: string, name: string, content: string, favourite: boolean): Prompt => ({
  id,
  name,
  description: null,
  favourite,
  content,
  user_id: 'u-me',
  team_id: null,
  created_at: FIXTURE_VERSION,
  updated_at: null,
});

const argument = (id: string, promptId: string, name: string, defaultValue: string | null): Argument => ({
  id,
  prompt_id: promptId,
  name,
  default_value: defaultValue,
  created_at: FIXTURE_VERSION,
  updated_at: null,
});

/** A favourite summary prompt with one argument defaulted and one variable without an argument, and a plain greeting. */
export function promptsFixture(): PromptStore {
  return {
    prompts: [
      prompt(GREETING_ID, 'Greeting', 'Say hello.', false),
      prompt(SUMMARY_ID, 'Summary', 'Summarise {TOPIC} for {AUDIENCE} in {LENGTH} words.', true),
    ],
    args: [
      argument('arg-audience', SUMMARY_ID, 'AUDIENCE', 'engineers'),
      argument('arg-length', SUMMARY_ID, 'LENGTH', null),
    ],
  };
}

/** A store with nothing in it. */
export const emptyPromptStore = (): PromptStore => ({ prompts: [], args: [] });

/** The row `id` of `rows`; a test or story naming one that isn't there is a mistake in it. */
export function rowOf<T extends { id: string }>(rows: readonly T[], id: string): T {
  const found = rows.find((row) => row.id === id);
  if (found === undefined) {
    throw new Error(`No row ${id} in the fixture`);
  }
  return found;
}

const PromptBodySchema = z.object({ prompt: PromptSchema.omit({ id: true }).partial() });
const ArgumentBodySchema = z.object({ prompt_argument: ArgumentSchema.omit({ id: true }).partial() });
const BuildBodySchema = z.object({ variables: z.record(z.string(), z.string()).default({}) });

/** The fields a partial body actually sets, without the ones it leaves undefined. */
const defined = (fields: object): Record<string, unknown> =>
  Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined));

const notFound = (): Response => HttpResponse.json({ detail: 'Not found' }, { status: HTTP_NOT_FOUND });

/** The prompt routes over `store`. */
export function promptHandlers(store: PromptStore = promptsFixture()): RequestHandler[] {
  let created = 0;
  const nextId = (prefix: string): string => `${prefix}-${String(++created)}`;
  const findRow = <T extends { id: string }>(
    rows: readonly T[],
    id: string | readonly string[] | undefined,
  ): T | undefined => rows.find((row) => row.id === id);

  return [
    http.get(`*${PROMPT_ENDPOINT}`, () => HttpResponse.json({ prompts: store.prompts })),
    http.get(`*${PROMPT_ENDPOINT}/:id`, ({ params: { id } }) => {
      const found = findRow(store.prompts, id);
      return found === undefined ? notFound() : HttpResponse.json({ prompt: found });
    }),
    http.post(`*${PROMPT_ENDPOINT}/:id/build`, async ({ params: { id }, request }) => {
      const found = findRow(store.prompts, id);
      if (found === undefined) {
        return notFound();
      }
      const { variables } = BuildBodySchema.parse(await request.json());
      const values: Record<string, string> = {};
      for (const { name, default_value: value } of store.args.filter(({ prompt_id: owner }) => owner === found.id)) {
        if (name !== null && name !== undefined && value !== null && value !== undefined) {
          values[name] = value;
        }
      }
      Object.assign(values, variables);
      const text = found.content.replace(VARIABLE, (whole: string, name: string) => values[name] ?? whole);
      return HttpResponse.json({ text, missing: variablesIn(found.content).filter((name) => !(name in values)) });
    }),
    http.post(`*${PROMPT_ENDPOINT}`, async ({ request }) => {
      const { prompt: fields } = PromptBodySchema.parse(await request.json());
      const row = PromptSchema.parse({
        ...prompt(nextId('prompt'), '', '', false),
        ...defined(fields),
        created_at: versionStamp(),
      });
      store.prompts.push(row);
      return HttpResponse.json({ prompt: row }, { status: HTTP_CREATED });
    }),
    http.put(`*${PROMPT_ENDPOINT}/:id`, async ({ params: { id }, request }) => {
      const current = findRow(store.prompts, id);
      if (current === undefined) {
        return notFound();
      }
      const refused = refuseStale(request, current);
      if (refused !== null) {
        return refused;
      }
      const { prompt: fields } = PromptBodySchema.parse(await request.json());
      const updated = PromptSchema.parse({ ...current, ...defined(fields), updated_at: versionStamp() });
      store.prompts = store.prompts.map((row) => (row.id === current.id ? updated : row));
      return HttpResponse.json({ prompt: updated });
    }),
    http.delete(`*${PROMPT_ENDPOINT}/:id`, ({ params: { id }, request }) => {
      const current = findRow(store.prompts, id);
      if (current === undefined) {
        return notFound();
      }
      const refused = refuseStale(request, current);
      if (refused !== null) {
        return refused;
      }
      store.prompts = store.prompts.filter((row) => row.id !== current.id);
      store.args = store.args.filter((row) => row.prompt_id !== current.id);
      return new HttpResponse(null, { status: HTTP_NO_CONTENT });
    }),

    http.get(`*${ARGUMENT_ENDPOINT}`, ({ request }) => {
      const promptId = new URL(request.url).searchParams.get('prompt_id');
      return HttpResponse.json({
        prompt_arguments: store.args.filter((row) => promptId === null || row.prompt_id === promptId),
      });
    }),
    http.post(`*${ARGUMENT_ENDPOINT}`, async ({ request }) => {
      const { prompt_argument: fields } = ArgumentBodySchema.parse(await request.json());
      if (argumentNameProblem(fields.name ?? '') !== null) {
        return HttpResponse.json(
          { detail: "An argument's name is a variable name (A-Z, 0-9, _)" },
          { status: HTTP_UNPROCESSABLE },
        );
      }
      if (findRow(store.prompts, fields.prompt_id ?? '') === undefined) {
        return notFound();
      }
      const row = ArgumentSchema.parse({
        ...argument(nextId('arg'), '', '', null),
        ...defined(fields),
        created_at: versionStamp(),
      });
      store.args.push(row);
      return HttpResponse.json({ prompt_argument: row }, { status: HTTP_CREATED });
    }),
    http.put(`*${ARGUMENT_ENDPOINT}/:id`, async ({ params: { id }, request }) => {
      const current = findRow(store.args, id);
      if (current === undefined) {
        return notFound();
      }
      const refused = refuseStale(request, current);
      if (refused !== null) {
        return refused;
      }
      const { prompt_argument: fields } = ArgumentBodySchema.parse(await request.json());
      const updated = ArgumentSchema.parse({ ...current, ...fields, updated_at: versionStamp() });
      store.args = store.args.map((row) => (row.id === current.id ? updated : row));
      return HttpResponse.json({ prompt_argument: updated });
    }),
    http.delete(`*${ARGUMENT_ENDPOINT}/:id`, ({ params: { id }, request }) => {
      const current = findRow(store.args, id);
      if (current === undefined) {
        return notFound();
      }
      const refused = refuseStale(request, current);
      if (refused !== null) {
        return refused;
      }
      store.args = store.args.filter((row) => row.id !== current.id);
      return new HttpResponse(null, { status: HTTP_NO_CONTENT });
    }),
  ];
}
