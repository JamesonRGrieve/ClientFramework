'use client';
// SPDX-License-Identifier: AGPL-3.0-or-later
import Link from 'next/link.js';
import { usePathname } from 'next/navigation.js';
import type { ReactNode } from 'react';
import { SidebarPage } from '../../../../components/appwrapper/src/SidebarPage';
import { SidebarInset } from '../../../../components/ui/sidebar';
import { useZephyrexConfig } from '../../ZephyrexProvider';

const MANAGE_PATH = '/user/manage';

/**
 * Layout for the /user routes (mount as `app/user/layout.tsx`). The account page gets the
 * app shell; sign-in, registration and the other auth steps get a centred card under the app name.
 */
export function UserLayout({ children }: { children: ReactNode }): ReactNode {
  const pathname = usePathname();
  const { config } = useZephyrexConfig();

  if (pathname === MANAGE_PATH) {
    return (
      <SidebarInset>
        <SidebarPage title=''>
          <h2 className='sr-only'>Account Management</h2>
          {children}
        </SidebarPage>
      </SidebarInset>
    );
  }

  return (
    <SidebarInset className='flex h-full w-full flex-col'>
      <header
        className='sticky top-0 flex min-h-16 items-center justify-center gap-4 border-b bg-muted px-4 md:px-6'
        style={{ paddingTop: 'env(safe-area-inset-top)', height: 'calc(3.5rem + env(safe-area-inset-top))' }}
      >
        <Link href='/' className='flex items-center gap-2 text-lg font-semibold text-foreground'>
          {config.app.name}
        </Link>
      </header>
      <div className='flex w-full flex-1 flex-col items-center justify-center'>{children}</div>
    </SidebarInset>
  );
}
