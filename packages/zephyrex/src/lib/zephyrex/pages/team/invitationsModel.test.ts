// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { invitationAnswer, type PendingInvitation, PendingInvitationSchema } from './invitationsModel';

const base: PendingInvitation = {
  id: 'inv-1',
  created_at: '2026-09-20T00:00:00Z',
  invitees: [{ id: 'row-1', status: 'pending' }],
};

describe('invitationAnswer', () => {
  it('answers through the caller’s pending invitee row', () => {
    expect(invitationAnswer(base, 'accept')).toEqual({ invitation: { invitee_id: 'row-1', action: 'accept' } });
  });

  it('refuses an invitation without the caller’s row, as the schema does', () => {
    expect(() => invitationAnswer({ ...base, invitees: [] }, 'accept')).toThrow('no invitee row');
    expect(PendingInvitationSchema.safeParse({ ...base, invitees: [] }).success).toBe(false);
  });

  it('prefers the pending row when the caller has several', () => {
    const invitation: PendingInvitation = {
      ...base,
      invitees: [
        { id: 'row-old', status: 'declined' },
        { id: 'row-2', status: 'pending' },
      ],
    };
    expect(invitationAnswer(invitation, 'decline')).toEqual({ invitation: { invitee_id: 'row-2', action: 'decline' } });
  });
});

describe('PendingInvitationSchema', () => {
  it('rejects an invitation without the caller’s invitee row', () => {
    expect(PendingInvitationSchema.safeParse({ ...base, invitees: [] }).success).toBe(false);
  });
});
