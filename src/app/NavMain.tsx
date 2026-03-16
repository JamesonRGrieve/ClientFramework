'use client';

import { ChevronRightIcon } from '@radix-ui/react-icons';

import { useTeam } from '@jgrieve/auth/hooks/useTeam';
import { items } from '@/components/auth/src/NavMenu';
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
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export const navItems = items;
export type Item = {
  title: string;
  url?: string;
  visible?: boolean;
  icon?: any;
  isActive?: boolean;
  queryParams?: object;
  items?: {
    max_role?: number;
    title: string;
    icon?: any;
    url: string;
    queryParams?: object;
  }[];
};

export function NavMain() {
  const router = useRouter();
  const pathname = usePathname();
  const queryParams = useSearchParams();
  const { data: company } = useTeam();
  const { toggleSidebar, open } = useSidebar('left');

  const itemsWithActiveState = items.map((item) => ({
    ...item,
    isActive: isActive(item, pathname, queryParams),
  }));

  const topItems = itemsWithActiveState.filter((i) => i.title !== 'Documentation');
  const bottomItems = itemsWithActiveState.filter((i) => i.title === 'Documentation');

  const sidebarItemClickHanlder = (open: boolean, item: Item) => {
    if (item?.items && item.items?.length) {
      if (!open) toggleSidebar();
    }
    if (item.url) router.push(item.url);
  };

  // Add logic to determine if team management should be shown
  return (
    <SidebarGroup className='flex flex-col h-full'>
      <div className='flex-1 overflow-y-auto overflow-x-hidden'>
        <SidebarGroupLabel>Pages</SidebarGroupLabel>
        <SidebarMenu>
          {topItems.map(
            (item) =>
              item.visible !== false && (
                <Collapsible key={item.title} asChild defaultOpen={item.isActive} className='group/collapsible'>
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        side='left'
                        tooltip={item.title}
                        onClick={() => sidebarItemClickHanlder(open, item)}
                        className={cn(item.isActive && !item.items?.length && 'bg-muted')}
                      >
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                        <ChevronRightIcon
                          className={cn(
                            'ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90',
                            item.items?.length ? 'opacity-100' : 'opacity-0',
                          )}
                        />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent hidden={!item.items?.length}>
                      <SidebarMenuSub className='pr-0 mr-0'>
                        {item.items?.map((subItem) =>
                          subItem.max_role && (!company?.name || company?.my_role > subItem.max_role) ? null : (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton asChild>
                                <Link
                                  href={
                                    subItem.queryParams
                                      ? Object.entries(subItem.queryParams).reduce(
                                          (url, [key, value]) => url + `${key}=${value}&`,
                                          subItem.url + '?',
                                        )
                                      : subItem.url
                                  }
                                  className={cn('w-full', isSubItemActive(subItem, pathname, queryParams) && 'bg-muted')}
                                >
                                  <span className='flex items-center gap-2'>
                                    {subItem.icon && <subItem.icon className='w-4 h-4' />}
                                    {subItem.max_role && company?.name + ' '}
                                    {subItem.title}
                                  </span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ),
                        )}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ),
          )}
        </SidebarMenu>
      </div>

      {/* Sticky bottom section for Documentation */}
      <div className='sticky bottom-0 pt-2 w-full'>
        <SidebarMenu>
          {bottomItems.map((item) => (
            <Collapsible key={item.title} asChild defaultOpen={item.isActive} className='group/collapsible'>
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton side='left' tooltip={item.title} onClick={() => sidebarItemClickHanlder(open, item)}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    <ChevronRightIcon
                      className={cn(
                        'ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90',
                        item.items?.length ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent hidden={!item.items?.length}>
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton asChild>
                          <Link href={subItem.url}>
                            {subItem.icon && <subItem.icon className='w-4 h-4' />}
                            {subItem.title}
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          ))}
        </SidebarMenu>
      </div>
    </SidebarGroup>
  );
}

function isActive(item: Item, pathname: string, queryParams: URLSearchParams) {
  if (item.items) {
    return item.items.some((subItem) => {
      if (subItem.url === pathname) {
        if (subItem.queryParams) {
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
    if (item.queryParams) {
      return Object.entries(item.queryParams).every(([key, value]) => queryParams.get(key) === value);
    }
    return [...queryParams.keys()].length === 0;
  }
  return false;
}
function isSubItemActive(subItem: Item['items'][0], pathname: string, queryParams: URLSearchParams) {
  if (subItem.url !== pathname) {
    return false;
  }

  // If subitem has query params, they must all match
  if (subItem.queryParams) {
    return Object.entries(subItem.queryParams).every(([key, value]) => queryParams.get(key) === value);
  }

  // If no query params defined on subitem, URL must have no query params
  return queryParams.size === 0;
}
