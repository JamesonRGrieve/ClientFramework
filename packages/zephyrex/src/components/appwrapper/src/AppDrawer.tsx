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

/**
 * The app wrapper's bottom drawer, beside its two side menus: one drawer for the whole app, which a
 * page fills with `useAppDrawer().open(…)` or `<AppDrawerContent>`. It slides up from the bottom,
 * drags down to dismiss, stops at 85% of the screen's height and clears a phone's home indicator.
 * ZephyrexApp mounts it, as it does the context sidebar.
 */
export function AppDrawerProvider({ children }: { children: ReactNode }): ReactElement {
  const [shown, setShown] = useState<DrawerShown | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback((content: ReactNode, title: string, description?: string): void => {
    setShown({ title, description, content });
    setIsOpen(true);
  }, []);
  const close = useCallback((): void => {
    setIsOpen(false);
  }, []);
  const api = useMemo<AppDrawerApi>(() => ({ open, close, isOpen }), [open, close, isOpen]);

  return (
    <AppDrawerContext.Provider value={api}>
      {children}
      <Drawer open={isOpen} onOpenChange={setIsOpen} shouldScaleBackground={false}>
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
