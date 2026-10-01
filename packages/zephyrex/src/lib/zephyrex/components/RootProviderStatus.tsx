// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import type { JSX } from 'react';
import { Badge } from '../../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import {
  type ProviderHealth,
  type RootProviderSetting,
  type RootProviderStatusOptions,
  useRootProviderStatus,
} from '../useRootProviderStatus';
import { rootOnlyView } from '../rootOnlyView';

const settingValue = (setting: RootProviderSetting): string => {
  if (!setting.set) {
    return 'Not set';
  }
  return setting.secret ? 'Set (secret)' : (setting.value ?? '');
};

const HEALTH_LABELS: Record<ProviderHealth['status'], string> = { ok: 'Healthy', degraded: 'Degraded', down: 'Down' };
const HEALTH_VARIANTS: Record<ProviderHealth['status'], 'default' | 'secondary' | 'destructive'> = {
  ok: 'default',
  degraded: 'secondary',
  down: 'destructive',
};

function HealthLine({ health }: { health: ProviderHealth }): JSX.Element {
  return (
    <p className='mb-3 flex items-center gap-2 text-sm'>
      <Badge variant={HEALTH_VARIANTS[health.status]}>{HEALTH_LABELS[health.status]}</Badge>
      {health.detail === '' ? null : <span className='text-muted-foreground'>{health.detail}</span>}
    </p>
  );
}

/**
 * Root-only view of how each loaded provider is configured from the server environment, setting by
 * setting; narrowed to one extension's providers and with their health checks when asked.
 */
export function RootProviderStatus(options: RootProviderStatusOptions): JSX.Element {
  const view = rootOnlyView(useRootProviderStatus(options), 'provider environment configuration');
  if (view.fallback !== null) {
    return view.fallback;
  }
  const { data } = view;
  if (data.providers.length === 0) {
    return (
      <p className='p-4 text-sm text-muted-foreground'>
        {options.extension === undefined
          ? 'No providers are loaded.'
          : `No providers are loaded for the ${options.extension} extension.`}
      </p>
    );
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
            {status.health === null ? null : <HealthLine health={status.health} />}
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
