// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ReactNode } from 'react';
import { Badge } from 'zephyrex/ui/badge';
import type { Feature } from './content';
import { Heading, type HeadingLevel } from './Heading';

export interface FeatureCardProps {
  feature: Feature;
  level?: HeadingLevel;
  /** The badge on a feature only the hosted service has. */
  hostedLabel?: string;
}

/** One feature: title, summary, the points that matter, and whether it needs the hosted service. */
export function FeatureCard({ feature, level = 3, hostedLabel = 'Hosted service' }: FeatureCardProps): ReactNode {
  return (
    <article id={feature.id} aria-labelledby={`${feature.id}-title`} className='scroll-mt-16 rounded-xl border p-5'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <Heading level={level} id={`${feature.id}-title`} className='text-lg font-semibold'>
          {feature.title}
        </Heading>
        {feature.availability === 'hosted' && <Badge variant='secondary'>{hostedLabel}</Badge>}
      </div>
      <p className='mt-2 text-muted-foreground'>{feature.summary}</p>
      <ul className='mt-3 list-disc space-y-1 pl-5 text-sm'>
        {feature.details.map((detail) => (
          <li key={detail}>{detail}</li>
        ))}
      </ul>
    </article>
  );
}
