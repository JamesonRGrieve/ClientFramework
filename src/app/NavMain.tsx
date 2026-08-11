'use client';
// SPDX-License-Identifier: AGPL-3.0-or-later

import { ChevronRightIcon } from '@radix-ui/react-icons';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTeam } from '@zephyrex/auth/hooks/useTeam';
import { type Item as NavItem, items } from '@zephyrex/auth/NavMenu';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

export const navItems = items;
type Item = NavItem;
type SubItem = NonNullable<Item['items']>[number];

export function NavMain(): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname();
  const queryParams = useSearchParams();
  const { data: companyData } = useTeam();
  // `my_role` is a runtime-only field not present on the base team schema.
  const company: { name?: string; my_role?: number } | undefined = companyData ?? undefined;
  const { toggleSidebar, open } = useSidebar('left');

  const itemsWithActiveState = items.map((item) => ({
    ...item,
    isActive: isActive(item, pathname, queryParams),
  }));

  const topItems = itemsWithActiveState.filter((i) => i.title !== 'Documentation');
  const bottomItems = itemsWithActiveState.filter((i) => i.title === 'Documentation');

  const sidebarItemClickHanlder = (isOpen: boolean, item: Item): void => {
    if (item.items !== undefined && item.items.length > 0) {
      if (!isOpen) {
        toggleSidebar();
      }
    }
    if (item.url !== undefined && item.url !== '') {
      router.push(item.url);
    }
  };

  // Add logic to determine if team management should be shown
  return (
    <SidebarGroup className='flex flex-col h-full'>
      <div className='flex-1 overflow-y-auto overflow-x-hidden'>
        <SidebarGroupLabel>Pages</SidebarGroupLabel>
        <SidebarMenu>
          {topItems.map((item) => {
            if (item.visible === false) {
              return null;
            }
            const ItemIcon = item.icon;
            const hasChildren = item.items !== undefined && item.items.length > 0;
            return (
              <Collapsible key={item.title} asChild defaultOpen={item.isActive} className='group/collapsible'>
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      side='left'
                      tooltip={item.title}
                      onClick={() => sidebarItemClickHanlder(open, item)}
                      className={cn(item.isActive && !hasChildren && 'bg-muted')}
                    >
                      {ItemIcon !== undefined && <ItemIcon />}
                      <span>{item.title}</span>
                      <ChevronRightIcon
                        className={cn(
                          'ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90',
                          hasChildren ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent hidden={!hasChildren}>
                    <SidebarMenuSub className='pr-0 mr-0'>
                      {item.items?.map((subItem) => {
                        if (
                          subItem.max_role !== undefined &&
                          (company?.name === undefined || (company.my_role ?? 0) > subItem.max_role)
                        ) {
                          return null;
                        }
                        const SubIcon = subItem.icon;
                        return (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton asChild>
                              <Link
                                href={
                                  subItem.queryParams !== undefined
                                    ? Object.entries(subItem.queryParams).reduce(
                                        (url, [key, value]) => `${url}${key}=${value}&`,
                                        `${subItem.url}?`,
                                      )
                                    : subItem.url
                                }
                                className={cn('w-full', isSubItemActive(subItem, pathname, queryParams) && 'bg-muted')}
                              >
                                <span className='flex items-center gap-2'>
                                  {SubIcon !== undefined && <SubIcon className='w-4 h-4' />}
                                  {subItem.max_role !== undefined && `${company?.name ?? ''} `}
                                  {subItem.title}
                                </span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            );
          })}
        </SidebarMenu>
      </div>

      {/* Sticky bottom section for Documentation */}
      <div className='sticky bottom-0 pt-2 w-full'>
        <SidebarMenu>
          {bottomItems.map((item) => {
            const ItemIcon = item.icon;
            const hasChildren = item.items !== undefined && item.items.length > 0;
            return (
              <Collapsible key={item.title} asChild defaultOpen={item.isActive} className='group/collapsible'>
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton side='left' tooltip={item.title} onClick={() => sidebarItemClickHanlder(open, item)}>
                      {ItemIcon !== undefined && <ItemIcon />}
                      <span>{item.title}</span>
                      <ChevronRightIcon
                        className={cn(
                          'ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90',
                          hasChildren ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent hidden={!hasChildren}>
                    <SidebarMenuSub>
                      {item.items?.map((subItem) => {
                        const SubIcon = subItem.icon;
                        return (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton asChild>
                              <Link href={subItem.url}>
                                {SubIcon !== undefined && <SubIcon className='w-4 h-4' />}
                                {subItem.title}
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            );
          })}
        </SidebarMenu>
      </div>
    </SidebarGroup>
  );
}

function isActive(item: Item, pathname: string, queryParams: URLSearchParams): boolean {
  if (item.items !== undefined) {
    return item.items.some((subItem) => {
      if (subItem.url === pathname) {
        if (subItem.queryParams !== undefined) {
          return Object.entries(subItem.queryParams).every(([key, value]) => queryParams.get(key) === value);
        }
        // If no query params are defined on the item, require URL to have no query params
        return [...queryParams.keys()].length === 0;
      }
      return false;
    });
  }

  // Root level items
  if (item.url === pathname) {
    if (item.queryParams !== undefined) {
      return Object.entries(item.queryParams).every(([key, value]) => queryParams.get(key) === value);
    }
    return [...queryParams.keys()].length === 0;
  }
  return false;
}
function isSubItemActive(subItem: SubItem, pathname: string, queryParams: URLSearchParams): boolean {
  if (subItem.url !== pathname) {
    return false;
  }

  // If subitem has query params, they must all match
  if (subItem.queryParams !== undefined) {
    return Object.entries(subItem.queryParams).every(([key, value]) => queryParams.get(key) === value);
  }

  // If no query params defined on subitem, URL must have no query params
  return queryParams.size === 0;
}
