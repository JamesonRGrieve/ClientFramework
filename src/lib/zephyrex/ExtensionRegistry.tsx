// SPDX-License-Identifier: AGPL-3.0-or-later
'use client';

import { useMemo } from 'react';
import type { ZephyrexClientExtension } from './types';
import { useServerExtensions } from './hooks';

export function useActiveExtensions(registeredExtensions: ZephyrexClientExtension[]): {
  active: ZephyrexClientExtension[];
  loading: boolean;
} {
  const { data: serverExtensions, isLoading } = useServerExtensions();

  // Until the server says which extensions it runs (or with no session to ask), only the client
  // extensions that need no server extension are active.
  const active = useMemo(() => {
    if (serverExtensions === undefined) {
      return registeredExtensions.filter((ext) => ext.serverExtension === undefined);
    }
    const serverNames = new Set(serverExtensions.map((e) => e.name));
    return registeredExtensions.filter((ext) => ext.serverExtension === undefined || serverNames.has(ext.serverExtension));
  }, [registeredExtensions, serverExtensions]);

  return { active, loading: isLoading };
}

export function AutoSettingsPanel({ extensionName }: { extensionName: string }) {
  return (
    <div className='p-4'>
      <h3 className='text-lg font-semibold mb-2'>{extensionName} Settings</h3>
      <p className='text-sm text-muted-foreground'>Configure {extensionName} via the server API settings endpoint.</p>
    </div>
  );
}
