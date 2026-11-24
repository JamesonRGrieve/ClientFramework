// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import {
  createContext,
  type ReactElement,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { z } from 'zod';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';

/** What the drawer shows: a title (its heading, and its accessible name), an optional line under it, the body. */
interface DrawerShown {
  title: string;
  description?: string | undefined;
  content: ReactNode;
}

export interface AppDrawerApi {
  /** Pulls the drawer up from the bottom with `content` under `title`. */
  open: (content: ReactNode, title: string, description?: string) => void;
  /** Lets it go back down. */
  close: () => void;
  isOpen: boolean;
}

const AppDrawerContext = createContext<AppDrawerApi | undefined>(undefined);

/** Marks the history entry the open drawer holds, so the back button closes it instead of leaving. */
const DRAWER_ENTRY = '__zephyrexAppDrawer';

/** Whatever object the router keeps in the entry, kept as is; anything else counts as none. */
const EntryState = z.looseObject({});
const DrawerEntry = z.looseObject({ [DRAWER_ENTRY]: z.literal(true) });

/** Whether the entry on top of history is the one the drawer pushed. */
function isDrawerEntry(): boolean {
  return DrawerEntry.safeParse(window.history.state).success;
}

/**
 * Opening pushes one same-URL entry on top of the page's, keeping the router's own state in it, so a
 * phone's back button pops that entry (closing the drawer) instead of the page.
 */
function pushDrawerEntry(): void {
  const kept = EntryState.safeParse(window.history.state).data ?? {};
  window.history.pushState({ ...kept, [DRAWER_ENTRY]: true }, '');
}

/**
 * The app wrapper's bottom drawer, beside its two side menus: one drawer for the whole app, which a
 * page fills with `useAppDrawer().open(…)` or `<AppDrawerContent>`. It slides up from the bottom,
 * drags down to dismiss, stops at 85% of the screen's height and clears a phone's home indicator.
 * While it is up it holds one history entry, so a phone's back button closes it and stays on the page.
 * ZephyrexApp mounts it, as it does the context sidebar.
 */
export function AppDrawerProvider({ children }: { children: ReactNode }): ReactElement {
  const [shown, setShown] = useState<DrawerShown | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  // Whether the drawer's history entry is still in the stack: set on open, cleared by back or close.
  const holdsEntry = useRef(false);
  const open = useCallback((content: ReactNode, title: string, description?: string): void => {
    setShown({ title, description, content });
    setIsOpen(true);
    // A second open while one is up replaces the content and keeps the one entry.
    if (!holdsEntry.current) {
      holdsEntry.current = true;
      pushDrawerEntry();
    }
  }, []);
  const close = useCallback((): void => {
    setIsOpen(false);
    if (holdsEntry.current) {
      holdsEntry.current = false;
      // Closed some other way than back (button, swipe, scrim, Escape): pop the entry so history keeps
      // no dead step. If a navigation has already put a page on top of it, leave history alone.
      if (isDrawerEntry()) {
        window.history.back();
      }
    }
  }, []);
  useEffect(() => {
    const onPop = (): void => {
      if (holdsEntry.current && !isDrawerEntry()) {
        holdsEntry.current = false;
        setIsOpen(false);
      }
    };
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
    };
  }, []);
  const onOpenChange = useCallback(
    (next: boolean): void => {
      if (!next) {
        close();
      }
    },
    [close],
  );
  const api = useMemo<AppDrawerApi>(() => ({ open, close, isOpen }), [open, close, isOpen]);

  return (
    <AppDrawerContext.Provider value={api}>
      {children}
      <Drawer open={isOpen} onOpenChange={onOpenChange} shouldScaleBackground={false}>
        <DrawerContent className='mx-auto max-h-[85svh] w-full max-w-3xl pb-[env(safe-area-inset-bottom)]'>
          <DrawerHeader className='text-left'>
            <DrawerTitle>{shown?.title ?? ''}</DrawerTitle>
            {shown?.description === undefined ? (
              <DrawerDescription className='sr-only'>{shown?.title ?? ''}</DrawerDescription>
            ) : (
              <DrawerDescription>{shown.description}</DrawerDescription>
            )}
          </DrawerHeader>
          <div className='min-h-0 overflow-y-auto px-4 pb-4'>{shown?.content}</div>
        </DrawerContent>
      </Drawer>
    </AppDrawerContext.Provider>
  );
}

/** The app's bottom drawer: `open(content, title)`, `close()`, `isOpen`. Inside ZephyrexApp. */
export function useAppDrawer(): AppDrawerApi {
  const drawer = useContext(AppDrawerContext);
  if (drawer === undefined) {
    throw new Error('useAppDrawer must be used within an AppDrawerProvider (ZephyrexApp mounts one)');
  }
  return drawer;
}

/**
 * The drawer, declared from a page: while `open` is true it shows `children` under `title`; dragging
 * it down or pressing Escape calls `onOpenChange(false)`.
 */
export function AppDrawerContent({
  title,
  description,
  open,
  onOpenChange,
  children,
}: {
  title: string;
  description?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}): null {
  const { open: show, close, isOpen } = useAppDrawer();
  useEffect(() => {
    if (open) {
      show(children, title, description);
    }
  }, [open, children, title, description, show]);
  useEffect(() => {
    if (!open) {
      close();
    }
  }, [open, close]);
  // Only the drawer closing by itself (drag, Escape) reports back: it was open, it no longer is, and
  // the caller still says open.
  const wasOpen = useRef(false);
  useEffect(() => {
    if (wasOpen.current && !isOpen && open) {
      onOpenChange(false);
    }
    wasOpen.current = isOpen;
  }, [isOpen, open, onOpenChange]);
  return null;
}
