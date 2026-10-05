// SPDX-License-Identifier: AGPL-3.0-or-later
// The package's component-test helper (never compiled into dist).
import { render, type RenderResult } from '@testing-library/react';
import { createElement, type ReactElement } from 'react';
import { vi } from 'vitest';
import { TestWrapper } from 'zephyrex/testing';
import { fetchFrom } from 'zephyrex/testing/msw';
import { promptHandlers, type PromptStore, promptsFixture } from './prompts.mocks';

/** Renders `ui` under the Zephyrex test app, its requests answered by the prompt routes over `store`. */
export function renderPrompts(ui: ReactElement, store: PromptStore = promptsFixture()): RenderResult {
  vi.stubGlobal('fetch', vi.fn(fetchFrom(promptHandlers(store))));
  return render(createElement(TestWrapper, null, ui));
}
