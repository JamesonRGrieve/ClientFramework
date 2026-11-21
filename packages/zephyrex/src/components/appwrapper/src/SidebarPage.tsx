// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { type ReactNode, useEffect } from 'react';
import { ViewVerticalIcon } from '@radix-ui/react-icons';
import { useSidebar } from '../../ui/sidebar';
import { Separator } from '../../ui/separator';
import { Button } from '../../ui/button';
import { useOptionalSidebarContent } from './SidebarContentManager';
import { SidebarHeader, SidebarHeaderTitle, SidebarMain } from './SidebarHeader';
import { devWarning } from '@/lib/log';

interface SidebarPageProps {
  title: string;
  children: ReactNode;
  className?: string;
}

/**
 * A page in the app's frame: `title` labels the top bar, and `children` is the page itself. The bar's
 * title is chrome, not a heading, so the page's body renders the page's one h1 (as every framework
 * page does); a second h1 here would break the outline. The bar names where you are (empty on a
 * top-level page, the section on a nested one) and never repeats the h1; in development a repeat
 * logs a warning.
 */
export function SidebarPage({ title, children, className }: SidebarPageProps) {
  const { toggleSidebar } = useSidebar('right');
  // The phone toggle for the context sidebar shows only when a page has put something in it; on a
  // page without one (the account page) it would be a second "Toggle Sidebar" that does nothing.
  const contextContent = useOptionalSidebarContent()?.content;
  const hasContext = contextContent !== null && contextContent !== undefined;
  // The bar names where you are and the body's h1 names what you're looking at; they never repeat
  // (SOP: Zephyrex Framework App Standards, UX and UI). Warn the app's developer when they do.
  useEffect(() => {
    const barTitle = title.trim().toLowerCase();
    const pageTitle = document.querySelector('h1')?.textContent.trim().toLowerCase();
    if (barTitle !== '' && barTitle === pageTitle) {
      devWarning(
        `SidebarPage's title "${title}" repeats the page's h1. Leave the bar empty on a top-level page, or name the section it belongs to.`,
      );
    }
  }, [title]);
  return (
    <>
      <SidebarHeader>
        <SidebarHeaderTitle>{title}</SidebarHeaderTitle>
        {hasContext && (
        <div className='flex items-center h-full md:hidden'>
        <Separator orientation='vertical' className='h-4' />
        <Button variant='ghost' size='icon' onClick={toggleSidebar}>
          <ViewVerticalIcon />
          <span className='sr-only'>Toggle the side panel</span>
        </Button>
        </div>
        )}
      </SidebarHeader>
      <SidebarMain className={className}>{children}</SidebarMain>
    </>
  );
}
