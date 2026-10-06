// SPDX-License-Identifier: AGPL-3.0-or-later
// The package's test helpers (never compiled into dist).
import { render, type RenderResult, renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactElement } from 'react';
import { expect, vi } from 'vitest';
import { TestWrapper } from 'zephyrex/testing';
import { type Call, fetchFrom, recordingFetch } from 'zephyrex/testing/msw';
import { agentHandlers, agentsFixture, type AgentStore } from './agents.mocks';

/** Renders `ui` under the Zephyrex test app, its requests answered by the agent routes over `store`. */
export function renderAgents(ui: ReactElement, store: AgentStore = agentsFixture()): RenderResult {
  vi.stubGlobal('fetch', vi.fn(fetchFrom(agentHandlers(store))));
  return render(createElement(TestWrapper, null, ui));
}

/** What a read `hook` loads under the Zephyrex test app, once it has loaded (null included). */
export async function loaded<T>(hook: () => { data: T | undefined }): Promise<T> {
  const { result } = renderHook(hook, { wrapper: TestWrapper });
  let data: T | undefined;
  await waitFor(() => {
    data = result.current.data;
    expect(data).toBeDefined();
  });
  if (data === undefined) {
    throw new Error('The hook loaded nothing');
  }
  return data;
}

/** Answers every request from the agent routes over `store`, recording each into the list returned. */
export function recordCalls(store: AgentStore): Call[] {
  const recorded = recordingFetch(agentHandlers(store));
  vi.stubGlobal('fetch', vi.fn(recorded.fetch));
  return recorded.calls;
}
