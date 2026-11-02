// SPDX-License-Identifier: AGPL-3.0-or-later
// What the server's agreements extension answers: the agreements someone is party to.
import { z } from 'zod';

export const KINDS = ['agreement', 'like', 'limit'] as const;
export type TermKind = (typeof KINDS)[number];

const TermSchema = z.object({
  id: z.string(),
  kind: z.enum(KINDS),
  text: z.string(),
  position: z.number(),
  written_by: z.string(),
  updated_at: z.string().nullish(),
});
export type Term = z.infer<typeof TermSchema>;

const PartySchema = z.object({
  user_id: z.string(),
  confirmed: z.boolean(),
  confirmed_version: z.number().nullish(),
});
export type Party = z.infer<typeof PartySchema>;

export const AgreementSchema = z.object({
  id: z.string(),
  title: z.string(),
  revisit_on: z.string().nullish(),
  version: z.number(),
  owner_id: z.string(),
  parties: z.array(PartySchema),
  terms: z.array(TermSchema),
  in_effect: z.boolean(),
  updated_at: z.string().nullish(),
});
export type Agreement = z.infer<typeof AgreementSchema>;

export const AgreementListSchema = z.object({ agreements: z.array(AgreementSchema) });

/** Someone an agreement can be with: their account, and their name. */
export interface AgreementPerson {
  userId: string;
  name: string;
}

/** The heading over each kind of term. */
export function kindLabel(kind: TermKind): string {
  switch (kind) {
    case 'agreement':
      return 'What we agreed';
    case 'like':
      return 'Likes';
    case 'limit':
      return 'Limits';
  }
}

/** The kind as a choice when writing a term. */
export function kindChoice(kind: TermKind): string {
  switch (kind) {
    case 'agreement':
      return 'Agreed';
    case 'like':
      return 'Like';
    case 'limit':
      return 'Limit';
  }
}

/** Whether `revisitOn` (a date, YYYY-MM-DD) has come, as of `today`. */
export function dueForRevisit(revisitOn: string | null | undefined, today: string): boolean {
  return revisitOn !== null && revisitOn !== undefined && revisitOn <= today;
}
