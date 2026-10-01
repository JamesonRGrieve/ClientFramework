// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import type { JSX, ReactNode } from 'react';
import { rootOnlyView } from 'zephyrex';
import { Badge } from 'zephyrex/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from 'zephyrex/ui/card';
import { useObservabilityStatus } from './useObservabilityStatus';

const BACKEND_NAMES: Record<string, string> = {
  prometheus: 'Prometheus',
  otel: 'OpenTelemetry',
  sentry: 'Sentry',
  rollbar: 'Rollbar',
};

function StatusCard({
  title,
  backend,
  children,
}: {
  title: string;
  backend: string | null;
  children: ReactNode;
}): JSX.Element {
  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between'>
        <CardTitle className='text-sm font-medium'>{title}</CardTitle>
        <Badge variant={backend === null ? 'secondary' : 'default'}>
          {backend === null ? 'Off' : (BACKEND_NAMES[backend] ?? backend)}
        </Badge>
      </CardHeader>
      <CardContent className='text-sm text-muted-foreground'>{children}</CardContent>
    </Card>
  );
}

/** Root-only view of which metrics backend and error reporter the server has wired. */
export function ObservabilityStatus(): JSX.Element {
  const view = rootOnlyView(useObservabilityStatus(), 'observability status');
  if (view.fallback !== null) {
    return view.fallback;
  }
  const { metrics, error_reporter: reporter } = view.data;

  return (
    <div className='grid grid-cols-1 gap-4 p-4 md:grid-cols-2'>
      <StatusCard title='Metrics' backend={metrics.backend}>
        {metrics.backend === null ? (
          'No metrics backend is configured.'
        ) : metrics.endpoint === null ? (
          'Metrics are exported to the configured collector.'
        ) : (
          <>
            Scraped at <code className='font-mono'>{metrics.endpoint}</code>.
          </>
        )}
      </StatusCard>
      <StatusCard title='Error reporting' backend={reporter.backend}>
        {reporter.backend === null
          ? 'No error reporter is configured.'
          : reporter.dsn_set
            ? 'Errors are reported to the configured DSN.'
            : 'No DSN is set, so errors are not being sent anywhere.'}
      </StatusCard>
    </div>
  );
}
