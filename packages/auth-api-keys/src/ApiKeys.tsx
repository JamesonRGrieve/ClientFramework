'use client';
// SPDX-License-Identifier: AGPL-3.0-or-later
import { Button } from '@jgrieve/forms/components/ui/button';
import { Input } from '@jgrieve/forms/components/ui/input';
import { Label } from '@jgrieve/forms/components/ui/label';
import { type ReactElement, type SyntheticEvent, useId, useState } from 'react';
import useSWR from 'swr';
import { useClient } from 'zephyrex';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'zephyrex/ui/card';
import { CopyButton } from 'zephyrex/ui/copy-button';
import { z } from 'zod';

export const API_KEYS_ENDPOINT = '/v1/auth/api-keys';

/** A key as listed: the server never returns the key itself after issuing it. */
export const ApiKeySchema = z.object({
  id: z.string(),
  name: z.string(),
  created_at: z.string(),
  expires_at: z.string().nullable().optional(),
  last_used_at: z.string().nullable().optional(),
  is_revoked: z.boolean().optional(),
});
export type ApiKey = z.infer<typeof ApiKeySchema>;

/** Issue and rotate answer with the raw key, exactly once. */
export const IssuedKeySchema = z.object({
  id: z.string(),
  name: z.string(),
  key: z.string(),
  expires_at: z.string().nullable().optional(),
});
export type IssuedKey = z.infer<typeof IssuedKeySchema>;

const dateOr = (value: string | null | undefined, never: string): string =>
  value === null || value === undefined ? never : new Date(value).toLocaleDateString();

/** An `<input type=date>` value as the end of that day in the viewer's time zone, or none. */
export const expiryFromDate = (date: string): string | undefined =>
  date === '' ? undefined : new Date(`${date}T23:59:59`).toISOString();

function IssuedKeyNotice({ issued, onDone }: { issued: IssuedKey; onDone: () => void }): ReactElement {
  return (
    <div role='status' className='grid gap-2 rounded-md border border-primary p-4'>
      <p className='text-sm font-medium'>Copy the key for “{issued.name}” now. It will not be shown again.</p>
      <code className='break-all rounded bg-muted p-2 text-sm'>{issued.key}</code>
      <div className='flex gap-2'>
        <CopyButton content={issued.key} label='Copy key' />
        <Button size='sm' variant='outline' onClick={onDone}>
          Done
        </Button>
      </div>
    </div>
  );
}

function KeyRow({
  apiKey,
  onRotate,
  onRevoke,
}: {
  apiKey: ApiKey;
  onRotate: (apiKey: ApiKey) => Promise<string | null>;
  onRevoke: (apiKey: ApiKey) => Promise<string | null>;
}): ReactElement {
  const [pending, setPending] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const act = (action: (apiKey: ApiKey) => Promise<string | null>): void => {
    setPending(true);
    void (async (): Promise<void> => {
      setProblem(await action(apiKey));
      setPending(false);
    })();
  };

  return (
    <li className='grid gap-2 p-4'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <div>
          <p className='font-medium'>{apiKey.name}</p>
          <p className='text-sm text-muted-foreground'>
            Created {dateOr(apiKey.created_at, '')} · last used {dateOr(apiKey.last_used_at, 'never')} · expires{' '}
            {dateOr(apiKey.expires_at, 'never')}
          </p>
        </div>
        <div className='flex gap-2'>
          <Button
            size='sm'
            variant='outline'
            disabled={pending}
            aria-label={`Rotate ${apiKey.name}`}
            onClick={() => act(onRotate)}
          >
            Rotate
          </Button>
          <Button
            size='sm'
            variant='outline'
            disabled={pending}
            aria-label={`Revoke ${apiKey.name}`}
            onClick={() => act(onRevoke)}
          >
            Revoke
          </Button>
        </div>
      </div>
      {problem !== null && (
        <p role='alert' className='text-sm text-destructive'>
          {problem}
        </p>
      )}
    </li>
  );
}

/** The signed-in user's API keys for programmatic access: issue, rotate and revoke. */
export function ApiKeys(): ReactElement {
  const nameId = useId();
  const expiryId = useId();
  const client = useClient();
  const keys = useSWR<ApiKey[], Error>(client.url(API_KEYS_ENDPOINT), async () =>
    client.list(API_KEYS_ENDPOINT, 'api_keys', ApiKeySchema),
  );
  const [name, setName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [issued, setIssued] = useState<IssuedKey | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const live = (keys.data ?? []).filter((apiKey) => apiKey.is_revoked !== true);

  const issue = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (name.trim() === '') {
      setProblem('Name the key so you can recognise it later.');
      return;
    }
    void (async (): Promise<void> => {
      try {
        const expiresAt = expiryFromDate(expiry);
        setIssued(
          IssuedKeySchema.parse(
            await client.post(`${API_KEYS_ENDPOINT}/issue`, {
              name: name.trim(),
              ...(expiresAt === undefined ? {} : { expires_at: expiresAt }),
            }),
          ),
        );
        setName('');
        setExpiry('');
        setProblem(null);
        await keys.mutate();
      } catch (error) {
        setProblem(error instanceof Error ? error.message : 'The key could not be issued.');
      }
    })();
  };

  const onRotate = async (apiKey: ApiKey): Promise<string | null> => {
    try {
      setIssued(IssuedKeySchema.parse(await client.post(`${API_KEYS_ENDPOINT}/rotate`, { key_id: apiKey.id })));
      await keys.mutate();
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : 'The key could not be rotated.';
    }
  };

  const onRevoke = async (apiKey: ApiKey): Promise<string | null> => {
    try {
      await client.delete(`${API_KEYS_ENDPOINT}/${encodeURIComponent(apiKey.id)}`);
      await keys.mutate();
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : 'The key could not be revoked.';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>API keys</CardTitle>
        <CardDescription>
          Keys let scripts and other services call the API as you. Send one as a Bearer token.
        </CardDescription>
      </CardHeader>
      <CardContent className='grid gap-4'>
        {issued !== null && <IssuedKeyNotice issued={issued} onDone={() => setIssued(null)} />}
        <form className='flex flex-wrap items-end gap-2' onSubmit={issue}>
          <div className='grid gap-1'>
            <Label htmlFor={nameId}>Key name</Label>
            <Input id={nameId} value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <div className='grid gap-1'>
            <Label htmlFor={expiryId}>Expires (optional)</Label>
            <Input id={expiryId} type='date' value={expiry} onChange={(event) => setExpiry(event.target.value)} />
          </div>
          <Button type='submit'>Issue key</Button>
        </form>
        {problem !== null && (
          <p role='alert' className='text-sm text-destructive'>
            {problem}
          </p>
        )}
        {keys.error !== undefined && (
          <p role='alert' className='text-sm text-destructive'>
            Your keys could not be loaded: {keys.error.message}
          </p>
        )}
        {keys.error === undefined && live.length === 0 && (
          <p className='text-sm text-muted-foreground'>{keys.isLoading ? 'Loading…' : 'You have no API keys.'}</p>
        )}
        {live.length > 0 && (
          <ul aria-label='API keys' className='divide-y rounded-md border'>
            {live.map((apiKey) => (
              <KeyRow key={apiKey.id} apiKey={apiKey} onRotate={onRotate} onRevoke={onRevoke} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
