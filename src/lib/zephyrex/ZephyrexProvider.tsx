// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { ZephyrexConfig, NavItemDefinition, RouteDefinition, ZephyrexClientExtension } from './types';
import type { PageSlots } from './PageSlots';
import { PageSlotsProvider } from './PageSlots';

interface ZephyrexContextValue {
  config: ZephyrexConfig;
  routes: RouteDefinition[];
  navItems: NavItemDefinition[];
  activeExtensions: ZephyrexClientExtension[];
}

const ZephyrexContext = createContext<ZephyrexContextValue | null>(null);

export function useZephyrexConfig(): ZephyrexContextValue {
  const ctx = useContext(ZephyrexContext);
  if (!ctx) {
    throw new Error('useZephyrexConfig must be used within a ZephyrexProvider');
  }
  return ctx;
}

function mergePageSlots(...slotSources: (PageSlots | undefined)[]): PageSlots {
  const merged: PageSlots = {};
  for (const source of slotSources) {
    if (!source) continue;
    for (const [page, slots] of Object.entries(source)) {
      merged[page] = [...(merged[page] ?? []), ...slots];
    }
  }
  return merged;
}

export function ZephyrexProvider({
  config,
  children,
}: {
  config: ZephyrexConfig;
  children: ReactNode;
}) {
  const value = useMemo<ZephyrexContextValue>(() => {
    const extensions = config.extensions ?? [];
    const extensionRoutes = extensions.flatMap((ext) => ext.pages ?? []);
    const extensionNavItems = extensions.flatMap((ext) => ext.navItems ?? []);

    return {
      config,
      routes: [...(config.pages ?? []), ...extensionRoutes],
      navItems: [...(config.navItems ?? []), ...extensionNavItems],
      activeExtensions: extensions,
    };
  }, [config]);

  const pageSlots = useMemo(
    () =>
      mergePageSlots(
        config.pageSlots,
        ...(config.extensions ?? []).map((ext) => ext.pageSlots),
      ),
    [config],
  );

  let tree = <>{children}</>;

  const extensionProviders = (config.extensions ?? []).flatMap((ext) => ext.providers ?? []);
  for (const Provider of extensionProviders) {
    tree = <Provider>{tree}</Provider>;
  }

  return (
    <ZephyrexContext value={value}>
      <PageSlotsProvider slots={pageSlots}>{tree}</PageSlotsProvider>
    </ZephyrexContext>
  );
}
