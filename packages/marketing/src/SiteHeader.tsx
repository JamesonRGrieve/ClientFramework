// SPDX-License-Identifier: AGPL-3.0-or-later
import NextLink from 'next/link.js';
import type { ReactNode } from 'react';
import { Button } from 'zephyrex/ui/button';
import type { Link } from './content';

export interface SiteHeaderProps {
  /** The app's mark and name, linked home. */
  brand: ReactNode;
  nav: readonly Link[];
  cta: Link;
  /** The label of the narrow-screen menu. */
  menuLabel?: string;
}

/**
 * Top navigation for a landing page. The framework hides its sidebar on `/`, so the landing
 * page carries its own links; on narrow screens they fold into a native disclosure menu that
 * works without script.
 */
export function SiteHeader({ brand, nav, cta, menuLabel = 'Menu' }: SiteHeaderProps): ReactNode {
  return (
    <header className='sticky top-0 z-20 border-b bg-background/80 backdrop-blur-sm'>
      <div className='container mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4'>
        <NextLink href='/' className='flex items-center gap-2 font-semibold'>
          {brand}
        </NextLink>
        <nav aria-label='Main' className='hidden items-center gap-1 md:flex'>
          {nav.map((item) => (
            <Button key={item.href} asChild variant='ghost' size='sm'>
              <NextLink href={item.href}>{item.label}</NextLink>
            </Button>
          ))}
          <Button asChild size='sm' className='ml-2'>
            <NextLink href={cta.href}>{cta.label}</NextLink>
          </Button>
        </nav>
        <details className='relative md:hidden'>
          <summary className='cursor-pointer list-none rounded-md border px-3 py-1.5 text-sm marker:hidden'>
            {menuLabel}
          </summary>
          <nav aria-label='Main' className='absolute right-0 mt-2 w-48 rounded-lg border bg-background p-2 shadow-lg'>
            <ul className='space-y-1'>
              {[...nav, cta].map((item) => (
                <li key={item.href}>
                  <NextLink href={item.href} className='block rounded-md px-3 py-2 text-sm hover:bg-accent'>
                    {item.label}
                  </NextLink>
                </li>
              ))}
            </ul>
          </nav>
        </details>
      </div>
    </header>
  );
}
