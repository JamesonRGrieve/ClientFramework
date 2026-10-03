// SPDX-License-Identifier: AGPL-3.0-or-later
import { z } from 'zod';

/** An invitation into a team (GET /v1/team/{id}/invitation). */
export const TeamInvitationSchema = z.object({
  id: z.string(),
  code: z.string().nullable().optional(),
  role_id: z.string().nullable().optional(),
  team_id: z.string().nullable().optional(),
  expires_at: z.string().nullable().optional(),
  created_at: z.string(),
  // The row's version, sent back verbatim as If-Match on a revoke.
  updated_at: z.string().nullable().optional(),
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
