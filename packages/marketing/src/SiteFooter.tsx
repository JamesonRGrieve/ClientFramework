// SPDX-License-Identifier: AGPL-3.0-or-later
import Link from 'next/link.js';
import type { ReactNode } from 'react';
import type { FooterColumn } from './content';
import { Heading, type HeadingLevel } from './Heading';

/** Site-wide footer links, and an optional closing line (the app's own words); column titles at the caller's level (h2 by default). */
export function SiteFooter({
  columns,
  note,
  level = 2,
}: {
  columns: readonly FooterColumn[];
  note?: ReactNode;
  level?: HeadingLevel;
}): ReactNode {
  return (
    <footer className='mt-16 border-t pt-8 pb-4 text-sm'>
      <nav aria-label='Footer' className='grid gap-6 sm:grid-cols-3'>
        {columns.map((column) => (
          <div key={column.title}>
            <Heading level={level} className='font-semibold'>
              {column.title}
            </Heading>
            <ul className='mt-2 space-y-1.5'>
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className='text-muted-foreground hover:text-foreground hover:underline'>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      {note && <p className='mt-8 text-xs text-muted-foreground'>{note}</p>}
    </footer>
  );
}
