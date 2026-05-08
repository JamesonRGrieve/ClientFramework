'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenuButton,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';
import { ViewVerticalIcon } from '@radix-ui/react-icons';
import { usePathname } from 'next/navigation';
import { useSidebarContent } from './SidebarContentManager';

const visibleOnPaths = ['/chat', '/settings/prompts', '/settings/chains', '/settings', '/resident/', '/team','/provider','/rotation'];

export function SidebarContext({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { toggleSidebar } = useSidebar('right');
  const { content, title } = useSidebarContent();
  const pathname = usePathname();

  if (!visibleOnPaths.some((path) => pathname.startsWith(path))) {
    return null;
  }

  return (
    <Sidebar collapsible='icon' side='right' {...props}>
      <SidebarHeader>
        {title !== 'Context Sidebar' && <h3 className='group-data-[collapsible=icon]:hidden'>{title}</h3>}
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
