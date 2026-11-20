// SPDX-License-Identifier: AGPL-3.0-or-later
import Link from 'next/link.js';
import type { ReactNode } from 'react';
import { Button } from 'zephyrex/ui/button';
import type { Link as LinkContent } from './content';
import { Heading, type HeadingLevel } from './Heading';

/** The closing call to action on landing pages; its heading at the caller's level (an h2 by default). */
export function CtaBand({
  title,
  body,
  action,
  level = 2,
}: {
  title: string;
  body: string;
  action: LinkContent;
  level?: HeadingLevel;
}): ReactNode {
  return (
    <section aria-labelledby='cta-title' className='rounded-2xl border bg-accent/40 p-8 text-center'>
      <Heading level={level} id='cta-title' className='text-2xl font-bold'>
        {title}
      </Heading>
      <p className='mt-2 text-muted-foreground'>{body}</p>
      <Button asChild size='lg' className='mt-6'>
        <Link href={action.href}>{action.label}</Link>
      </Button>
    </section>
  );
}
