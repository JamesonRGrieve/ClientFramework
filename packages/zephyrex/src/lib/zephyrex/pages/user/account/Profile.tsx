'use client';
// SPDX-License-Identifier: AGPL-3.0-or-later

import DynamicForm, { type DynamicFormFieldValueTypes } from '@jgrieve/forms/DynamicForm';
import { type ReactElement, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../../components/ui/card';
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

/** The signed-in user's editable profile. Only changed fields are saved. */
export function Profile({
  profile,
  onSave,
}: {
  profile: UserProfile;
  onSave: (changes: ProfileChanges) => Promise<unknown>;
}): ReactElement {
  const [status, setStatus] = useState<SaveStatus>(null);

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
    try {
      await onSave(changes);
      setStatus({ kind: 'saved', message: 'Profile saved.' });
    } catch (error) {
      setStatus({ kind: 'failed', message: error instanceof Error ? error.message : 'Your profile could not be saved.' });
    }
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
