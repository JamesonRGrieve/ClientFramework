// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { CaretRightIcon } from '@radix-ui/react-icons';
import { BadgeCheck, LogOut } from 'lucide-react';

import { getGravatarUrl } from '@zephyrex/auth/gravatar';
import { useRouter } from 'next/navigation.js';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { Appearances } from '@/components/appwrapper/src/UserMenu';
import { DEFAULT_AUTH_PATH, MANAGE_PAGE } from '@/lib/zephyrex/authPath';
import { type User, useUser } from '@/lib/zephyrex/hooks';
import { useZephyrexConfig } from '@/lib/zephyrex/ZephyrexProvider';

type SignedInUser = Pick<User, 'email' | 'first_name' | 'last_name'>;

/** The user's Gravatar, falling back to their initials. */
function UserAvatar({ user }: { user: SignedInUser | undefined }) {
  const firstName = user?.first_name ?? '';
  return (
    <Avatar className='w-8 h-8 rounded-lg'>
      <AvatarImage src={getGravatarUrl(user?.email ?? '')} {...(firstName === '' ? {} : { alt: firstName })} />
      <AvatarFallback className='rounded-lg'>{user === undefined ? null : userInitials(user)}</AvatarFallback>
    </Avatar>
  );
}

export function NavUser() {
  const { isMobile } = useSidebar('left');
  const router = useRouter();
  const { config } = useZephyrexConfig();
  const authPath = config.auth?.authPath ?? DEFAULT_AUTH_PATH;
  // The shared hook: it asks only with a session, and is the one source of the user app-wide.
  const { data: user, isValidating } = useUser();
  const email = user?.email ?? '';
  const hasUser = email !== '';
  const fullName = [user?.first_name, user?.last_name].filter((part) => part !== null && part !== undefined).join(' ');

  const handleLogout = () => {
    router.push(`${authPath}/logout`);
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        {hasUser || isValidating ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                side='left'
                size='lg'
                className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group-data-[collapsible=icon]:my-2 pl-0 transition-none'
              >
                <UserAvatar user={user} />
                <div className='grid flex-1 text-sm leading-tight text-left'>
                  {hasUser ? (
                    <>
                      <span className='font-semibold capitalize truncate'>{fullName}</span>
                      <span className='text-xs truncate'>{email}</span>
                    </>
                  ) : (
                    // Loading state: show skeleton while validating
                    <>
                      <Skeleton className='w-1/2 h-3 mb-1' />
                      <Skeleton className='h-3' />
                    </>
                  )}
                </div>

                <CaretRightIcon className='ml-auto size-4' />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
              side={isMobile ? 'bottom' : 'right'}
              align='end'
              sideOffset={4}
            >
              <DropdownMenuLabel className='p-0 font-normal'>
                <div className='flex items-center gap-2 px-1 py-2 text-sm text-left'>
                  <UserAvatar user={user} />
                  <div className='grid flex-1 text-sm leading-tight text-left'>
                    <span className='font-semibold truncate'>{fullName}</span>
                    <span className='text-xs truncate'>{email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => router.push(`${authPath}${MANAGE_PAGE}`)}>
                  <BadgeCheck className='mr-2 size-4' />
                  Account
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <Appearances />
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className='mr-2 size-4' />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <SidebarMenuButton
            side='left'
            size='lg'
            className='group-data-[collapsible=icon]:my-2 pl-0'
            onClick={() => router.push(authPath)}
          >
            <Avatar className='w-8 h-8 rounded-lg'>
              <AvatarFallback className='rounded-lg'>SI</AvatarFallback>
            </Avatar>
            <div className='grid flex-1 text-sm leading-tight text-left'>
              <span className='font-semibold truncate'>Sign in</span>
            </div>
            <CaretRightIcon className='ml-auto size-4' />
          </SidebarMenuButton>
        )}
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

/** The user's initials for an avatar fallback, or null without both names. */
export function userInitials(user: Partial<Pick<User, 'first_name' | 'last_name'>>): string | null {
  const first = user.first_name?.trim().charAt(0) ?? '';
  const last = user.last_name?.trim().charAt(0) ?? '';
  return first === '' || last === '' ? null : `${first}${last}`.toUpperCase();
}
