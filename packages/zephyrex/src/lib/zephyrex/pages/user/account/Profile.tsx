'use client';
// SPDX-License-Identifier: AGPL-3.0-or-later

import DynamicForm, { type DynamicFormFieldValueTypes } from '@jgrieve/forms/DynamicForm';
import { type ReactElement, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../../components/ui/card';
import { type ConflictField, ConflictPanel } from '../../../components/ConflictPanel';
import type { Conflict } from '../../../useGuardedSave';
import {
  detectTimezone,
  PROFILE_FIELDS,
  type ProfileChanges,
  type ProfileField,
  profileChanges,
  type UserProfile,
} from './profileModel';

const FIELD_LABELS: ReadonlyMap<ProfileField, string> = new Map([
  ['first_name', 'First name'],
  ['last_name', 'Last name'],
  ['display_name', 'Display name'],
  ['username', 'Username'],
  ['timezone', 'Timezone'],
  ['language', 'Language'],
]);

type SaveStatus = { kind: 'saved' | 'unchanged' | 'failed'; message: string } | null;

const CONFLICT_FIELDS: readonly ConflictField<UserProfile>[] = PROFILE_FIELDS.map((key) => ({
  key,
  label: FIELD_LABELS.get(key) ?? key,
}));

/**
 * The signed-in user's editable profile. Only changed fields are saved, and only over the profile
 * as it was loaded: if it changed first, the conflict shows the user's edits beside it.
 */
export function Profile({
  profile,
  onSave,
  conflict,
  onResolve,
  onDiscard,
}: {
  profile: UserProfile;
  /** True once saved; false when the save was refused as stale. */
  onSave: (changes: ProfileChanges) => Promise<boolean>;
  conflict: Conflict<UserProfile> | null;
  onResolve: (merged: Partial<UserProfile>) => Promise<boolean>;
  onDiscard: () => void;
}): ReactElement {
  const [status, setStatus] = useState<SaveStatus>(null);

  const settle = async (saving: Promise<boolean>): Promise<void> => {
    try {
      setStatus((await saving) ? { kind: 'saved', message: 'Profile saved.' } : null);
    } catch (error) {
      setStatus({ kind: 'failed', message: error instanceof Error ? error.message : 'Your profile could not be saved.' });
    }
  };

  const fields = useMemo(() => {
    const saved = new Map<string, string | null | undefined>(Object.entries(profile));
    return Object.fromEntries(
      PROFILE_FIELDS.map((field) => [
        field,
        {
          type: 'text' as const,
          display: FIELD_LABELS.get(field) ?? field,
          value: saved.get(field) ?? (field === 'timezone' ? detectTimezone() : ''),
        },
      ]),
    );
  }, [profile]);

  const save = async (submitted: Record<string, DynamicFormFieldValueTypes>): Promise<void> => {
    const changes = profileChanges(profile, submitted);
    if (Object.keys(changes).length === 0) {
      setStatus({ kind: 'unchanged', message: 'Nothing to save.' });
      return;
    }
    await settle(onSave(changes));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>
          Signed in as <span className='font-medium text-foreground'>{profile.email}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <DynamicForm fields={fields} submitButtonText='Save profile' onConfirm={save} />
        {conflict !== null && (
          <ConflictPanel
            conflict={conflict}
            fields={CONFLICT_FIELDS}
            onResolve={(merged) => {
              void settle(onResolve(merged));
            }}
            onDiscard={onDiscard}
          />
        )}
        {status !== null && (
          <p
            role={status.kind === 'failed' ? 'alert' : 'status'}
            className={status.kind === 'failed' ? 'text-sm text-destructive' : 'text-sm text-muted-foreground'}
          >
            {status.message}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
