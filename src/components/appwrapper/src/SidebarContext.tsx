// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { ViewVerticalIcon } from '@radix-ui/react-icons';
import { usePathname } from 'next/navigation.js';
import { DEFAULT_SIDEBAR_TITLE, useSidebarContent } from './SidebarContentManager';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenuButton,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';

/** Where the context sidebar shows unless the app says otherwise. */
export const DEFAULT_CONTEXT_SIDEBAR_PATHS: readonly string[] = ['/chat', '/resident/', '/team', '/provider', '/rotation'];

export function SidebarContext({
  visibleOn = DEFAULT_CONTEXT_SIDEBAR_PATHS,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  /** Path prefixes the sidebar shows on. */
  visibleOn?: readonly string[];
}) {
  const { toggleSidebar } = useSidebar('right');
  const { content, title } = useSidebarContent();
  const pathname = usePathname();

  if (!visibleOn.some((path) => pathname.startsWith(path))) {
    return null;
  }

  return (
    <Sidebar collapsible='icon' side='right' {...props}>
      <SidebarHeader>
        {title !== DEFAULT_SIDEBAR_TITLE && <h3 className='group-data-[collapsible=icon]:hidden'>{title}</h3>}
      </SidebarHeader>
      <SidebarContent>{content}</SidebarContent>
      <SidebarFooter>
        <SidebarMenuButton tooltip='Expand Sidebar' side='right' onClick={toggleSidebar}>
          <ViewVerticalIcon />
          <span>Collapse Sidebar</span>
        </SidebarMenuButton>
      </SidebarFooter>
      <SidebarRail side='right' />
    </Sidebar>
  );
}
