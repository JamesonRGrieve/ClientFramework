'use client';
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { ReactNode } from 'react';
import type { NavItemDefinition } from '@/lib/zephyrex/types';
import { useZephyrexConfig } from '@/lib/zephyrex/ZephyrexProvider';

/** Hides the phone's sidebar button when scripts are off: it opens a panel that needs them. */
const HIDE_SCRIPTED_TRIGGER = '[data-sidebar="trigger"]{display:none}';

/** The pages a definition links to, its own and its children's, in the sidebar's order. */
const linksOf = (definition: NavItemDefinition): { title: string; url: string }[] => [
  { title: definition.title, url: definition.url },
  ...(definition.children ?? []).flatMap(linksOf),
];

/**
 * The app's pages as a menu that needs no JavaScript, for a phone with scripts off or not yet
 * loaded: a `<details>` list of the same entries the sidebar shows, as plain links. It sits beside
 * the sidebar's phone button inside `<noscript>`, so with scripts on it's never rendered.
 */
export function NoScriptNav(): ReactNode {
  const { navItems } = useZephyrexConfig();
  const links = navItems.flatMap(linksOf);
  if (links.length === 0) {
    return null;
  }
  return (
    <noscript>
      <style>{HIDE_SCRIPTED_TRIGGER}</style>
      <details className='relative'>
        <summary className='flex h-10 cursor-pointer list-none items-center rounded-md px-3 text-sm font-medium [&::-webkit-details-marker]:hidden'>
          Menu
        </summary>
        <nav aria-label='Pages' className='absolute left-0 top-full z-30 min-w-56 rounded-md border bg-background p-2 shadow-md'>
          <ul className='grid gap-0.5'>
            {links.map((link) => (
              <li key={link.url}>
                <a href={link.url} className='block rounded px-2 py-1.5 text-sm hover:bg-muted'>
                  {link.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </details>
    </noscript>
  );
}
