// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import Link from 'next/link.js';
import type { ReactElement } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'zephyrex/ui/card';
import { minutesLabel } from './fields';
import { useRecords } from './healthApi';
import { activityType, mealType, sleepType, weightType } from './recordTypes';
import { recordsPath } from './routes';
import { caloriesOn, lastNight, latestWeight, weeklyActiveMinutes } from './summary';

function Figure({
  title,
  name,
  value,
  detail,
}: {
  title: string;
  name: string;
  value: string;
  detail: string;
}): ReactElement {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Link href={recordsPath(name)} className='hover:underline'>
            {title}
          </Link>
        </CardTitle>
        <CardDescription>{detail}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className='text-2xl font-semibold'>{value}</p>
      </CardContent>
    </Card>
  );
}

/** The health log at a glance: this week's activity, today's eating, the latest weight and last night. */
export function HealthPage(): ReactElement {
  const today = new Date();
  const activities = useRecords(activityType).data ?? [];
  const meals = useRecords(mealType).data ?? [];
  const weight = latestWeight(useRecords(weightType).data ?? []);
  const night = lastNight(useRecords(sleepType).data ?? []);

  return (
    <main className='mx-auto flex w-full max-w-4xl flex-col gap-6 p-4 md:p-10'>
      <h1 className='text-3xl font-semibold'>Health</h1>
      <div className='grid gap-4 sm:grid-cols-2'>
        <Figure
          title='Activity'
          name={activityType.name}
          value={minutesLabel(weeklyActiveMinutes(activities, today))}
          detail='Active over the last seven days'
        />
        <Figure title='Meals' name={mealType.name} value={`${String(caloriesOn(meals, today))} kcal`} detail='Eaten today' />
        <Figure
          title='Weight'
          name={weightType.name}
          value={weight === undefined ? '—' : `${String(weight.weight_kg)} kg`}
          detail={weight === undefined ? 'Nothing weighed yet' : 'Latest weighing'}
        />
        <Figure
          title='Sleep'
          name={sleepType.name}
          value={night === undefined ? '—' : minutesLabel(night.duration_minutes)}
          detail={night === undefined ? 'No nights recorded yet' : 'Last night'}
        />
      </div>
    </main>
  );
}
