// SPDX-License-Identifier: AGPL-3.0-or-later
// The package's test helpers (never compiled into dist).
import { render, type RenderResult } from '@testing-library/react';
import { createElement, type ReactElement } from 'react';
import { vi } from 'vitest';
import { TestWrapper } from 'zephyrex/testing';
import { type Call, fetchFrom, recordingFetch } from 'zephyrex/testing/msw';
import { chainHandlers, chainsFixture, type ChainStore } from './chains.mocks';

/** Renders `ui` under the Zephyrex test app, its requests answered by the chain routes over `store`. */
export function renderChains(ui: ReactElement, store: ChainStore = chainsFixture()): RenderResult {
  vi.stubGlobal('fetch', vi.fn(fetchFrom(chainHandlers(store))));
  return render(createElement(TestWrapper, null, ui));
}

/** Answers every request from the chain routes over `store`, recording each into the list returned. */
export function recordCalls(store: ChainStore): Call[] {
  const recorded = recordingFetch(chainHandlers(store));
  vi.stubGlobal('fetch', vi.fn(recorded.fetch));
  return recorded.calls;
}
