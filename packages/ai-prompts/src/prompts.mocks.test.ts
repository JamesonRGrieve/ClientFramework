// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { fetchFrom } from 'zephyrex/testing/msw';
import { FIXTURE_VERSION, promptHandlers, promptsFixture, SUMMARY_ID } from './prompts.mocks';
import { BuiltPromptSchema } from './promptsApi';

const BASE = 'http://localhost:1996';
const HTTP_OK = 200;
const HTTP_PRECONDITION_FAILED = 412;
const HTTP_UNPROCESSABLE = 422;
const HTTP_PRECONDITION_REQUIRED = 428;
const LOADED = `"${FIXTURE_VERSION}"`;

const request = (method: string, body?: object, ifMatch?: string): RequestInit => ({
  method,
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  headers: ifMatch === undefined ? {} : { 'If-Match': ifMatch },
});

describe('the mock prompts server', () => {
  it('builds a prompt from the values given, then the defaults, reporting what is missing', async () => {
    const serve = fetchFrom(promptHandlers());
    const build = async (variables: object): Promise<unknown> =>
      (await serve(`${BASE}/v1/prompt/${SUMMARY_ID}/build`, request('POST', { variables }))).json();
    expect(BuiltPromptSchema.parse(await build({ TOPIC: 'rust' }))).toEqual({
      text: 'Summarise rust for engineers in {LENGTH} words.',
      missing: ['LENGTH'],
    });
    expect(BuiltPromptSchema.parse(await build({ TOPIC: 'go', AUDIENCE: 'kids', LENGTH: '50' })).missing).toEqual([]);
  });

  it('holds a change to its version, and names an argument only as a variable', async () => {
    const store = promptsFixture();
    const serve = fetchFrom(promptHandlers(store));
    const url = `${BASE}/v1/prompt/${SUMMARY_ID}`;
    const rename = { prompt: { name: 'Brief' } };
    expect((await serve(url, request('PUT', rename))).status).toBe(HTTP_PRECONDITION_REQUIRED);
    expect((await serve(url, request('PUT', rename, LOADED))).status).toBe(HTTP_OK);
    expect((await serve(url, request('PUT', rename, LOADED))).status).toBe(HTTP_PRECONDITION_FAILED);
    const badName = { prompt_argument: { prompt_id: SUMMARY_ID, name: 'topic' } };
    expect((await serve(`${BASE}/v1/prompt-argument`, request('POST', badName))).status).toBe(HTTP_UNPROCESSABLE);
  });
});
