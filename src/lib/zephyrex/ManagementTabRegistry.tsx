// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { createContext, type JSX, type ReactNode, Suspense, useContext, useMemo } from 'react';
import { useActiveExtensions } from './ExtensionRegistry';
import { type Role, useRole } from './hooks';
import type { ManagementTab, ZephyrexClientExtension } from './types';

const DEFAULT_PRIORITY = 50;

interface ManagementTabContextValue {
  tabs: ManagementTab[];
}

const ManagementTabContext = createContext<ManagementTabContextValue>({ tabs: [] });

/** Account-page sections from the extensions the server has loaded, lowest priority first. */
export function useManagementTabs(): ManagementTab[] {
  return useContext(ManagementTabContext).tabs;
}

export function ManagementTabProvider({
  extensions,
  children,
}: {
  extensions: ZephyrexClientExtension[];
  children: ReactNode;
}): JSX.Element {
  const { active } = useActiveExtensions(extensions);
  const tabs = useMemo(
    () =>
      active
        .flatMap((extension) => extension.managementTabs ?? [])
        .sort((a, b) => (a.priority ?? DEFAULT_PRIORITY) - (b.priority ?? DEFAULT_PRIORITY)),
    [active],
  );

  return <ManagementTabContext value={{ tabs }}>{children}</ManagementTabContext>;
}

/** The tabs `role` may see: a tab without `requireRole` is for every signed-in user. */
export function visibleTabs(tabs: readonly ManagementTab[], role: Role): ManagementTab[] {
  return tabs.filter((tab) => {
    if (tab.requireRole === undefined) {
      return true;
    }
    return tab.requireRole === 'superadmin' ? role.isSuperAdmin : role.isAdmin;
  });
}

export const managementAnchor = (tab: ManagementTab): string => `manage-${tab.id}`;

/** Renders the extensions' account-page sections the signed-in user may see, each linkable by its anchor. */
export function ManagementSections(): JSX.Element {
  const tabs = visibleTabs(useManagementTabs(), useRole());
  return (
    <>
      {tabs.map((tab) => {
        const Section = tab.component;
        return (
          <section key={tab.id} id={managementAnchor(tab)} aria-label={tab.label} className='scroll-mt-16'>
            <Suspense fallback={<p className='text-sm text-muted-foreground'>Loading {tab.label}…</p>}>
              <Section />
            </Suspense>
          </section>
        );
      })}
    </>
  );
}
