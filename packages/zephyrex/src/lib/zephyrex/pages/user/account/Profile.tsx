'use client';
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Button } from '@jgrieve/forms/components/ui/button';
import { Input } from '@jgrieve/forms/components/ui/input';
import { Label } from '@jgrieve/forms/components/ui/label';
import { timezoneOptions } from '@jgrieve/forms/lib/timezones';
import SearchableSelectField from '@jgrieve/forms/SearchableSelectField';
import SelectField from '@jgrieve/forms/SelectField';
import { type ReactElement, type SyntheticEvent, useEffect, useEffectEvent, useId, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../../components/ui/card';
import { type ConflictField, ConflictPanel } from '../../../components/ConflictPanel';
import { type Conflict, useEditBase } from '../../../useGuardedSave';
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

/** The languages offered, by their own names. */
const LANGUAGES: { value: string; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' },
  { value: 'es', label: 'Español' },
  { value: 'de', label: 'Deutsch' },
  { value: 'pt', label: 'Português' },
  { value: 'it', label: 'Italiano' },
  { value: 'nl', label: 'Nederlands' },
];

/** The name fields, saved as each is left. */
const NAME_FIELDS = ['first_name', 'last_name', 'display_name'] as const;

type Draft = Record<ProfileField, string>;

type Sending = { over: UserProfile; changes: ProfileChanges };

type SaveStatus = { kind: 'saving' | 'saved' | 'failed'; message: string } | null;

const CONFLICT_FIELDS: readonly ConflictField<UserProfile>[] = PROFILE_FIELDS.map((key) => ({
  key,
  label: FIELD_LABELS.get(key) ?? key,
}));

const draftOf = (row: UserProfile): Draft => ({
  first_name: row.first_name ?? '',
  last_name: row.last_name ?? '',
  display_name: row.display_name ?? '',
  username: row.username ?? '',
  timezone: row.timezone ?? '',
  language: row.language ?? '',
});

/** `current`, with every field the user hasn't touched since `before` moved on to `after`. */
function keepEdits(current: Draft, before: Draft, after: Draft): Draft {
  const next = { ...current };
  for (const field of PROFILE_FIELDS) {
    if (current[field] === before[field]) {
      next[field] = after[field];
    }
  }
  return next;
}

/**
 * The signed-in user's editable profile. It saves as you go: a name as you leave its box, a
 * timezone or language as you pick it, with a quiet status saying when it's stored. The username
 * is the one field that waits for its own button, because others may know you by it.
 *
 * Only changed fields are saved, and only over the profile they were edited from. Saves go one at
 * a time: an edit made while one is in flight goes once it has landed, over the profile it
 * stored. If someone else changed the profile first, the conflict shows the user's edits beside it.
 */
export function Profile({
  profile,
  onSave,
  conflict,
  onResolve,
  onDiscard,
}: {
  profile: UserProfile;
  /** Saves `changes` over `seen`: true once saved; false when refused as stale. */
  onSave: (seen: UserProfile, changes: ProfileChanges) => Promise<boolean>;
  conflict: Conflict<UserProfile> | null;
  onResolve: (merged: Partial<UserProfile>) => Promise<boolean>;
  onDiscard: () => void;
}): ReactElement {
  const ids = { form: useId(), username: useId() };
  // The form edits, and saves over, the profile it was filled from until the user's save lands.
  const { base, rebaseOnSave } = useEditBase(profile);
  const [draft, setDraft] = useState(() => draftOf(base));
  const [filledFrom, setFilledFrom] = useState(base);
  if (filledFrom !== base) {
    // A save landed: refill what the user isn't in the middle of changing.
    setFilledFrom(base);
    setDraft((current) => keepEdits(current, draftOf(filledFrom), draftOf(base)));
  }
  // What is waiting to go: the autosaved fields, and the username once its button is pressed.
  const [wanted, setWanted] = useState<{ fields: boolean; username: boolean }>({ fields: false, username: false });
  const [status, setStatus] = useState<SaveStatus>(null);
  // The save on its way: the changes and the profile they go over. One at a time.
  const [sending, setSending] = useState<Sending | null>(null);
  // The profile the last save went over; the next waits until the base has moved past it.
  const [sentOver, setSentOver] = useState<UserProfile | null>(null);
  if (sending === null && (wanted.fields || wanted.username) && base !== sentOver) {
    // Nothing in flight and the last save's profile is back: send what is waiting.
    const changes = profileChanges(base, wanted.username ? draft : { ...draft, username: base.username ?? '' });
    setWanted({ fields: false, username: false });
    if (Object.keys(changes).length > 0) {
      setSentOver(base);
      setSending({ over: base, changes });
      setStatus({ kind: 'saving', message: 'Saving…' });
    }
  }
  const saving = sending !== null;

  const timezones = useMemo(
    () => timezoneOptions(new Date(), draft.timezone === '' ? [] : [draft.timezone]),
    [draft.timezone],
  );
  const suggestedZone = useMemo(() => detectTimezone(), []);

  /** What to say once `writing` settles; null when it was refused as stale (the conflict shows). */
  const outcome = async (writing: Promise<boolean>, done: string): Promise<SaveStatus> => {
    try {
      return (await rebaseOnSave(writing)) ? { kind: 'saved', message: done } : null;
    } catch (error) {
      return { kind: 'failed', message: error instanceof Error ? error.message : 'Your profile could not be saved.' };
    }
  };

  // The save itself is the one thing done outside React, so it is the effect; its state lands
  // when the server answers. The ref keeps a re-run of the effect from sending it twice.
  const sent = useRef<Sending | null>(null);
  const send = useEffectEvent(async (save: Sending): Promise<void> => {
    const said = await outcome(
      onSave(save.over, save.changes),
      save.changes.username === undefined ? 'Saved' : 'Username changed.',
    );
    setStatus(said);
    if (said?.kind !== 'saved') {
      setSentOver(null);
    }
    setSending(null);
  });
  useEffect(() => {
    if (sending !== null && sent.current !== sending) {
      sent.current = sending;
      void send(sending);
    }
  }, [sending]);

  const edit = (field: ProfileField, value: string): void => {
    setDraft((current) => ({ ...current, [field]: value }));
  };
  const saveFields = (): void => {
    setWanted((current) => ({ ...current, fields: true }));
  };
  const pick = (field: 'timezone' | 'language', value: string): void => {
    edit(field, value);
    saveFields();
  };
  const changeUsername = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setWanted((current) => ({ ...current, username: true }));
  };
  const usernameChanged = draft.username.trim() !== (base.username ?? '');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>
          Signed in as <span className='font-medium text-foreground'>{profile.email}</span>. Changes save as you make them.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2'>
          {NAME_FIELDS.map((field) => (
            <div key={field} className='grid gap-1.5'>
              <Label htmlFor={`${ids.form}-${field}`}>{FIELD_LABELS.get(field)}</Label>
              <Input
                id={`${ids.form}-${field}`}
                name={field}
                value={draft[field]}
                autoComplete={field === 'first_name' ? 'given-name' : field === 'last_name' ? 'family-name' : 'nickname'}
                onChange={(event) => edit(field, event.target.value)}
                onBlur={saveFields}
              />
            </div>
          ))}
          <div className='grid gap-1.5'>
            <SelectField
              id={`${ids.form}-language`}
              name='language'
              label='Language'
              value={draft.language}
              items={LANGUAGES}
              placeholder='Choose a language'
              onChange={(event) => pick('language', event.target.value)}
            />
          </div>
          <div className='grid gap-1.5 sm:col-span-2'>
            <SearchableSelectField
              id={`${ids.form}-timezone`}
              name='timezone'
              label='Timezone'
              value={draft.timezone}
              items={timezones}
              placeholder='Type a city or region'
              onChange={(event) => pick('timezone', event.target.value)}
            />
            {draft.timezone === '' && (
              <Button
                type='button'
                variant='link'
                className='h-auto justify-self-start p-0 text-sm'
                onClick={() => pick('timezone', suggestedZone)}
              >
                Use this device’s timezone ({suggestedZone})
              </Button>
            )}
          </div>
        </div>
        <form className='grid gap-1.5 border-t pt-4' onSubmit={changeUsername}>
          <Label htmlFor={ids.username}>Username</Label>
          <div className='flex flex-wrap gap-2'>
            <Input
              id={ids.username}
              name='username'
              value={draft.username}
              autoComplete='username'
              aria-describedby={`${ids.username}-hint`}
              className='max-w-xs flex-1'
              onChange={(event) => edit('username', event.target.value)}
            />
            <Button type='submit' variant='outline' disabled={!usernameChanged || saving}>
              Change username
            </Button>
          </div>
          <p id={`${ids.username}-hint`} className='text-xs text-muted-foreground'>
            Others may know you by it, so it changes only when you press the button.
          </p>
        </form>
        {conflict !== null && (
          <ConflictPanel
            conflict={conflict}
            fields={CONFLICT_FIELDS}
            onResolve={(merged) => {
              setStatus({ kind: 'saving', message: 'Saving…' });
              void outcome(onResolve(merged), 'Saved').then(setStatus);
            }}
            onDiscard={onDiscard}
          />
        )}
        <p
          role={status?.kind === 'failed' ? 'alert' : 'status'}
          className={status?.kind === 'failed' ? 'text-sm text-destructive' : 'min-h-5 text-sm text-muted-foreground'}
        >
          {status?.message ?? ''}
        </p>
      </CardContent>
    </Card>
  );
}
