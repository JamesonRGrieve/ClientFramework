// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { SidebarPage } from '@/components/appwrapper/src/SidebarPage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useClient } from '@/lib/zephyrex/hooks';
import { useCallback, useState } from 'react';
import useSWR from 'swr';

interface CacheStats {
  status: string;
  backend: string;
  connected: boolean;
  entity_cache: {
    keys: number;
    hit_rate: number;
    memory_bytes: number;
  };
  response_cache: {
    keys: number;
    hit_rate: number;
    memory_bytes: number;
  };
  rate_limits: {
    active_keys: number;
    blocked_ips: number;
  };
  replay_cache: {
    active_nonces: number;
  };
  counters: {
    active: number;
  };
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i] ?? 'B'}`;
}

export default function CachePage(): JSX.Element {
  const client = useClient();
  const [flushStatus, setFlushStatus] = useState<string | null>(null);

  const { data, error, isLoading, mutate } = useSWR<CacheStats>(
    '/v1/admin/cache/stats',
    async () => client.get<CacheStats>('/v1/admin/cache/stats'),
    { refreshInterval: 5000 },
  );

  const handleFlush = useCallback(
    async (scope: 'entity' | 'response' | 'all') => {
      try {
        setFlushStatus(`Flushing ${scope} cache...`);
        await client.post(`/v1/admin/cache/flush`, { scope });
        setFlushStatus(`${scope} cache flushed`);
        await mutate();
        setTimeout(() => setFlushStatus(null), 3000);
      } catch {
        setFlushStatus('Flush failed');
        setTimeout(() => setFlushStatus(null), 3000);
      }
    },
    [client, mutate],
  );

  const connected = data?.connected ?? false;
  const backend = data?.backend ?? 'unknown';

  return (
    <SidebarPage title='Cache & Rate Limits'>
      <div className='space-y-4 p-4'>
        {/* Connection status */}
        <Card>
          <CardHeader className='flex flex-row items-center justify-between'>
            <div>
              <CardTitle className='text-sm font-medium'>Valkey / Redis</CardTitle>
              <CardDescription>{backend}</CardDescription>
            </div>
            <Badge variant={connected ? 'default' : 'destructive'}>
              {isLoading ? '...' : error ? 'ERROR' : connected ? 'Connected' : 'Disconnected'}
            </Badge>
          </CardHeader>
        </Card>

        {flushStatus && (
          <div className='rounded-md bg-muted px-4 py-2 text-sm'>{flushStatus}</div>
        )}

        {/* Cache stats grid */}
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          {/* Entity cache */}
          <Card>
            <CardHeader className='flex flex-row items-center justify-between'>
              <CardTitle className='text-sm font-medium'>Entity Cache</CardTitle>
              <Button variant='outline' size='sm' onClick={() => void handleFlush('entity')}>
                Flush
              </Button>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>Cached keys</span>
                <span className='font-mono'>{data?.entity_cache?.keys ?? 0}</span>
              </div>
              <div>
                <div className='flex justify-between text-sm mb-1'>
                  <span className='text-muted-foreground'>Hit rate</span>
                  <span className='font-mono'>{((data?.entity_cache?.hit_rate ?? 0) * 100).toFixed(1)}%</span>
                </div>
                <Progress value={(data?.entity_cache?.hit_rate ?? 0) * 100} />
              </div>
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>Memory</span>
                <span className='font-mono'>{formatBytes(data?.entity_cache?.memory_bytes ?? 0)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Response cache */}
          <Card>
            <CardHeader className='flex flex-row items-center justify-between'>
              <CardTitle className='text-sm font-medium'>Response Cache</CardTitle>
              <Button variant='outline' size='sm' onClick={() => void handleFlush('response')}>
                Flush
              </Button>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>Cached keys</span>
                <span className='font-mono'>{data?.response_cache?.keys ?? 0}</span>
              </div>
              <div>
                <div className='flex justify-between text-sm mb-1'>
                  <span className='text-muted-foreground'>Hit rate</span>
                  <span className='font-mono'>{((data?.response_cache?.hit_rate ?? 0) * 100).toFixed(1)}%</span>
                </div>
                <Progress value={(data?.response_cache?.hit_rate ?? 0) * 100} />
              </div>
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>Memory</span>
                <span className='font-mono'>{formatBytes(data?.response_cache?.memory_bytes ?? 0)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Rate limits */}
          <Card>
            <CardHeader>
              <CardTitle className='text-sm font-medium'>Rate Limiting</CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>Active limit keys</span>
                <span className='font-mono'>{data?.rate_limits?.active_keys ?? 0}</span>
              </div>
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>Blocked IPs</span>
                <span className='font-mono'>{data?.rate_limits?.blocked_ips ?? 0}</span>
              </div>
            </CardContent>
          </Card>

          {/* Replay + Counters */}
          <Card>
            <CardHeader>
              <CardTitle className='text-sm font-medium'>Replay Cache & Counters</CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>Active nonces</span>
                <span className='font-mono'>{data?.replay_cache?.active_nonces ?? 0}</span>
              </div>
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>Distributed counters</span>
                <span className='font-mono'>{data?.counters?.active ?? 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className='flex justify-end'>
          <Button variant='destructive' size='sm' onClick={() => void handleFlush('all')}>
            Flush All Caches
          </Button>
        </div>
      </div>
    </SidebarPage>
  );
}
