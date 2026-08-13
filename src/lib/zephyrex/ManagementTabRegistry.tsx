// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { ManagementTab, ZephyrexClientExtension } from './types';

interface ManagementTabContextValue {
  tabs: ManagementTab[];
}

const ManagementTabContext = createContext<ManagementTabContextValue>({ tabs: [] });

export function useManagementTabs(): ManagementTab[] {
  return useContext(ManagementTabContext).tabs;
}

export function ManagementTabProvider({
  extensions,
  children,
}: {
  extensions: ZephyrexClientExtension[];
  children: ReactNode;
}) {
  const tabs = useMemo(
    () => extensions.flatMap((ext) => ext.managementTabs ?? []).sort((a, b) => (a.priority ?? 50) - (b.priority ?? 50)),
    [extensions],
  );

  return <ManagementTabContext value={{ tabs }}>{children}</ManagementTabContext>;
}
