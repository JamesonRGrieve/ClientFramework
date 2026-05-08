'use client';

import { SidebarPage } from '@/appwrapper/SidebarPage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useDlq, useDlqActions } from '@/hooks/api';
import { useState } from 'react';

export default function DlqPage(): JSX.Element {
  const [extension, setExtension] = useState('');
  const [ability, setAbility] = useState('');
  const dlq = useDlq({ extension: extension || undefined, ability: ability || undefined });
  const { replay, discard } = useDlqActions();

  const handleReplay = async (id: string): Promise<void> => {
    await replay(id);
    await dlq.mutate();
  };
  const handleDiscard = async (id: string): Promise<void> => {
    await discard(id);
    await dlq.mutate();
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
              placeholder='Extension'
              value={extension}
              onChange={(e) => setExtension(e.target.value)}
              className='w-48'
            />
            <Input
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
            {dlq.error ? (
              <p className='text-sm text-destructive'>Failed to load: {dlq.error.message}</p>
            ) : !dlq.data?.items.length ? (
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
                  {dlq.data.items.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className='font-mono text-xs'>{entry.id.slice(0, 8)}</TableCell>
                      <TableCell>{entry.extension}</TableCell>
                      <TableCell>{entry.ability}</TableCell>
                      <TableCell className='max-w-md truncate' title={entry.error_message}>
                        <span className='font-mono text-xs'>{entry.error_class}</span>: {entry.error_message}
                      </TableCell>
                      <TableCell>{entry.attempts}</TableCell>
                      <TableCell className='space-x-2 text-right'>
                        <Button size='sm' variant='outline' onClick={() => handleReplay(entry.id)}>
                          Replay
                        </Button>
                        <Button size='sm' variant='destructive' onClick={() => handleDiscard(entry.id)}>
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
