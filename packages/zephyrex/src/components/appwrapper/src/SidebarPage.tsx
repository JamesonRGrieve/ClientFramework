// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import type { ReactNode } from 'react';
import { ViewVerticalIcon } from '@radix-ui/react-icons';
import { useSidebar } from '../../ui/sidebar';
import { Separator } from '../../ui/separator';
import { Button } from '../../ui/button';
import { useOptionalSidebarContent } from './SidebarContentManager';
import { SidebarHeader, SidebarHeaderTitle, SidebarMain } from './SidebarHeader';

interface SidebarPageProps {
  title: string;
  children: ReactNode;
  className?: string;
}

/**
 * A page in the app's frame: `title` labels the top bar, and `children` is the page itself. The bar's
 * title is chrome, not a heading, so the page's body renders the page's one h1 (as every framework
 * page does); a second h1 here would break the outline.
 */
export function SidebarPage({ title, children, className }: SidebarPageProps) {
  const { toggleSidebar } = useSidebar('right');
  // The phone toggle for the context sidebar shows only when a page has put something in it; on a
  // page without one (the account page) it would be a second "Toggle Sidebar" that does nothing.
  const contextContent = useOptionalSidebarContent()?.content;
  const hasContext = contextContent !== null && contextContent !== undefined;
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
