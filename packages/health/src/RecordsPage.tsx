// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import Link from 'next/link.js';
import type { ReactElement } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from 'zephyrex/ui/card';
import type { HealthRow, RecordType } from './records';
import { RecordsPanel } from './RecordsPanel';
import { activityType, mealType, sleepType, weightType } from './recordTypes';
import { HEALTH_PATH } from './routes';

function Log<T extends HealthRow>({ type }: { type: RecordType<T> }): ReactElement {
  return (
    <main className='mx-auto flex w-full max-w-4xl flex-col gap-6 p-4 md:p-10'>
      <div className='grid gap-1'>
        <Link href={HEALTH_PATH} className='text-sm text-muted-foreground underline'>
          Health
        </Link>
        <h1 className='text-3xl font-semibold'>{type.plural}</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Log</CardTitle>
        </CardHeader>
        <CardContent>
          <RecordsPanel type={type} />
        </CardContent>
      </Card>
    </main>
  );
}

/** One log of the health extension, by its route segment: activity, meal, weight or sleep. */
export function RecordsPage({ params }: { params: Record<string, string> }): ReactElement {
  switch (params['kind']) {
    case activityType.name:
      return <Log type={activityType} />;
    case mealType.name:
      return <Log type={mealType} />;
    case weightType.name:
      return <Log type={weightType} />;
    case sleepType.name:
      return <Log type={sleepType} />;
    default:
      return (
        <p className='p-4 text-sm text-muted-foreground'>
          There is no such health log.{' '}
          <Link href={HEALTH_PATH} className='underline'>
            Back to health
          </Link>
        </p>
      );
  }
}
