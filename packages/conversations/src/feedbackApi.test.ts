// SPDX-License-Identifier: AGPL-3.0-or-later
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ZephyrexClient } from 'zephyrex';
import { TestWrapper, testConfig, withSession } from 'zephyrex/testing';
import { type Call, recordingFetch, rowOf, writesOf } from 'zephyrex/testing/msw';
import { conversationHandlers, conversationsFixture, FIXTURE_VERSION, ME } from './conversations.mocks';
import { rateMessage, useFeedbackActions, useMyFeedback } from './feedbackApi';

const client = new ZephyrexClient({ baseUrl: testConfig.server.baseUrl });

describe('the feedback API', () => {
  let signOut: () => void = () => undefined;
  let store = conversationsFixture();
  let calls: Call[] = [];

  beforeEach(() => {
    signOut = withSession();
    store = conversationsFixture();
    const recorded = recordingFetch(conversationHandlers(store));
    calls = recorded.calls;
    vi.stubGlobal('fetch', vi.fn(recorded.fetch));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    signOut();
  });

  it('reads the user’s own feedback, asking for it by author once the user is known', async () => {
    const { result } = renderHook(() => useMyFeedback(), { wrapper: TestWrapper });
    await waitFor(() => {
      expect(result.current.data?.map(({ id }) => id)).toEqual(['f1']);
    });
    const asked = calls.map(({ url }) => new URL(url)).find(({ pathname }) => pathname === '/v1/feedback');
    expect(asked?.searchParams.get('user_id')).toBe(ME.id);
  });

  it('rates a message with no note, and changes or withdraws a rating guarded by it as loaded', async () => {
    await rateMessage(client, 'm1', false);
    expect(store.feedbacks.at(-1)).toMatchObject({ message_id: 'm1', content: '', positive: false, user_id: ME.id });
    const { result } = renderHook(() => useFeedbackActions(), { wrapper: TestWrapper });
    const given = rowOf(store.feedbacks, 'f1');
    await expect(result.current.update.save(given, { positive: false })).resolves.toBe(true);
    const changed = rowOf(store.feedbacks, 'f1');
    await expect(result.current.remove.save(changed, {})).resolves.toBe(true);
    expect(writesOf(calls).map(([method, path, , ifMatch]) => [method, path, ifMatch])).toEqual([
      ['POST', '/v1/feedback', null],
      ['PUT', '/v1/feedback/f1', `"${FIXTURE_VERSION}"`],
      ['DELETE', '/v1/feedback/f1', `"${changed.updated_at ?? ''}"`],
    ]);
    expect(store.feedbacks.some(({ id }) => id === 'f1')).toBe(false);
  });
});
