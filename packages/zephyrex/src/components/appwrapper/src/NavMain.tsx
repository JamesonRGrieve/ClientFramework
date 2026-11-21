'use client';
// SPDX-License-Identifier: AGPL-3.0-or-later

import { ChevronRightIcon } from '@radix-ui/react-icons';
import { useCallback, useEffect, useState } from 'react';

import Link from 'next/link.js';
import { usePathname, useRouter, useSearchParams } from 'next/navigation.js';
import type { Item as NavItem } from '@zephyrex/auth/NavMenu';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { useNotifications, useSelectedTeam } from '@/lib/zephyrex/hooks';
import { NOTIFICATIONS_URL } from '@/lib/zephyrex/extensions/auth_notifications';
import { sameChildren, toNavMenuItems } from '@/lib/zephyrex/navigation';
import type { NavChild } from '@/lib/zephyrex/types';
import { useZephyrexConfig } from '@/lib/zephyrex/ZephyrexProvider';

type Item = NavItem;
type SubItem = NonNullable<Item['items']>[number];

/** The most unread notifications the count shows before it says "9+" (as the bell does). */
const UNREAD_MAX = 9;

/** How many notifications are unread, beside the inbox's link; nothing when none are. */
function UnreadCount(): React.JSX.Element | null {
  const { data } = useNotifications();
  const unread = data?.filter((notification) => !notification.read).length ?? 0;
  if (unread === 0) {
    return null;
  }
  return (
    <SidebarMenuBadge className='bg-primary text-primary-foreground peer-hover/menu-button:text-primary-foreground peer-data-[active=true]/menu-button:text-primary-foreground'>
      {unread > UNREAD_MAX ? `${String(UNREAD_MAX)}+` : unread}
      <span className='sr-only'> unread</span>
    </SidebarMenuBadge>
  );
}

/**
 * A top-level entry with no children: a link, so it can be opened in a new tab, middle-clicked or
 * copied like any other.
 */
function NavLink({ item, active }: { item: Item; active: boolean }): React.JSX.Element {
  const ItemIcon = item.icon;
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        side='left'
        tooltip={item.title}
        className={cn(active && 'bg-muted font-medium text-foreground [&>svg]:text-primary')}
      >
        <Link href={item.url ?? '/'} aria-current={active ? 'page' : undefined}>
          {ItemIcon !== undefined && <ItemIcon />}
          <span>{item.title}</span>
        </Link>
      </SidebarMenuButton>
      {item.url === NOTIFICATIONS_URL && <UnreadCount />}
    </SidebarMenuItem>
  );
}

/**
 * Calls one nav entry's `useChildren` hook and hands what it gives to the menu. It renders nothing:
 * the menu draws the sub-entries, and a hook is never called in a loop.
 */
function NavChildren({
  title,
  useChildren,
  onChildren,
}: {
  title: string;
  useChildren: () => readonly NavChild[] | undefined;
  onChildren: (title: string, children: readonly NavChild[]) => void;
}): null {
  const children = useChildren();
  useEffect(() => {
    onChildren(title, children ?? []);
  }, [title, children, onChildren]);
  return null;
}

export function NavMain(): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname();
  const queryParams = useSearchParams();
  // `my_role` is a runtime-only field not present on the base team schema.
  const company: { name?: string; my_role?: number } | undefined = useSelectedTeam() ?? undefined;
  const { toggleSidebar, open } = useSidebar('left');
  const { navItems: contributedNavItems } = useZephyrexConfig();
  // The sub-entries each entry's `useChildren` gave, by title; replaced only when they change.
  const [computed, setComputed] = useState<ReadonlyMap<string, readonly NavChild[]>>(new Map());
  const takeChildren = useCallback((title: string, children: readonly NavChild[]): void => {
    setComputed((known) => (sameChildren(known.get(title) ?? [], children) ? known : new Map(known).set(title, children)));
  }, []);

  // Only what the app's config and its enabled extensions declare: a page the app does not mount
  // has no entry.
  const itemsWithActiveState = toNavMenuItems(contributedNavItems, computed).map((item) => ({
    ...item,
    isActive: isActive(item, pathname, queryParams),
  }));

  const topItems = itemsWithActiveState.filter((i) => i.title !== 'Documentation');
  // Each entry's heading, by title (the menu items themselves carry no group).
  const groupOf = new Map(contributedNavItems.map((definition) => [definition.title, definition.group]));
  // The visible items that start a new group, so the group's heading goes above them.
  const groupStarts = new Set<string>();
  let previousGroup: string | undefined;
  for (const item of topItems) {
    const group = item.visible === false ? undefined : groupOf.get(item.title);
    if (group !== undefined && group !== previousGroup) {groupStarts.add(item.title);}
    if (group !== undefined) {previousGroup = group;}
  }
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
      {contributedNavItems.map((definition) =>
        definition.useChildren === undefined ? null : (
          <NavChildren
            key={definition.title}
            title={definition.title}
            useChildren={definition.useChildren}
            onChildren={takeChildren}
          />
        ),
      )}
      <div className='flex-1 overflow-y-auto overflow-x-hidden'>
        {/* Names the menu for screen readers; on screen the entries speak for themselves. */}
        <SidebarGroupLabel className='sr-only'>Pages</SidebarGroupLabel>
        <SidebarMenu>
          {topItems.map((item) => {
            if (item.visible === false) {
              return null;
            }
            const ItemIcon = item.icon;
            const hasChildren = item.items !== undefined && item.items.length > 0;
            const group = groupOf.get(item.title);
            const heading =
              group !== undefined && groupStarts.has(item.title) ? (
                <li
                  key={`group-${group}`}
                  className='px-2 pt-4 pb-1 text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground first:pt-1 group-data-[collapsible=icon]:hidden'
                >
                  {group}
                </li>
              ) : null;
            if (!hasChildren && item.url !== undefined && item.url !== '') {
              return [heading, <NavLink key={item.title} item={item} active={item.isActive} />];
            }
            return [
              heading,
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
                          <SidebarMenuSubItem key={`${subItem.url}#${subItem.title}`}>
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
              </Collapsible>,
            ];
          })}
        </SidebarMenu>
      </div>

      {/* Sticky bottom section for Documentation */}
      <div className='sticky bottom-0 pt-2 w-full'>
        <SidebarMenu>
          {bottomItems.map((item) => {
            const ItemIcon = item.icon;
            const hasChildren = item.items !== undefined && item.items.length > 0;
            if (!hasChildren && item.url !== undefined && item.url !== '') {
              return <NavLink key={item.title} item={item} active={item.isActive} />;
            }
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
                          <SidebarMenuSubItem key={`${subItem.url}#${subItem.title}`}>
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
