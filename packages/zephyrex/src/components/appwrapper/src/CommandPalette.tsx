// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { useRouter } from 'next/navigation.js';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { LuSearch as Search } from 'react-icons/lu';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '@/components/ui/command';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import type { NavItemDefinition } from '@/lib/zephyrex/types';
import { useZephyrexConfig } from '@/lib/zephyrex/ZephyrexProvider';

/** A page the palette can open: its sidebar entry, flattened, under the sidebar's heading for it. */
interface Destination {
  title: string;
  url: string;
  group: string;
  icon?: NavItemDefinition['icon'];
}

const OTHER = 'Pages';

/** Every page in the sidebar (children included), each under the heading it sits under there. */
export function destinationsOf(items: readonly NavItemDefinition[]): Destination[] {
  const found: Destination[] = [];
  let heading = OTHER;
  for (const item of items) {
    heading = item.group ?? heading;
    found.push({ title: item.title, url: item.url, group: heading, ...(item.icon === undefined ? {} : { icon: item.icon }) });
    for (const child of item.children ?? []) {
      found.push({ title: `${item.title}: ${child.title}`, url: child.url, group: heading });
    }
  }
  return found.filter((destination) => destination.url !== '');
}

/** Whether the shortcut reads ⌘K: an Apple device. The server cannot know, so it renders Ctrl K. */
const isApple = (): boolean => /Mac|iPhone|iPad/u.test(navigator.platform);
const notApple = (): boolean => false;
const noSubscription = (): (() => void) => () => undefined;

/** The keys that open the palette: Ctrl+K, or ⌘K on a Mac. */
const isOpenKey = (event: KeyboardEvent): boolean => event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey);

/** Whether the key was pressed while typing somewhere, where "/" is just a character. */
const typing = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

/** "/" jumps to the page's own search field, when it has one (as on GitHub or Gmail). */
function focusPageSearch(event: KeyboardEvent): void {
  if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey || typing(event.target)) {return;}
  const field = document.querySelector<HTMLInputElement>('main input[type="search"], input[type="search"]');
  if (field === null) {return;}
  event.preventDefault();
  field.focus();
  field.select();
}

/**
 * Go anywhere from the keyboard: Ctrl+K (⌘K on a Mac) or the sidebar's search row opens a search
 * over every page the sidebar lists, grouped as the sidebar groups them; "/" focuses the page's own
 * search field.
 */
export function CommandPalette(): React.JSX.Element | null {
  const router = useRouter();
  const { navItems } = useZephyrexConfig();
  const [open, setOpen] = useState(false);
  const mac = useSyncExternalStore(noSubscription, isApple, notApple);

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (isOpenKey(event)) {
        event.preventDefault();
        setOpen((current) => !current);
      } else {
        focusPageSearch(event);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const destinations = destinationsOf(navItems);
  if (destinations.length === 0) {return null;}
  const groups = [...new Set(destinations.map((destination) => destination.group))];
  const go = (url: string): void => {
    setOpen(false);
    router.push(url);
  };

  return (
    <>
      <SidebarMenu className='px-2 pt-1'>
        <SidebarMenuItem>
          <SidebarMenuButton
            tooltip={mac ? 'Search (⌘K)' : 'Search (Ctrl K)'}
            onClick={() => setOpen(true)}
            className='border bg-background/40 text-muted-foreground hover:text-foreground'
          >
            <Search />
            <span className='flex-1'>Search…</span>
            <kbd className='pointer-events-none rounded border bg-muted px-1.5 font-mono text-[0.65rem] text-muted-foreground group-data-[collapsible=icon]:hidden'>
              {mac ? '⌘K' : 'Ctrl K'}
            </kbd>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder='Go to a page…' aria-label='Go to a page' />
        <CommandList className='max-h-[min(60dvh,420px)]'>
          <CommandEmpty>No page by that name.</CommandEmpty>
          {groups.map((group) => (
            <CommandGroup key={group} heading={group}>
              {destinations
                .filter((destination) => destination.group === group)
                .map((destination) => {
                  const Icon = destination.icon;
                  return (
                    <CommandItem
                      key={destination.url}
                      value={`${destination.title} ${destination.group}`}
                      onSelect={() => go(destination.url)}
                      className='gap-2'
                    >
                      {Icon !== undefined && <Icon className='size-4 text-muted-foreground' />}
                      {destination.title}
                      <CommandShortcut>{destination.url}</CommandShortcut>
                    </CommandItem>
                  );
                })}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
