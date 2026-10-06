// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { Button } from '@jgrieve/forms/components/ui/button';
import { Input } from '@jgrieve/forms/components/ui/input';
import { Label } from '@jgrieve/forms/components/ui/label';
import { ceremonyProblem, passkeysSupported } from '@zephyrex/auth';
import { type ReactElement, type SyntheticEvent, useId, useState } from 'react';
import { ConflictPanel, useClient, useDraft, useEditBase, writeProblem } from 'zephyrex';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'zephyrex/ui/card';
import { credentialKind, credentialName, credentialStatus } from './credentialDisplay';
import {
  type Attachment,
  type PasskeyCredential,
  DEVICE_NAME_MAX_LENGTH,
  registerPasskey,
  useCredentialActions,
  useCredentials,
} from './credentialsApi';

const REMOVE_FAILURE = 'It could not be removed.';
const RENAME_FAILURE = 'It could not be renamed.';

const ATTACHMENTS: readonly { value: string; attachment: Attachment; label: string }[] = [
  { value: 'any', attachment: null, label: 'Whichever your browser offers' },
  { value: 'platform', attachment: 'platform', label: 'This device (a passkey)' },
  { value: 'cross-platform', attachment: 'cross-platform', label: 'A security key or another device' },
];

const trimmedOrNull = (text: string): string | null => (text.trim() === '' ? null : text.trim());
const nameOf = ({ device_name: name }: PasskeyCredential): string => name ?? '';

/** One credential: what it is and whether it can be used, renaming it, and removing it. */
function CredentialRow({ credential }: { credential: PasskeyCredential }): ReactElement {
  const id = useId();
  const { rename, remove } = useCredentialActions();
  const { base, rebaseOnSave } = useEditBase(credential);
  const [name, setName] = useDraft(base, nameOf);
  const [renaming, setRenaming] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const settleRename = async (renamingNow: Promise<boolean>): Promise<void> => {
    try {
      if (await rebaseOnSave(renamingNow)) {
        setRenaming(false);
      }
    } catch (error) {
      setProblem(error instanceof Error ? error.message : RENAME_FAILURE);
    }
  };
  const submit = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setProblem(null);
    void settleRename(rename.save(base, { device_name: trimmedOrNull(name) }));
  };

  return (
    <li className='grid gap-2 px-4 py-3 text-sm'>
      <div className='flex flex-wrap items-start justify-between gap-2'>
        <div className='grid gap-0.5'>
          <span className='font-medium'>{credentialName(credential)}</span>
          <span className='text-muted-foreground'>{credentialKind(credential)}</span>
          <span className={credential.is_enabled ? 'text-muted-foreground' : 'text-destructive'}>
            {credentialStatus(credential)}
          </span>
        </div>
        <div className='flex gap-2'>
          <Button type='button' size='sm' variant='outline' aria-expanded={renaming} onClick={() => setRenaming(!renaming)}>
            Rename
          </Button>
          <Button
            type='button'
            size='sm'
            variant='ghost'
            onClick={() => {
              void writeProblem(remove.save(credential, {}), REMOVE_FAILURE).then(setProblem);
            }}
          >
            Remove
          </Button>
        </div>
      </div>
      {renaming && (
        <form
          aria-label={`Rename ${credentialName(credential)}`}
          className='flex flex-wrap items-end gap-2'
          noValidate
          onSubmit={submit}
        >
          <div className='grid flex-1 gap-1'>
            <Label htmlFor={id}>Name</Label>
            <Input
              id={id}
              maxLength={DEVICE_NAME_MAX_LENGTH}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <Button type='submit' size='sm'>
            Save name
          </Button>
        </form>
      )}
      {rename.conflict !== null && (
        <ConflictPanel
          conflict={rename.conflict}
          fields={[{ key: 'device_name', label: 'Name' }]}
          onResolve={(merged) => {
            void settleRename(rename.resolve(merged));
          }}
          onDiscard={rename.discard}
        />
      )}
      {remove.conflict !== null && (
        <ConflictPanel
          conflict={remove.conflict}
          fields={[]}
          applyLabel='Remove anyway'
          onResolve={(merged) => {
            void writeProblem(remove.resolve(merged), REMOVE_FAILURE).then(setProblem);
          }}
          onDiscard={remove.discard}
        />
      )}
      {problem !== null && (
        <p role='alert' className='text-sm text-destructive'>
          {problem}
        </p>
      )}
    </li>
  );
}

