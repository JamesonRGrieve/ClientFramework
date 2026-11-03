// SPDX-License-Identifier: AGPL-3.0-or-later
// What the server's agreements extension answers: the agreements someone is party to.
import { z } from 'zod';

/** A kind of term the app's agreements hold (the server's register_term_kinds names the same values). */
export interface TermKindInfo {
  /** The kind as the server stores it. */
  value: string;
  /** The heading over the terms of this kind. */
  heading: string;
  /** The kind as a choice when writing a term. */
  choice: string;
}

/** The one kind the server holds when the app names none. */
export const DEFAULT_KINDS: readonly TermKindInfo[] = [{ value: 'term', heading: 'Terms', choice: 'Term' }];

const TermSchema = z.object({
  id: z.string(),
  kind: z.string(),
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

/** The kind a term shows under: its own when the app names it, else the default (the first). */
export function shownKind(kind: string, kinds: readonly TermKindInfo[]): string {
  return kinds.some((k) => k.value === kind) ? kind : (kinds.at(0)?.value ?? kind);
}

/** Whether `revisitOn` (a date, YYYY-MM-DD) has come, as of `today`. */
export function dueForRevisit(revisitOn: string | null | undefined, today: string): boolean {
  return revisitOn !== null && revisitOn !== undefined && revisitOn <= today;
}
