// SPDX-License-Identifier: AGPL-3.0-or-later
import { z } from 'zod';

const NamedSchema = z.object({ id: z.string().optional(), name: z.string() });

const InviteeSchema = z.object({ id: z.string(), status: z.string() });

/** One invitation awaiting the signed-in user's answer (GET /v1/user/invitation). */
export const PendingInvitationSchema = z.object({
  id: z.string(),
  team_id: z.string().nullable().optional(),
  expires_at: z.string().nullable().optional(),
  created_at: z.string(),
  team: NamedSchema.nullable().optional(),
  role: NamedSchema.nullable().optional(),
  /** The caller's own row for this invitation; every invitation they can answer has one. */
  invitees: z.array(InviteeSchema).nonempty(),
});
export type PendingInvitation = z.infer<typeof PendingInvitationSchema>;

export const PendingInvitationsResponseSchema = z.object({ invitations: z.array(PendingInvitationSchema) });

export type InvitationAnswer = 'accept' | 'decline';

type AnswerBody = { invitation: { invitee_id: string; action: InvitationAnswer } };

/** The PATCH /v1/invitation/{id} body that answers `invitation` as the caller, through their pending invitee row. */
export function invitationAnswer(invitation: PendingInvitation, action: InvitationAnswer): AnswerBody {
  const invitee = invitation.invitees.find((row) => row.status === 'pending') ?? invitation.invitees.at(0);
  if (invitee === undefined) {
    // The schema refuses an invitation without the caller's row, so this is a misuse.
    throw new Error('This invitation has no invitee row to answer it with.');
  }
  return { invitation: { invitee_id: invitee.id, action } };
}
