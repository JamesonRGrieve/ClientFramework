// SPDX-License-Identifier: AGPL-3.0-or-later
import { z } from 'zod';

/** A role (GET /v1/role). Each role extends its parent: user < admin < superadmin. */
export const RoleSchema = z.object({
  id: z.string(),
  name: z.string(),
  friendly_name: z.string().nullable().optional(),
  parent_id: z.string().nullable().optional(),
  team_id: z.string().nullable().optional(),
});
export type Role = z.infer<typeof RoleSchema>;

const MemberUserSchema = z.object({
  id: z.string(),
  email: z.string().nullable().optional(),
  display_name: z.string().nullable().optional(),
  first_name: z.string().nullable().optional(),
  last_name: z.string().nullable().optional(),
});

/** One membership of a team, with its user and role (GET /v1/team/{id}/user). */
const MembershipSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  team_id: z.string(),
  role_id: z.string(),
  user: MemberUserSchema,
  role: RoleSchema,
});
export type Membership = z.infer<typeof MembershipSchema>;

export const MembershipsResponseSchema = z.object({ user_teams: z.array(MembershipSchema) });

/** An invitation into a team (GET /v1/team/{id}/invitation). */
export const TeamInvitationSchema = z.object({
  id: z.string(),
  code: z.string().nullable().optional(),
  role_id: z.string().nullable().optional(),
  team_id: z.string().nullable().optional(),
  expires_at: z.string().nullable().optional(),
  created_at: z.string(),
});
export type TeamInvitation = z.infer<typeof TeamInvitationSchema>;

/** Who an invitation went to (GET /v1/invitation/{id}/invitee). */
export const InviteeSchema = z.object({
  id: z.string(),
  email: z.string(),
  accepted_at: z.string().nullable().optional(),
  declined_at: z.string().nullable().optional(),
  created_at: z.string(),
});
export type Invitee = z.infer<typeof InviteeSchema>;

export type InviteeStatus = 'pending' | 'accepted' | 'declined';

export const inviteeStatus = (invitee: Invitee): InviteeStatus =>
  (invitee.accepted_at ?? '') !== '' ? 'accepted' : (invitee.declined_at ?? '') !== '' ? 'declined' : 'pending';

/** The role's seed name the server treats as the minimum to manage a team. */
const ADMIN_ROLE_NAME = 'admin';

/**
 * Each role's rank, its depth below the root role (a role without a parent ranks 1). This is the
 * server's own ordering (auth_invitations `_RoleRanks`), so what the page offers matches what the
 * server accepts. A parent outside `roles` ends the chain.
 */
export function roleRanks(roles: readonly Role[]): Map<string, number> {
  const byId = new Map(roles.map((role) => [role.id, role]));
  const rank = (role: Role, seen: Set<string>): number => {
    const parent = role.parent_id === null || role.parent_id === undefined ? undefined : byId.get(role.parent_id);
    return parent === undefined || seen.has(parent.id) ? 1 : 1 + rank(parent, new Set([...seen, parent.id]));
  };
  return new Map(roles.map((role) => [role.id, rank(role, new Set([role.id]))]));
}

/**
 * Whether `roleId` may manage the team: the admin role or one that extends it (the admin role's
 * subtree), as the server decides who may invite. A role that only extends `user` is not an admin,
 * however deep it sits.
 */
export function isTeamAdmin(roles: readonly Role[], roleId: string | undefined): boolean {
  const admin = roles.find((role) => role.name === ADMIN_ROLE_NAME && (role.team_id ?? null) === null);
  if (admin === undefined || roleId === undefined) {
    return false;
  }
  const byId = new Map(roles.map((role) => [role.id, role]));
  const extendsAdmin = (id: string | null | undefined, seen: ReadonlySet<string>): boolean => {
    if (id === null || id === undefined || seen.has(id)) {
      return false;
    }
    return id === admin.id || extendsAdmin(byId.get(id)?.parent_id, new Set([...seen, id]));
  };
  return extendsAdmin(roleId, new Set());
}

/** The roles an issuer holding `roleId` may invite into `teamId`: system or that team's, never above their own. */
export function invitableRoles(roles: readonly Role[], roleId: string | undefined, teamId: string): Role[] {
  const ranks = roleRanks(roles);
  const own = roleId === undefined ? undefined : ranks.get(roleId);
  if (own === undefined) {
    return [];
  }
  return roles
    .filter((role) => (role.team_id ?? null) === null || role.team_id === teamId)
    .filter((role) => (ranks.get(role.id) ?? Number.POSITIVE_INFINITY) <= own)
    .sort((a, b) => (ranks.get(a.id) ?? 0) - (ranks.get(b.id) ?? 0));
}

export const roleLabel = (role: Role | null | undefined): string => role?.friendly_name ?? role?.name ?? 'Unknown role';

export const memberName = ({ user }: Membership): string => {
  const fullName = [user.first_name, user.last_name].filter((part) => (part ?? '') !== '').join(' ');
  return (user.display_name ?? '') !== '' ? (user.display_name ?? '') : fullName !== '' ? fullName : (user.email ?? '');
};

/** At most this many addresses per invitation, the same cap the invite form has always had. */
export const MAX_INVITE_EMAILS = 10;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ParsedEmails = { emails: string[] } | { problem: string };

/** The comma- or whitespace-separated addresses in `text`, lower-cased, or why they can't be sent. */
export function parseInviteEmails(text: string): ParsedEmails {
  const emails = [
    ...new Set(
      text
        .split(/[\s,]+/)
        .filter((part) => part !== '')
        .map((part) => part.toLowerCase()),
    ),
  ];
  if (emails.length === 0) {
    return { problem: 'Enter an email address to invite.' };
  }
  if (emails.length > MAX_INVITE_EMAILS) {
    return { problem: `Invite at most ${MAX_INVITE_EMAILS} addresses at a time.` };
  }
  const invalid = emails.filter((email) => !EMAIL.test(email));
  return invalid.length > 0 ? { problem: `Not an email address: ${invalid.join(', ')}` } : { emails };
}

/**
 * The link an invitee opens: the auth middleware remembers the code, email and team name, then
 * starts sign-in, where the acceptance page names the team.
 */
export const inviteLink = (origin: string, code: string, email: string, teamName: string): string =>
  `${origin}/?${new URLSearchParams({ code, email, ...(teamName === '' ? {} : { team: teamName }) }).toString()}`;
