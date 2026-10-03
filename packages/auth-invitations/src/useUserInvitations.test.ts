// SPDX-License-Identifier: AGPL-3.0-or-later
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { activeTeamId, setActiveTeam } from 'zephyrex';
import { TestWrapper as wrapper, testConfig } from 'zephyrex/testing';
import type { PendingInvitation } from './invitationsModel';
import { USER_INVITATIONS_ENDPOINT, useUserInvitations } from './useUserInvitations';

const HTTP_OK = 200;
const INVITATION: PendingInvitation = {
  id: 'inv-1',
  team_id: 't-alpha',
  created_at: '2026-09-20T00:00:00Z',
  team: { name: 'Alpha' },
  invitees: [{ id: 'row-1', status: 'pending' }],
};

describe('useUserInvitations', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    setActiveTeam('');
  });

  it('lists the invitations awaiting an answer, and accepting one joins and opens its team', async () => {
    let pending = [INVITATION];
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (init?.method === 'PATCH') {
        pending = [];
        return Promise.resolve(new Response('{"success":true}', { status: HTTP_OK }));
      }
      const body = url.endsWith(USER_INVITATIONS_ENDPOINT) ? { invitations: pending } : {};
      return Promise.resolve(new Response(JSON.stringify(body), { status: HTTP_OK }));
    });
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => ({ ...useUserInvitations(), data: useUserInvitations().invitations.data }), {
      wrapper,
    });
    await waitFor(() => {
      expect(result.current.data).toHaveLength(1);
    });
    await act(async () => {
      await expect(result.current.answer.save(INVITATION, { answer: 'accept' })).resolves.toBe(true);
    });
    expect(fetchMock).toHaveBeenCalledWith(
      `${testConfig.server.baseUrl}/v1/invitation/inv-1`,
      expect.objectContaining({ method: 'PATCH', body: '{"invitation":{"invitee_id":"row-1","action":"accept"}}' }),
    );
    const answered = fetchMock.mock.calls.find(([, init]) => init?.method === 'PATCH');
    expect(new Headers(answered?.[1]?.headers).get('If-Match')).toBe(`"${INVITATION.created_at}"`);
    expect(activeTeamId()).toBe('t-alpha');
    await waitFor(() => {
      expect(result.current.data).toEqual([]);
    });
  });
});
