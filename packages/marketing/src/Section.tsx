// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ReactNode } from 'react';
import { cn } from 'zephyrex/utils';
import { Heading, type HeadingLevel } from './Heading';

export interface SectionProps {
  id: string;
  title: string;
  eyebrow?: string;
  intro?: ReactNode;
  level?: HeadingLevel;
  className?: string;
  children?: ReactNode;
}

/** A titled landing-page section, labelled by its heading for assistive technology. */
export function Section({ id, title, eyebrow, intro, level = 2, className, children }: SectionProps): ReactNode {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={cn('scroll-mt-16 space-y-6', className)}>
      <header className='space-y-2'>
        {eyebrow && <p className='text-sm font-semibold tracking-wide text-muted-foreground uppercase'>{eyebrow}</p>}
        <Heading level={level} id={`${id}-title`} className='text-2xl font-bold sm:text-3xl'>
          {title}
        </Heading>
        {intro && <div className='max-w-2xl text-muted-foreground'>{intro}</div>}
      </header>
      {children}
    </section>
  );
}
