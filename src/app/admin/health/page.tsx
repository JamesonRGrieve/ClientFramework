'use client';

import { SidebarPage } from '@/appwrapper/SidebarPage';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useHealth, useLiveness, useReadiness } from '@/hooks/api';
import type { ReadinessCheck } from '@/lib/api/types';

const stateBadgeVariant = (status?: string): 'default' | 'destructive' | 'secondary' => {
  if (!status) return 'secondary';
  if (status === 'UP' || status === 'pass') return 'default';
  if (status === 'warn') return 'secondary';
  return 'destructive';
};

export default function HealthPage(): JSX.Element {
  const health = useHealth();
  const liveness = useLiveness();
  const readiness = useReadiness();

  return (
    <SidebarPage title='Health & Readiness'>
      <div className='grid grid-cols-1 gap-4 p-4 md:grid-cols-3'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between'>
            <CardTitle className='text-sm font-medium'>/health</CardTitle>
            <Badge variant={stateBadgeVariant(health.data?.status)}>
              {health.error ? 'ERROR' : (health.data?.status ?? '...')}
            </Badge>
          </CardHeader>
          <CardContent className='text-xs text-muted-foreground'>App-level liveness</CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between'>
            <CardTitle className='text-sm font-medium'>/healthz</CardTitle>
            <Badge variant={stateBadgeVariant(liveness.data?.status)}>
              {liveness.error ? 'ERROR' : (liveness.data?.status ?? '...')}
            </Badge>
          </CardHeader>
          <CardContent className='text-xs text-muted-foreground'>K8s liveness probe</CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between'>
            <CardTitle className='text-sm font-medium'>/readyz</CardTitle>
            <Badge variant={stateBadgeVariant(readiness.data?.status)}>
              {readiness.error ? 'ERROR' : (readiness.data?.status ?? '...')}
            </Badge>
          </CardHeader>
          <CardContent className='text-xs text-muted-foreground'>Readiness with hysteresis</CardContent>
        </Card>
      </div>
      <div className='p-4'>
        <Card>
          <CardHeader>
            <CardTitle>Readiness checks</CardTitle>
          </CardHeader>
          <CardContent>
            {readiness.data?.checks?.length ? (
              <ul className='space-y-2'>
                {readiness.data.checks.map((check: ReadinessCheck) => (
                  <li key={check.name} className='flex items-center justify-between gap-3 text-sm'>
                    <span className='font-mono'>{check.name}</span>
                    <span className='flex items-center gap-2'>
                      {check.detail ? <span className='text-muted-foreground'>{check.detail}</span> : null}
                      <Badge variant={stateBadgeVariant(check.status)}>{check.status}</Badge>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className='text-sm text-muted-foreground'>No checks reported.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </SidebarPage>
  );
}
