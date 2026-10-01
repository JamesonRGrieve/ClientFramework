// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import {
  type Invitee,
  invitableRoles,
  inviteeStatus,
  inviteLink,
  isTeamAdmin,
  type Membership,
  memberName,
  MAX_INVITE_EMAILS,
  parseInviteEmails,
  type Role,
  roleLabel,
  roleRanks,
} from './teamModel';

const CREATED = '2026-09-01T00:00:00Z';
const ADA_EMAIL = 'ada@example.com';
const USER: Role = { id: 'r-user', name: 'user', friendly_name: 'User', parent_id: null, team_id: null };
const ADMIN: Role = { id: 'r-admin', name: 'admin', friendly_name: 'Admin', parent_id: 'r-user', team_id: null };
const SUPER: Role = { id: 'r-super', name: 'superadmin', friendly_name: 'Superadmin', parent_id: 'r-admin', team_id: null };
const EDITOR: Role = { id: 'r-editor', name: 'editor', parent_id: 'r-user', team_id: 't1' };
const OTHER: Role = { id: 'r-other', name: 'other', parent_id: 'r-user', team_id: 't2' };
const ROLES = [SUPER, EDITOR, USER, OTHER, ADMIN];

describe('roleRanks', () => {
  it('ranks each role by its depth below the root', () => {
    const ranks = roleRanks(ROLES);
    expect([USER, ADMIN, SUPER, EDITOR].map((role) => ranks.get(role.id))).toEqual([1, 2, 3, 2]);
  });

  it('ends the chain at an unknown parent or a cycle', () => {
    const ranks = roleRanks([
      { id: 'a', name: 'a', parent_id: 'missing' },
      { id: 'b', name: 'b', parent_id: 'c' },
      { id: 'c', name: 'c', parent_id: 'b' },
    ]);
    expect(ranks.get('a')).toBe(1);
    expect(ranks.get('b')).toBe(2);
  });
});

describe('isTeamAdmin', () => {
  it('holds for admin and above only', () => {
    expect(isTeamAdmin(ROLES, 'r-admin')).toBe(true);
    expect(isTeamAdmin(ROLES, 'r-super')).toBe(true);
    expect(isTeamAdmin(ROLES, 'r-user')).toBe(false);
    expect(isTeamAdmin(ROLES, undefined)).toBe(false);
  });

  it('counts only the admin role’s subtree, as the server does: a role extending user is not an admin', () => {
    expect(isTeamAdmin(ROLES, 'r-editor')).toBe(false);
    const lead: Role = { id: 'r-lead', name: 'lead', parent_id: 'r-admin', team_id: 't1' };
    expect(isTeamAdmin([...ROLES, lead], 'r-lead')).toBe(true);
  });

  it('stops at a cycle in the role chain', () => {
    const loop: Role[] = [ADMIN, { id: 'a', name: 'a', parent_id: 'b' }, { id: 'b', name: 'b', parent_id: 'a' }];
    expect(isTeamAdmin(loop, 'a')).toBe(false);
  });

  it('never holds when the admin role is not known', () => {
    expect(isTeamAdmin([USER, SUPER], 'r-super')).toBe(false);
  });
});

describe('invitableRoles', () => {
  it('offers system and this team’s roles up to the issuer’s own, lowest first', () => {
    expect(invitableRoles(ROLES, 'r-admin', 't1').map((role) => role.id)).toEqual(['r-user', 'r-editor', 'r-admin']);
    expect(invitableRoles(ROLES, 'r-super', 't2').map((role) => role.id)).toEqual([
      'r-user',
      'r-other',
      'r-admin',
      'r-super',
    ]);
  });

  it('offers nothing to someone without a known role', () => {
    expect(invitableRoles(ROLES, undefined, 't1')).toEqual([]);
    expect(invitableRoles(ROLES, 'r-gone', 't1')).toEqual([]);
  });
});

describe('inviteeStatus', () => {
  const row: Invitee = { id: 'i1', email: ADA_EMAIL, created_at: CREATED };

  it('reads the answer timestamps', () => {
    expect(inviteeStatus(row)).toBe('pending');
    expect(inviteeStatus({ ...row, accepted_at: '2026-09-02T00:00:00Z' })).toBe('accepted');
    expect(inviteeStatus({ ...row, declined_at: '2026-09-02T00:00:00Z', accepted_at: null })).toBe('declined');
  });
});

describe('labels', () => {
  const member = (user: Membership['user']): Membership => ({
    id: 'm',
    user_id: 'u',
    team_id: 't',
    role_id: USER.id,
    user,
    role: USER,
  });

  it('names a member by display name, then full name, then email', () => {
    expect(memberName(member({ id: 'u', display_name: 'Ada L', first_name: 'Ada', email: 'a@x.io' }))).toBe('Ada L');
    expect(memberName(member({ id: 'u', first_name: 'Ada', last_name: 'Lovelace', email: 'a@x.io' }))).toBe('Ada Lovelace');
    expect(memberName(member({ id: 'u', email: 'a@x.io' }))).toBe('a@x.io');
    expect(memberName(member({ id: 'u' }))).toBe('');
  });

  it('labels a role by its friendly name', () => {
    expect(roleLabel(ADMIN)).toBe('Admin');
    expect(roleLabel(EDITOR)).toBe('editor');
    expect(roleLabel(null)).toBe('Unknown role');
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
    expect(inviteLink('https://app.example.com', 'AB12CD34', 'ada+team@example.com', 'R&D')).toBe(
      'https://app.example.com/?code=AB12CD34&email=ada%2Bteam%40example.com&team=R%26D',
    );
  });

  it('leaves the team out when it has no name', () => {
    expect(inviteLink('https://app.example.com', 'AB12CD34', ADA_EMAIL, '')).toBe(
      'https://app.example.com/?code=AB12CD34&email=ada%40example.com',
    );
  });
});
