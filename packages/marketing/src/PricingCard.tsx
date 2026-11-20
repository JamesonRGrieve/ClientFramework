// SPDX-License-Identifier: AGPL-3.0-or-later
import Link from 'next/link.js';
import type { ReactNode } from 'react';
import { Badge } from 'zephyrex/ui/badge';
import { Button } from 'zephyrex/ui/button';
import { cn } from 'zephyrex/utils';
import type { Plan } from './content';
import { Heading, type HeadingLevel } from './Heading';

export interface PricingCardProps {
  plan: Plan;
  level?: HeadingLevel;
  /** The badge on the highlighted plan. */
  recommendedLabel?: string;
}

/** A plan: price, what it includes, and where to start. */
export function PricingCard({ plan, level = 3, recommendedLabel = 'Recommended' }: PricingCardProps): ReactNode {
  return (
    <article
      aria-labelledby={`plan-${plan.id}`}
      className={cn('flex h-full flex-col rounded-xl border p-6', plan.highlighted && 'border-primary ring-1 ring-primary')}
    >
      {/* The badge sits on its own line so a long plan name never wraps beside it. */}
      <div className='h-6'>{plan.highlighted && <Badge>{recommendedLabel}</Badge>}</div>
      <Heading level={level} id={`plan-${plan.id}`} className='mt-2 text-lg font-semibold'>
        {plan.name}
      </Heading>
      <p className='mt-4'>
        <span className='text-4xl font-bold'>{plan.price}</span>{' '}
        <span className='text-sm text-muted-foreground'>{plan.cadence}</span>
      </p>
      <p className='mt-3 text-sm text-muted-foreground'>{plan.blurb}</p>
      <ul className='mt-4 flex-1 space-y-2 text-sm'>
        {plan.includes.map((item) => (
          <li key={item} className='flex gap-2'>
            <span aria-hidden className='text-primary'>
              ✓
            </span>
            {item}
          </li>
        ))}
      </ul>
      <Button asChild className='mt-6' variant={plan.highlighted ? 'default' : 'outline'}>
        <Link href={plan.cta.href}>{plan.cta.label}</Link>
      </Button>
    </article>
  );
}
