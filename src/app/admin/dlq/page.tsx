// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { type JSX, useState } from 'react';
import { SidebarPage } from 'zephyrex/components/appwrapper/src/SidebarPage';
import { useDlq, useDlqActions } from 'zephyrex/hooks/api';
import { Button } from 'zephyrex/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from 'zephyrex/ui/card';
import { Input } from 'zephyrex/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'zephyrex/ui/table';

/** How much of an entry's id the table shows. */
const SHORT_ID_LENGTH = 8;

export default function DlqPage(): JSX.Element {
  const [extension, setExtension] = useState('');
  const [ability, setAbility] = useState('');
  const dlq = useDlq({
    extension: extension === '' ? undefined : extension,
    ability: ability === '' ? undefined : ability,
  });
  const { replay, discard } = useDlqActions();
  const [actionError, setActionError] = useState('');
  const loadError = dlq.error instanceof Error ? dlq.error.message : undefined;
  const entries = dlq.data?.items ?? [];

  // Replaying or discarding refreshes the list; a failure is shown, not dropped.
  const act = (action: (id: string) => Promise<unknown>, id: string): void => {
    setActionError('');
    action(id)
      .then(async () => dlq.mutate())
      .catch((error: Error) => {
        setActionError(error.message);
      });
  };

  return (
    <SidebarPage title='Dead-Letter Queue'>
      <div className='space-y-4 p-4'>
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent className='flex flex-wrap gap-2'>
            <Input
              aria-label='Extension'
              placeholder='Extension'
              value={extension}
              onChange={(e) => setExtension(e.target.value)}
              className='w-48'
            />
            <Input
              aria-label='Ability'
              placeholder='Ability'
              value={ability}
              onChange={(e) => setAbility(e.target.value)}
              className='w-48'
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Failed operations ({dlq.data?.total ?? dlq.data?.items.length ?? 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {actionError !== '' && (
              <p role='alert' className='mb-2 text-sm text-destructive'>
                {actionError}
              </p>
            )}
            {loadError !== undefined ? (
              <p role='alert' className='text-sm text-destructive'>
                Failed to load: {loadError}
              </p>
            ) : entries.length === 0 ? (
              <p className='text-sm text-muted-foreground'>No entries.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Extension</TableHead>
                    <TableHead>Ability</TableHead>
                    <TableHead>Error</TableHead>
                    <TableHead>Attempts</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className='font-mono text-xs'>{entry.id.slice(0, SHORT_ID_LENGTH)}</TableCell>
                      <TableCell>{entry.extension}</TableCell>
                      <TableCell>{entry.ability}</TableCell>
                      <TableCell className='max-w-md truncate' title={entry.error_message}>
                        <span className='font-mono text-xs'>{entry.error_class}</span>: {entry.error_message}
                      </TableCell>
                      <TableCell>{entry.attempts}</TableCell>
                      <TableCell className='space-x-2 text-right'>
                        <Button size='sm' variant='outline' onClick={() => act(replay, entry.id)}>
                          Replay
                        </Button>
                        <Button size='sm' variant='destructive' onClick={() => act(discard, entry.id)}>
                          Discard
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </SidebarPage>
  );
}
