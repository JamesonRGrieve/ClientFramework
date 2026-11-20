// SPDX-License-Identifier: AGPL-3.0-or-later
import Link from 'next/link.js';
import type { ReactNode } from 'react';
import { Button } from 'zephyrex/ui/button';
import type { Link as LinkContent } from './content';

/** The closing call to action on landing pages. */
export function CtaBand({ title, body, action }: { title: string; body: string; action: LinkContent }): ReactNode {
  return (
    <section aria-labelledby='cta-title' className='rounded-2xl border bg-accent/40 p-8 text-center'>
      <h2 id='cta-title' className='text-2xl font-bold'>
        {title}
      </h2>
      <p className='mt-2 text-muted-foreground'>{body}</p>
      <Button asChild size='lg' className='mt-6'>
        <Link href={action.href}>{action.label}</Link>
      </Button>
    </section>
  );
}
