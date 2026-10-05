// SPDX-License-Identifier: AGPL-3.0-or-later
// The package's component-test helper (never compiled into dist).
import { render, type RenderResult } from '@testing-library/react';
import { createElement, type ReactElement } from 'react';
import { onTestFinished, vi } from 'vitest';
import { TestWrapper, withSession } from 'zephyrex/testing';
import { fetchFrom } from 'zephyrex/testing/msw';
import { conversationHandlers, type ConversationStore, conversationsFixture } from './conversations.mocks';

/**
 * Renders `ui` under the Zephyrex test app, signed in for the test (the pages ask who the user is
 * and who their teammates are), its requests answered by the conversation routes over `store`.
 */
export function renderConversations(ui: ReactElement, store: ConversationStore = conversationsFixture()): RenderResult {
  onTestFinished(withSession());
  vi.stubGlobal('fetch', vi.fn(fetchFrom(conversationHandlers(store))));
  return render(createElement(TestWrapper, null, ui));
}
