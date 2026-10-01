// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { createContext, useContext, type ComponentType, type ReactNode } from 'react';
import { SidebarContent } from '../../components/appwrapper/src/SidebarContentManager';

export interface PageSlotDefinition {
  position: 'before' | 'after' | 'replace' | 'sidebar';
  component: ComponentType<{ pageProps?: Record<string, unknown> | undefined }>;
  priority?: number;
}

export interface PageSlots {
  [pageName: string]: PageSlotDefinition[];
}

const DEFAULT_PRIORITY = 50;

const PageSlotsContext = createContext<PageSlots>({});

export function PageSlotsProvider({ slots, children }: { slots: PageSlots; children: ReactNode }) {
  return <PageSlotsContext value={slots}>{children}</PageSlotsContext>;
}

/** The slots registered for `pageName`, lowest priority first. The shared context is never reordered. */
export function usePageSlots(pageName: string): PageSlotDefinition[] {
  const slots = useContext(PageSlotsContext);
  return [...(slots[pageName] ?? [])].sort((a, b) => (a.priority ?? DEFAULT_PRIORITY) - (b.priority ?? DEFAULT_PRIORITY));
}

const slotKey = (slot: PageSlotDefinition): string =>
  `${slot.position}:${slot.priority ?? DEFAULT_PRIORITY}:${slot.component.displayName ?? slot.component.name}`;

const renderSlots = (slots: PageSlotDefinition[], pageProps: Record<string, unknown> | undefined): ReactNode =>
  slots.map((slot) => {
    const SlotComponent = slot.component;
    return <SlotComponent key={slotKey(slot)} pageProps={pageProps} />;
  });

/**
 * Renders a built-in page with the content extensions inject into it: `before`/`after`
 * slots around the page, `sidebar` slots after the page's own context sidebar, and a
 * `replace` slot instead of everything (the lowest-priority one wins).
 */
export function PageWithSlots({
  name,
  children,
  pageProps,
  sidebar,
  sidebarTitle,
}: {
  name: string;
  children: ReactNode;
  pageProps?: Record<string, unknown>;
  sidebar?: ReactNode;
  sidebarTitle?: string;
}) {
  const slots = usePageSlots(name);
  const replace = slots.find((slot) => slot.position === 'replace');
  if (replace) {
    const ReplacementComponent = replace.component;
    return <ReplacementComponent pageProps={pageProps} />;
  }

  const sidebarSlots = slots.filter((slot) => slot.position === 'sidebar');
  const hasSidebar = sidebar !== undefined || sidebarSlots.length > 0;

  return (
    <>
      {renderSlots(
        slots.filter((slot) => slot.position === 'before'),
        pageProps,
      )}
      {children}
      {renderSlots(
        slots.filter((slot) => slot.position === 'after'),
        pageProps,
      )}
      {hasSidebar && (
        <SidebarContent {...(sidebarTitle !== undefined ? { title: sidebarTitle } : {})}>
          {sidebar}
          {renderSlots(sidebarSlots, pageProps)}
        </SidebarContent>
      )}
    </>
  );
}
