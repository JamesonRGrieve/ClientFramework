// SPDX-License-Identifier: AGPL-3.0-or-later
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestWrapper } from 'zephyrex/testing';
import { fetchFrom } from 'zephyrex/testing/msw';
import { useArtifacts } from './artifactsApi';
import { conversationHandlers, DIRECT_ID, PLANS_ID } from './conversations.mocks';

describe('the artifacts API', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(fetchFrom(conversationHandlers())));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reads a conversation’s files by name', async () => {
    const plans = renderHook(() => useArtifacts(PLANS_ID), { wrapper: TestWrapper }).result;
    await waitFor(() => {
      expect(plans.current.data?.map(({ name }) => name)).toEqual(['keys.bin', 'schedule.md']);
    });
    const direct = renderHook(() => useArtifacts(DIRECT_ID), { wrapper: TestWrapper }).result;
    await waitFor(() => {
      expect(direct.current.data?.map(({ name }) => name)).toEqual(['menu.txt']);
    });
  });
});
