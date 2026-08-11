// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { createContext, useContext, type ComponentType, type ReactNode } from 'react';

export interface PageSlotDefinition {
  position: 'before' | 'after' | 'replace' | 'sidebar';
  component: ComponentType<{ pageProps?: Record<string, unknown> }>;
  priority?: number;
}

export interface PageSlots {
  [pageName: string]: PageSlotDefinition[];
}

const PageSlotsContext = createContext<PageSlots>({});

export function PageSlotsProvider({ slots, children }: { slots: PageSlots; children: ReactNode }) {
  return <PageSlotsContext value={slots}>{children}</PageSlotsContext>;
}

export function usePageSlots(pageName: string): PageSlotDefinition[] {
  const slots = useContext(PageSlotsContext);
  return (slots[pageName] ?? []).sort((a, b) => (a.priority ?? 50) - (b.priority ?? 50));
}

export function PageWithSlots({
  name,
  children,
  pageProps,
}: {
  name: string;
  children: ReactNode;
  pageProps?: Record<string, unknown>;
}) {
  const slots = usePageSlots(name);
  const before = slots.filter((s) => s.position === 'before');
  const after = slots.filter((s) => s.position === 'after');
  const replace = slots.find((s) => s.position === 'replace');

  if (replace) {
    const ReplacementComponent = replace.component;
    return <ReplacementComponent pageProps={pageProps} />;
  }

  return (
    <>
      {before.map((slot, i) => {
        const SlotComponent = slot.component;
        return <SlotComponent key={`before-${i}`} pageProps={pageProps} />;
      })}
      {children}
      {after.map((slot, i) => {
        const SlotComponent = slot.component;
        return <SlotComponent key={`after-${i}`} pageProps={pageProps} />;
      })}
    </>
  );
}
