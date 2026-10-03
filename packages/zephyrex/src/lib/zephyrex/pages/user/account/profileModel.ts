// SPDX-License-Identifier: AGPL-3.0-or-later
import { z } from 'zod';
import { brokenRules, type PasswordPolicy } from '@zephyrex/auth/lib/passwordPolicy';

const optionalText = z.string().nullable().optional();

/** The signed-in user as GET/PUT /v1/user return it (inside `{ user }`). */
export const UserProfileSchema = z.object({
  id: z.string(),
  email: z.string(),
  username: optionalText,
  display_name: optionalText,
  first_name: optionalText,
  last_name: optionalText,
  timezone: optionalText,
  language: optionalText,
  // The row's version, sent back verbatim as If-Match on every change.
  created_at: optionalText,
  updated_at: optionalText,
});
export type UserProfile = z.infer<typeof UserProfileSchema>;

export const UserProfileResponseSchema = z.object({ user: UserProfileSchema });

/**
 * The fields a user may change on this page. Account state (`active`, `mfa_count`) is
 * root-only on the server and is never sent; the sign-in email is shown, not edited here.
 */
export const PROFILE_FIELDS = ['first_name', 'last_name', 'display_name', 'username', 'timezone', 'language'] as const;
export type ProfileField = (typeof PROFILE_FIELDS)[number];
export type ProfileChanges = Partial<Record<ProfileField, string | null>>;

const isProfileField = (key: string): key is ProfileField => (PROFILE_FIELDS as readonly string[]).includes(key);

/**
 * Only the fields the user actually changed. A cleared field becomes `null`, so the server
 * unsets it instead of storing an empty string.
 */
export function profileChanges(
  current: UserProfile,
  submitted: Readonly<Record<string, string | number | boolean>>,
): ProfileChanges {
  const saved = new Map<string, string | null | undefined>(Object.entries(current));
  return Object.fromEntries(
    Object.entries(submitted)
      .filter((entry): entry is [ProfileField, string] => isProfileField(entry[0]) && typeof entry[1] === 'string')
      .map(([field, raw]) => [field, raw.trim() === '' ? null : raw.trim()] as const)
      .filter(([field, next]) => next !== (saved.get(field) ?? null)),
  );
}

const FALLBACK_TIMEZONE = 'UTC';

/** The browser's IANA timezone, or UTC when the runtime cannot tell. */
export function detectTimezone(): string {
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return zone === '' ? FALLBACK_TIMEZONE : zone;
}

/** The password-change form's fields, by name (each also the field's id and autocomplete hint). */
export const PASSWORD_FIELDS = {
  current: 'current-password',
  next: 'new-password',
  again: 'new-password-again',
} as const;
export type PasswordChangeField = (typeof PASSWORD_FIELDS)[keyof typeof PASSWORD_FIELDS];

/** What is wrong with a password change, and the field it is wrong in. */
export type PasswordChangeProblem = { field: PasswordChangeField; message: string };

/**
 * Why a password change can't be sent yet, or `null` when it can. `policy` is the server's password
 * rule, `undefined` until it has loaded, when the server is left to enforce it.
 */
export function passwordChangeProblem(
  current: string,
  next: string,
  confirmation: string,
  policy: PasswordPolicy | undefined,
): PasswordChangeProblem | null {
  if (current === '') {
    return { field: PASSWORD_FIELDS.current, message: 'Enter your current password.' };
  }
  if (next === '') {
    return { field: PASSWORD_FIELDS.next, message: 'Enter a new password.' };
  }
  if (policy !== undefined && brokenRules(next, policy).length > 0) {
    return { field: PASSWORD_FIELDS.next, message: 'The new password does not meet the requirements.' };
  }
  if (next !== confirmation) {
    return { field: PASSWORD_FIELDS.again, message: 'The new passwords do not match.' };
  }
  if (next === current) {
    return { field: PASSWORD_FIELDS.next, message: 'The new password must differ from the current one.' };
  }
  return null;
}
