// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { usePathname } from 'next/navigation.js';

import { FaRobot } from 'react-icons/fa';
import { NavMain } from './NavMain';
import { ToggleSidebar } from './ToggleSidebar';
import { accountsEnabled, DEFAULT_AUTH_PATH, MANAGE_PAGE } from '@/lib/zephyrex/authPath';
import { useZephyrexConfig } from '@/lib/zephyrex/ZephyrexProvider';
import { NavUser } from '@/components/appwrapper/src/NavUser';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from '@/components/ui/sidebar';


export function SidebarMain({ children, ...props }: React.ComponentProps<typeof Sidebar> & { children?: React.ReactNode }) {
  const pathname = usePathname();
  const { config } = useZephyrexConfig();
  const authPath = config.auth?.authPath ?? DEFAULT_AUTH_PATH;

  // No sidebar on the landing page or the sign-in pages; the account page keeps it.
  if (pathname === '/' || (pathname.startsWith(authPath) && pathname !== `${authPath}${MANAGE_PAGE}`)) {
    return null;
  }

  return (
    <Sidebar collapsible='icon' {...props} className='hide-scrollbar'>
      <SidebarHeader>
        <SidebarLogo />
      </SidebarHeader>
      <SidebarContent>
        <NavMain />
        {children}
      </SidebarContent>
      <SidebarFooter>
        <ToggleSidebar side='left' />
        {accountsEnabled(config) && <NavUser />}
      </SidebarFooter>
      <SidebarRail side='left' />
    </Sidebar>
  );
}

/** The app's mark (`config.app.logo`, a placeholder when it has none) and name, the name hidden when collapsed. */
export function SidebarLogo() {
  const { config } = useZephyrexConfig();
  const Logo = config.app.logo;
  return (
    <div className='flex items-center gap-2 w-full px-2'>
      {Logo === undefined ? (
        <div className='flex items-center justify-center rounded-lg aspect-square size-8 bg-sidebar-primary text-sidebar-primary-foreground flex-shrink-0'>
          <FaRobot className='size-4' />
        </div>
      ) : (
        <div className='flex items-center justify-center aspect-square size-8 flex-shrink-0'>
          <Logo />
        </div>
      )}
      <div className='text-sm leading-tight text-left w-full hidden md:block group-data-[collapsible=icon]:hidden'>
        <span className='font-semibold text-lg truncate block'>{config.app.name}</span>
      </div>
    </div>
  );
}
