'use client';

import { ReactNode } from 'react';
import { SidebarHeader, SidebarHeaderTitle, SidebarMain } from './SidebarHeader';
import { useSidebar } from '../../ui/sidebar';
import { Separator } from '../../ui/separator';
import { Button } from '../../ui/button';
import { ViewVerticalIcon } from '@radix-ui/react-icons';

interface SidebarPageProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function SidebarPage({ title, children, className }: SidebarPageProps) {
  const { toggleSidebar } = useSidebar('right');
  return (
    <>
      <SidebarHeader>
        <SidebarHeaderTitle>{title}</SidebarHeaderTitle>
        <div className='flex items-center h-full md:hidden'>
        <Separator orientation='vertical' className='h-4' />
        <Button variant='ghost' size='icon' onClick={toggleSidebar}>
          <ViewVerticalIcon />
          <span className='sr-only'>Toggle Sidebar</span>
        </Button>
      </div>
      </SidebarHeader>
      <SidebarMain className={className}>{children}</SidebarMain>
    </>
  );
}
