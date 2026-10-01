// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from 'vitest';
import { invitableRoles, isTeamAdmin, type Membership, memberName, type Role, roleLabel, roleRanks } from './teamModel';

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
