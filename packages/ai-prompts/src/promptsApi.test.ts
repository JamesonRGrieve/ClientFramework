// SPDX-License-Identifier: AGPL-3.0-or-later
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ZephyrexClient } from 'zephyrex';
import { TestWrapper, testConfig } from 'zephyrex/testing';
import { type Call, recordingFetch, rowOf, writesOf } from 'zephyrex/testing/msw';
import { FIXTURE_VERSION, GREETING_ID, promptHandlers, promptsFixture, SUMMARY_ID } from './prompts.mocks';
import {
  buildPrompt,
  createArgument,
  createPrompt,
  useArgumentActions,
  useArguments,
  usePrompt,
  usePromptActions,
  usePrompts,
} from './promptsApi';

const client = new ZephyrexClient({ baseUrl: testConfig.server.baseUrl });

describe('the prompts API', () => {
  let store = promptsFixture();
  let calls: Call[] = [];

  beforeEach(() => {
    store = promptsFixture();
    const recorded = recordingFetch(promptHandlers(store));
    calls = recorded.calls;
    vi.stubGlobal('fetch', vi.fn(recorded.fetch));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reads the prompts favourites first, one prompt or null, and a prompt’s arguments by name', async () => {
    const all = renderHook(() => usePrompts(), { wrapper: TestWrapper }).result;
    await waitFor(() => {
      expect(all.current.data?.map(({ id }) => id)).toEqual([SUMMARY_ID, GREETING_ID]);
    });
    const gone = renderHook(() => usePrompt('gone'), { wrapper: TestWrapper }).result;
    await waitFor(() => {
      expect(gone.current.data).toBeNull();
    });
    const args = renderHook(() => useArguments(SUMMARY_ID), { wrapper: TestWrapper }).result;
    await waitFor(() => {
      expect(args.current.data?.map(({ name }) => name)).toEqual(['AUDIENCE', 'LENGTH']);
    });
  });

  it('stores prompts and arguments, builds a prompt, and guards each change by the row as loaded', async () => {
    await createPrompt(client, { name: 'New', description: null, content: '{X}' });
    await createArgument(client, SUMMARY_ID, 'TOPIC', 'rust');
    await expect(buildPrompt(client, SUMMARY_ID, { LENGTH: '9' })).resolves.toEqual({
      text: 'Summarise rust for engineers in 9 words.',
      missing: [],
    });
    const prompts = renderHook(() => usePromptActions(SUMMARY_ID), { wrapper: TestWrapper }).result;
    const args = renderHook(() => useArgumentActions(SUMMARY_ID), { wrapper: TestWrapper }).result;
    await expect(prompts.current.update.save(rowOf(store.prompts, SUMMARY_ID), { favourite: false })).resolves.toBe(true);
    await expect(args.current.update.save(rowOf(store.args, 'arg-length'), { default_value: '100' })).resolves.toBe(true);
    await expect(args.current.remove.save(rowOf(store.args, 'arg-audience'), {})).resolves.toBe(true);
    expect(writesOf(calls)).toEqual([
      ['POST', '/v1/prompt', '{"prompt":{"name":"New","description":null,"content":"{X}"}}', null],
      [
        'POST',
        '/v1/prompt-argument',
        '{"prompt_argument":{"prompt_id":"summary","name":"TOPIC","default_value":"rust"}}',
        null,
      ],
      ['POST', `/v1/prompt/${SUMMARY_ID}/build`, '{"variables":{"LENGTH":"9"}}', null],
      ['PUT', `/v1/prompt/${SUMMARY_ID}`, '{"prompt":{"favourite":false}}', `"${FIXTURE_VERSION}"`],
      ['PUT', '/v1/prompt-argument/arg-length', '{"prompt_argument":{"default_value":"100"}}', `"${FIXTURE_VERSION}"`],
      ['DELETE', '/v1/prompt-argument/arg-audience', undefined, `"${FIXTURE_VERSION}"`],
    ]);
  });
});
