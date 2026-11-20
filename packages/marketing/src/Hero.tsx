// SPDX-License-Identifier: AGPL-3.0-or-later
import Link from 'next/link.js';
import type { ReactNode } from 'react';
import { Button } from 'zephyrex/ui/button';
import type { Link as LinkContent } from './content';

export interface HeroProps {
  /** The page's one h1. */
  title: string;
  lead: ReactNode;
  primary: LinkContent;
  secondary?: LinkContent;
  /** What the visitor gets, shown beside the words: a live sample, never a stock image. */
  sample?: ReactNode;
}

/** The landing page's opening: the promise, where to start, and a sample of the product. */
export function Hero({ title, lead, primary, secondary, sample }: HeroProps): ReactNode {
  return (
    <section aria-labelledby='hero-title' className='grid items-center gap-10 py-12 md:grid-cols-2 md:py-20'>
      <div className='space-y-6'>
        <h1 id='hero-title' className='text-4xl font-bold tracking-tight text-balance sm:text-5xl'>
          {title}
        </h1>
        <div className='max-w-prose text-lg text-muted-foreground'>{lead}</div>
        <div className='flex flex-wrap gap-3'>
          <Button asChild size='lg'>
            <Link href={primary.href}>{primary.label}</Link>
          </Button>
          {secondary && (
            <Button asChild size='lg' variant='outline'>
              <Link href={secondary.href}>{secondary.label}</Link>
            </Button>
          )}
        </div>
      </div>
      {sample && <div>{sample}</div>}
    </section>
  );
}
