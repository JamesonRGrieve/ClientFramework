'use client';
// SPDX-License-Identifier: AGPL-3.0-or-later
import { Button } from '@jgrieve/forms/components/ui/button';
import { type ReactElement, useCallback, useState } from 'react';
import useSWR from 'swr';
import { ConflictPanel, useClient, useGuardedSave, writeProblem } from 'zephyrex';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'zephyrex/ui/card';
import { z } from 'zod';

export const SESSIONS_ENDPOINT = '/v1/session';

/** A sign-in the server keeps (auth_session); only what the page shows is read. */
export const SessionSchema = z.object({
  id: z.string(),
  device_type: z.string().nullable().optional(),
  device_name: z.string().nullable().optional(),
  browser: z.string().nullable().optional(),
  is_active: z.boolean(),
  revoked: z.boolean().optional(),
  last_activity: z.string(),
  expires_at: z.string(),
  // The row's version, sent back verbatim as If-Match on a sign-out.
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
});
export type Session = z.infer<typeof SessionSchema>;

/** How a session is named to its owner: the browser and device it was signed in from. */
export const sessionLabel = ({ browser, device_name: deviceName, device_type: deviceType }: Session): string => {
  const device = deviceName ?? deviceType ?? '';
  const parts = [browser ?? '', device].filter((part) => part !== '');
  return parts.length === 0 ? 'Unknown device' : parts.join(' on ');
};

function SessionRow({
  session,
  onRevoke,
}: {
  session: Session;
  onRevoke: (session: Session) => Promise<string | null>;
}): ReactElement {
  const [pending, setPending] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const label = sessionLabel(session);

  return (
    <li className='grid gap-2 p-4'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <div>
          <p className='font-medium'>{label}</p>
          <p className='text-sm text-muted-foreground'>
            Last active {new Date(session.last_activity).toLocaleString()} · expires{' '}
            {new Date(session.expires_at).toLocaleString()}
          </p>
        </div>
        <Button
          size='sm'
          variant='outline'
          disabled={pending}
          aria-label={`Sign out ${label}`}
          onClick={() => {
            setPending(true);
            void (async (): Promise<void> => {
              const failure = await onRevoke(session);
              setProblem(failure);
              setPending(failure === null);
            })();
          }}
        >
          Sign out
        </Button>
      </div>
      {problem !== null && (
        <p role='alert' className='text-sm text-destructive'>
          {problem}
        </p>
      )}
    </li>
  );
}

/** The signed-in user's active sessions, each of which they can sign out. */
export function Sessions(): ReactElement {
  const client = useClient();
  const sessions = useSWR<Session[], Error>(client.url(SESSIONS_ENDPOINT), async () =>
    client.list(SESSIONS_ENDPOINT, 'sessions', SessionSchema),
  );
  const active = (sessions.data ?? []).filter((session) => session.is_active && session.revoked !== true);
  const { mutate: refreshSessions } = sessions;
  const [problem, setProblem] = useState<string | null>(null);
  const revoke = useGuardedSave(
    useCallback(
      async (seen: Session): Promise<void> => {
        await client.delete(`${SESSIONS_ENDPOINT}/${encodeURIComponent(seen.id)}`, seen);
        await refreshSessions();
      },
      [client, refreshSessions],
    ),
    SessionSchema,
  );

  // A sign-out refused because the session changed first shows its conflict above the list.
  const settle = async (revoking: Promise<boolean>): Promise<string | null> =>
    writeProblem(revoking, 'The session could not be signed out.');
  const onRevoke = async (session: Session): Promise<string | null> => settle(revoke.save(session, {}));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active sessions</CardTitle>
        <CardDescription>Where your account is signed in. Signing out this browser ends this visit too.</CardDescription>
      </CardHeader>
      <CardContent>
        {revoke.conflict !== null && (
          <ConflictPanel
            conflict={revoke.conflict}
            fields={[]}
            applyLabel='Sign out anyway'
            onResolve={(merged) => {
              void settle(revoke.resolve(merged)).then(setProblem);
            }}
            onDiscard={revoke.discard}
          />
        )}
        {problem !== null && (
          <p role='alert' className='text-sm text-destructive'>
            {problem}
          </p>
        )}
        {sessions.error !== undefined && (
          <p role='alert' className='text-sm text-destructive'>
            Your sessions could not be loaded: {sessions.error.message}
          </p>
        )}
        {sessions.error === undefined && active.length === 0 && (
          <p className='text-sm text-muted-foreground'>{sessions.isLoading ? 'Loading…' : 'No active sessions.'}</p>
        )}
        {active.length > 0 && (
          <ul aria-label='Active sessions' className='divide-y rounded-md border'>
            {active.map((session) => (
              <SessionRow key={session.id} session={session} onRevoke={onRevoke} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
