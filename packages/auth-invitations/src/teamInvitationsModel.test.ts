// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { type Invitee, inviteeStatus, inviteLink, MAX_INVITE_EMAILS, parseInviteEmails } from './teamInvitationsModel';

const ADA_EMAIL = 'ada@example.com';
const ORIGIN = 'https://app.example.com';
const CODE = 'AB12CD34';

describe('inviteeStatus', () => {
  const row: Invitee = { id: 'i1', email: ADA_EMAIL, created_at: '2026-09-01T00:00:00Z' };

  it('reads the answer timestamps', () => {
    expect(inviteeStatus(row)).toBe('pending');
    expect(inviteeStatus({ ...row, accepted_at: '2026-09-02T00:00:00Z' })).toBe('accepted');
    expect(inviteeStatus({ ...row, declined_at: '2026-09-02T00:00:00Z', accepted_at: null })).toBe('declined');
  });
});

describe('parseInviteEmails', () => {
  it('splits on commas and spaces, lower-cases and drops repeats', () => {
    expect(parseInviteEmails(' Ada@Example.com, bob@example.com\nada@example.com ')).toEqual({
      emails: [ADA_EMAIL, 'bob@example.com'],
    });
  });

  it('explains what is wrong', () => {
    expect(parseInviteEmails(' , ')).toEqual({ problem: 'Enter an email address to invite.' });
    expect(parseInviteEmails('ada@example.com, nope')).toEqual({ problem: 'Not an email address: nope' });
    const many = Array.from({ length: MAX_INVITE_EMAILS + 1 }, (_, i) => `u${i}@example.com`).join(',');
    expect(parseInviteEmails(many)).toEqual({ problem: `Invite at most ${MAX_INVITE_EMAILS} addresses at a time.` });
  });
});

describe('inviteLink', () => {
  it('carries the code, address and team name for the auth middleware, encoded', () => {
    expect(inviteLink(ORIGIN, CODE, 'ada+team@example.com', 'R&D')).toBe(
      `${ORIGIN}/?code=${CODE}&email=ada%2Bteam%40example.com&team=R%26D`,
    );
  });

  it('leaves the team out when it has no name', () => {
    expect(inviteLink(ORIGIN, CODE, ADA_EMAIL, '')).toBe(`${ORIGIN}/?code=${CODE}&email=ada%40example.com`);
  });
});