/** Register a passkey or security key: the browser asks for it, then the server keeps it. */
function AddPasskey(): ReactElement {
  const client = useClient();
  const ids = { name: useId(), where: useId() };
  const { mutate: refresh } = useCredentials();
  const [name, setName] = useState('');
  const [where, setWhere] = useState('any');
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<{ text: string; alert: boolean } | null>(null);

  const submit = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const attachment = ATTACHMENTS.find(({ value }) => value === where)?.attachment ?? null;
    setPending(true);
    setNotice(null);
    void (async (): Promise<void> => {
      try {
        const stored = await registerPasskey(client, attachment, trimmedOrNull(name));
        await refresh();
        setName('');
        setNotice({ text: `Added ${credentialName(stored)}.`, alert: false });
      } catch (error) {
        // A browser's refusal is a DOMException, which is not an Error everywhere (jsdom's is not).
        const failed = error instanceof DOMException || error instanceof Error;
        setNotice({ text: failed ? ceremonyProblem(error) : 'It could not be added.', alert: true });
      } finally {
        setPending(false);
      }
    })();
  };

  if (!passkeysSupported()) {
    return <p className='text-sm text-muted-foreground'>This browser can’t register passkeys.</p>;
  }
  return (
    <form aria-label='Add a passkey' className='grid gap-3' noValidate onSubmit={submit}>
      <div className='grid gap-1'>
        <Label htmlFor={ids.name}>Name (optional)</Label>
        <Input
          id={ids.name}
          maxLength={DEVICE_NAME_MAX_LENGTH}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>
      <div className='grid gap-1'>
        <Label htmlFor={ids.where}>Where</Label>
        <select
          id={ids.where}
          className='rounded-md border bg-background px-2 py-2 text-sm'
          value={where}
          onChange={(event) => setWhere(event.target.value)}
        >
          {ATTACHMENTS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Button type='submit' disabled={pending}>
          {pending ? 'Waiting for your browser…' : 'Add a passkey'}
        </Button>
      </div>
      {notice !== null && (
        <p role={notice.alert ? 'alert' : 'status'} className={notice.alert ? 'text-sm text-destructive' : 'text-sm'}>
          {notice.text}
        </p>
      )}
    </form>
  );
}

/** The account page's passkeys: signing in without a password, and security keys as a second factor. */
export function Passkeys(): ReactElement {
  const { data: credentials = [], error, isLoading } = useCredentials();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Passkeys</CardTitle>
        <CardDescription>
          Sign in with your device’s screen lock or a security key instead of a password. Each also works as your second
          factor.
        </CardDescription>
      </CardHeader>
      <CardContent className='grid gap-6'>
        {error !== undefined && (
          <p role='alert' className='text-sm text-destructive'>
            Your passkeys could not be loaded: {error.message}
          </p>
        )}
        {error === undefined && credentials.length === 0 && (
          <p className='text-sm text-muted-foreground'>{isLoading ? 'Loading…' : 'You have no passkeys yet.'}</p>
        )}
        {credentials.length > 0 && (
          <ul aria-label='Your passkeys' className='divide-y rounded-md border'>
            {credentials.map((credential) => (
              <CredentialRow key={credential.id} credential={credential} />
            ))}
          </ul>
        )}
        <AddPasskey />
      </CardContent>
    </Card>
  );
}
