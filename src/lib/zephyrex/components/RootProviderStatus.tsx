// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import type { JSX } from 'react';
import { Badge } from '../../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { ApiError } from '../client';
import { type RootProviderSetting, useRootProviderStatus } from '../useRootProviderStatus';

const FORBIDDEN = 403;

const settingValue = (setting: RootProviderSetting): string => {
  if (!setting.set) {
    return 'Not set';
  }
  return setting.secret ? 'Set (secret)' : (setting.value ?? '');
};

/** Root-only view of how each loaded provider is configured from the server environment, setting by setting. */
export function RootProviderStatus(): JSX.Element {
  const { data, error } = useRootProviderStatus();

  if (error instanceof ApiError && error.status === FORBIDDEN) {
    return (
      <p className='p-4 text-sm text-muted-foreground'>Only the root user can view provider environment configuration.</p>
    );
  }
  if (error !== undefined) {
    return <p className='p-4 text-sm text-destructive'>Failed to load provider status.</p>;
  }
  if (data === undefined) {
    return <p className='p-4 text-sm text-muted-foreground'>Loading…</p>;
  }
  if (data.providers.length === 0) {
    return <p className='p-4 text-sm text-muted-foreground'>No providers are loaded.</p>;
  }

  return (
    <div className='grid grid-cols-1 gap-4 p-4'>
      {data.providers.map((status) => (
        <Card key={`${status.extension}:${status.provider}`}>
          <CardHeader className='flex flex-row items-center justify-between'>
            <CardTitle className='text-sm font-medium'>
              {status.provider} <span className='font-normal text-muted-foreground'>({status.extension})</span>
            </CardTitle>
            <Badge variant={status.configured ? 'default' : 'destructive'}>
              {status.configured ? 'Configured' : 'Not configured'}
            </Badge>
          </CardHeader>
          <CardContent>
            {status.settings.length === 0 ? (
              <p className='text-sm text-muted-foreground'>Reads no environment settings.</p>
            ) : (
              <Table aria-label={`${status.provider} settings`}>
                <TableHeader>
                  <TableRow>
                    <TableHead>Setting</TableHead>
                    <TableHead>Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {status.settings.map((setting) => (
                    <TableRow key={setting.key}>
                      <TableCell className='font-mono'>{setting.key}</TableCell>
                      <TableCell className={setting.set ? '' : 'text-destructive'}>{settingValue(setting)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
